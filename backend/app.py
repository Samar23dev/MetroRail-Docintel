from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import math
from collections import Counter
from dotenv import load_dotenv
import json

# --- New Imports for File Processing & API Calls ---
import requests
import fitz  # PyMuPDF
import docx # python-docx

load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB Connection
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = os.getenv('DB_NAME', 'kmrl_docintel')
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY') # --- IMPORTANT: Add this to your .env file ---

client = MongoClient(MONGO_URI)
db = client[DB_NAME]
documents_collection = db['documents']

# Create indexes
documents_collection.create_index('title')
documents_collection.create_index('department')
documents_collection.create_index('type')
documents_collection.create_index('tags')


# -------------------------
# FILE EXTRACTION FUNCTION
# -------------------------

def extract_text_from_file(file_storage):
    """Extracts raw text from an uploaded file (PDF, DOCX, TXT, DOC, XLS, XLSX, JPG, PNG)."""
    filename = file_storage.filename
    text = ""
    try:
        # Reset file pointer to the beginning
        file_storage.seek(0)
        
        # PDF files
        if filename.endswith('.pdf'):
            pdf_document = fitz.open(stream=file_storage.read(), filetype="pdf")
            for page_num in range(len(pdf_document)):
                page = pdf_document.load_page(page_num)
                blocks = page.get_text("blocks")
                blocks.sort(key=lambda b: (b[1], b[0]))
                for b in blocks:
                    text += b[4]
            pdf_document.close()
        
        # DOCX files (modern Word format)
        elif filename.endswith('.docx'):
            doc = docx.Document(file_storage)
            
            for para in doc.paragraphs:
                text += para.text + "\n"
            
            if doc.tables:
                text += "\n\n--- Extracted Tables ---\n"
                for table in doc.tables:
                    for row in table.rows:
                        row_text = " | ".join(cell.text.strip() for cell in row.cells)
                        text += row_text + "\n"
                    text += "------------------------\n"
        
        # DOC files (older Word format - extract as text)
        elif filename.endswith('.doc'):
            # For .doc files, we try to extract using docx if possible, otherwise return placeholder
            try:
                doc = docx.Document(file_storage)
                for para in doc.paragraphs:
                    text += para.text + "\n"
            except:
                # If docx library can't read it, treat as text
                file_storage.seek(0)
                try:
                    text = file_storage.read().decode('utf-8', errors='ignore')
                except:
                    text = "[Document appears to be in .doc format - please convert to .docx for better extraction]"
        
        # TXT files
        elif filename.endswith('.txt'):
            text = file_storage.read().decode('utf-8')
        
        # XLS/XLSX files (Excel) - extract as text
        elif filename.endswith('.xls') or filename.endswith('.xlsx'):
            try:
                import openpyxl
                from openpyxl import load_workbook
                
                file_storage.seek(0)
                workbook = load_workbook(file_storage)
                
                for sheet_name in workbook.sheetnames:
                    sheet = workbook[sheet_name]
                    text += f"\n--- Sheet: {sheet_name} ---\n"
                    
                    for row in sheet.iter_rows(values_only=True):
                        row_text = " | ".join(str(cell) if cell is not None else "" for cell in row)
                        if row_text.strip():
                            text += row_text + "\n"
            except ImportError:
                # openpyxl not installed, extract what we can
                file_storage.seek(0)
                try:
                    text = file_storage.read().decode('utf-8', errors='ignore')
                except:
                    text = "[Excel file detected but cannot be processed without openpyxl library]"
        
        # Image files (JPG, PNG) - OCR or placeholder
        elif filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png'):
            try:
                from PIL import Image
                import pytesseract
                
                file_storage.seek(0)
                image = Image.open(file_storage)
                text = pytesseract.image_to_string(image)
                
                if not text.strip():
                    text = "[Image file detected - no readable text extracted. Please ensure image contains text.]"
            except ImportError:
                # OCR libraries not installed
                text = "[Image file detected. OCR capability not available. Please install Pillow and pytesseract to enable text extraction from images.]"
            except Exception as e:
                text = f"[Image file detected but could not be processed: {str(e)}]"
        
        else:
            return None  # Unsupported file type
    
    except Exception as e:
        print(f"Error extracting text from {filename}: {str(e)}")
        return None
    
    return text if text.strip() else "[File processed but no text content found]"

# -------------------------
# [UPDATED] GEMINI AI ANALYSIS FUNCTION - NOW INCLUDES STATUS
# -------------------------

def analyze_document_with_gemini(text_content):
    """Uses Gemini API to generate summary, tags, and other metadata, including a suggested status."""
    
    if not GEMINI_API_KEY:
        print("GEMINI_API_KEY not found. Returning mock data.")
        return {
            "title": "Mock Title (GEMINI_API_KEY not set)",
            "summary": "This is mock data. Please set your GEMINI_API_KEY in .env to enable AI analysis.",
            "tags": ["error", "mock-data"],
            "department": "Unknown",
            "type": "Unknown",
            "language": "English",
            "status": "review",
            "tables_data": [],
            "figures_data": [],
            "charts": []
        }

    # Truncate text intelligently to avoid exceeding API limits
    # Gemini 2.5-flash context window is ~1M tokens, but we truncate to be safe
    # Average English word ≈ 1.3 tokens, so ~12000 words ≈ 15600 tokens
    truncated_text = text_content[:12000]

    api_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"

    # --- [OPTIMIZED] Define the JSON structure - more concise ---
    response_schema = {
        "type": "OBJECT",
        "properties": {
            "title": {"type": "STRING"},
            "summary": {"type": "STRING"},
            "tags": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "department": {"type": "STRING"},
            "type": {"type": "STRING"},
            "status": {
                "type": "STRING",
                "enum": ["urgent","approved", "review"]
            },
            "tables_data": { 
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT", 
                    "properties": {
                        "caption": {"type": "STRING"},
                        "data": {
                            "type": "ARRAY",
                            "items": {
                                "type": "ARRAY",
                                "items": {"type": "STRING"}
                            }
                        }
                    },
                    "required": ["caption", "data"]
                }
            },
            "figures_data": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "description": {"type": "STRING"},
                        "values": {
                            "type": "ARRAY",
                            "items": {"type": "STRING"}
                        },
                        "type": {
                            "type": "STRING",
                            "enum": ["number", "percentage", "currency", "metric", "ratio"]
                        }
                    },
                    "required": ["description", "values", "type"]
                }
            },
            "charts": {
                "type": "ARRAY",
                "items": {
                    "type": "OBJECT",
                    "properties": {
                        "title": {"type": "STRING"},
                        "description": {"type": "STRING"},
                        "chart_type": {
                            "type": "STRING",
                            "enum": ["bar", "line", "pie", "area", "scatter"]
                        },
                        "data_points": {
                            "type": "ARRAY",
                            "items": {
                                "type": "OBJECT",
                                "properties": {
                                    "label": {"type": "STRING"},
                                    "value": {"type": "STRING"}
                                }
                            }
                        }
                    },
                    "required": ["title", "chart_type", "data_points"]
                }
            }
        },
        "required": ["title", "summary", "tags", "department", "type", "status", "tables_data", "figures_data", "charts"]
    }

    # --- [OPTIMIZED] Concise prompt to reduce context window usage ---
    system_prompt = (
        "Analyze document and return JSON with: title, summary (2-3 sentences), tags, department, type, status. "
        "Status: 'urgent' (critical/incident), 'approved' (routine/finalized), 'review' (unclear). "
        "Extract: tables (caption + data), figures (description/values/type: number|percentage|currency|metric|ratio), "
        "charts (title/type: bar|line|pie|area|scatter with data_points having label/value). "
        "Return empty arrays if none found."
    )


    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{
            "parts": [{"text": f"Analyze this document: {truncated_text}"}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "responseSchema": response_schema
        }
    }

    try:
        response = requests.post(api_url, json=payload, headers={'Content-Type': 'application/json'})
        response.raise_for_status() # Raise an error for bad status codes
        
        result = response.json()
        
        generated_json_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '{}')
        
        processed_data = json.loads(generated_json_text)

        print("--- GEMINI ANALYSIS RESULT ---")
        print(json.dumps(processed_data, indent=2))
        print("------------------------------")
        
        processed_data['language'] = "English" # Default
        
        return processed_data
        
    except Exception as e:
        print(f"Error calling Gemini API: {str(e)}")
        # Fallback in case of API error
        return {
            "title": "Error During Analysis",
            "summary": f"An error occurred while analyzing the document: {str(e)}",
            "tags": ["error"],
            "department": "Unknown",
            "type": "Unknown",
            "language": "English",
            "status": "review",
            "tables_data": [],
            "figures_data": [],
            "charts": []
        }

# -------------------------
# SEMANTIC SEARCH (IMPROVED WITH NLP)
# -------------------------

# Common stopwords to exclude from search (improves relevance)
STOPWORDS = {
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
    'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
    'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
    'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
    'this', 'that', 'these', 'those', 'it', 'its', 'they', 'them', 'you', 'i'
}

# Synonym mapping for better semantic matching
SYNONYMS = {
    'safety': ['secure', 'protection', 'security', 'safe'],
    'maintenance': ['repair', 'servicing', 'upkeep', 'maintain'],
    'invoice': ['bill', 'receipt', 'payment', 'charge'],
    'report': ['summary', 'analysis', 'document'],
    'policy': ['rule', 'regulation', 'guideline', 'directive'],
    'urgent': ['critical', 'immediate', 'emergency', 'priority'],
    'engineering': ['technical', 'construction', 'design'],
    'operation': ['operational', 'running', 'execution'],
}

def preprocess_text(text):
    """Preprocess text: lowercase, remove punctuation, filter stopwords."""
    import string
    text = text.lower()
    text = text.translate(str.maketrans('', '', string.punctuation))
    words = text.split()
    words = [w for w in words if w not in STOPWORDS and len(w) > 2]
    return words

def expand_query_with_synonyms(words):
    """Expand query with synonyms for better matching"""
    expanded = list(words)
    for word in words:
        if word in SYNONYMS:
            expanded.extend(SYNONYMS[word])
    return expanded

def text_to_tfidf_vector(text):
    """Convert text to TF-IDF-like vector"""
    words = preprocess_text(text)
    vector = Counter(words)
    boosted_vector = {}
    for word, count in vector.items():
        weight = count * (len(word) / 5.0)
        boosted_vector[word] = weight
    return boosted_vector

def cosine_similarity(vec1, vec2):
    """Enhanced cosine similarity"""
    if not vec1 or not vec2:
        return 0.0
    intersection = set(vec1.keys()) & set(vec2.keys())
    if not intersection:
        return 0.0
    numerator = sum(vec1[x] * vec2[x] for x in intersection)
    sum1 = sum(v * v for v in vec1.values())
    sum2 = sum(v * v for v in vec2.values())
    if sum1 == 0 or sum2 == 0:
        return 0.0
    return numerator / math.sqrt(sum1 * sum2)

def semantic_search(query, collection, top_k=10):
    """Improved semantic search with NLP enhancements"""
    query_words = preprocess_text(query)
    expanded_query_words = expand_query_with_synonyms(query_words)
    query_vec = text_to_tfidf_vector(" ".join(expanded_query_words))
    
    print(f"[SEARCH] Query: '{query}'")
    print(f"[SEARCH] Processed: {query_words}")
    
    results = []
    for doc in collection.find({}):
        full_text = (
            (doc.get("title") or "") + " " +
            (doc.get("summary") or "") + " " +
            (doc.get("department") or "") + " " +
            (doc.get("type") or "") + " " +
            " ".join(doc.get("tags") or [])
        )
        
        doc_vec = text_to_tfidf_vector(full_text)
        score = cosine_similarity(query_vec, doc_vec)
        
        # Boost score for metadata matches
        metadata_boost = 0.0
        query_lower = query.lower()
        if doc.get("department") and doc["department"].lower() in query_lower:
            metadata_boost += 0.3
        if doc.get("type") and doc["type"].lower() in query_lower:
            metadata_boost += 0.3
        for tag in doc.get("tags", []):
            if tag.lower() in query_lower:
                metadata_boost += 0.1
        
        final_score = min(score + metadata_boost, 1.0)
        
        if final_score > 0.05:
            doc["similarity"] = round(final_score, 4)
            doc["_score"] = round(final_score, 4)
            results.append(doc)

    results.sort(key=lambda x: x["similarity"], reverse=True)

    for r in results:
        r['_id'] = str(r['_id'])

    return results[:top_k]


# -------------------------
#       ROUTES
# -------------------------

@app.route('/api/documents', methods=['GET'])
def get_documents():
    try:
        search_query = request.args.get('search', '')
        department = request.args.get('department', '')
        doc_type = request.args.get('type', '')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        query_filter = {}

        if search_query:
            query_filter['$or'] = [
                {'title': {'$regex': search_query, '$options': 'i'}},
                {'summary': {'$regex': search_query, '$options': 'i'}},
                {'tags': {'$regex': search_query, '$options': 'i'}},
                {'content': {'$regex': search_query, '$options': 'i'}}
            ]
        
        if department and department != 'all':
            query_filter['department'] = department
        
        if doc_type and doc_type != 'all-types':
            formatted_type = doc_type.replace('-', ' ').title()
            query_filter['type'] = formatted_type
        
        total = documents_collection.count_documents(query_filter)
        
        skip = (page - 1) * limit
        documents = list(documents_collection.find(query_filter)
                                   .sort('date', -1)
                                   .skip(skip)
                                   .limit(limit))
        
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        
        return jsonify({
            'documents': documents,
            'pagination': {
                'total': total,
                'page': page,
                'limit': limit,
                'pages': (total + limit - 1) // limit
            }
        })
    except Exception as e:
        print(f"Error in get_documents: {str(e)}")
        return jsonify({'error': str(e)}), 500


# --- [UPDATED] UPLOAD ROUTE - Status is now AI-assigned ---
@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # 1. Extract text from the file
        print(f"Processing file: {file.filename}")
        text_content = extract_text_from_file(file)
        
        if text_content is None:
            return jsonify({'error': 'Unsupported file type or error reading file'}), 400
        
        if not text_content.strip():
            return jsonify({'error': 'File appears to be empty'}), 400
            
        print(f"Extracted {len(text_content)} characters.")

        # 2. Analyze text with Gemini (includes status now)
        print("Analyzing document with Gemini AI...")
        processed_data = analyze_document_with_gemini(text_content)
        print("Analysis complete.")

        # 3. Add remaining data (status is already in processed_data)
        processed_data['content'] = text_content # Store the full text
        processed_data['date'] = datetime.now()
        # processed_data['status'] = 'review' # <-- REMOVED: Status is now AI-assigned
        processed_data['source'] = 'uploaded'
        processed_data['starred'] = False
        
        # 4. Insert into database
        result = documents_collection.insert_one(processed_data)
        processed_data['_id'] = str(result.inserted_id)
        
        print(f"Successfully added document {result.inserted_id} to database.")
        return jsonify(processed_data), 201
        
    except Exception as e:
        print(f"Error in upload_document: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    try:
        result = documents_collection.delete_one({'_id': ObjectId(doc_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Document not found'}), 404
        return jsonify({'message': 'Document deleted successfully'}), 200
    except Exception as e:
        print(f"Error in delete_document: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/search/semantic', methods=['POST'])
def search_semantic_route():
    try:
        data = request.get_json()
        query = data.get('query', '')

        if not query:
            return jsonify({'error': 'Query is required'}), 400

        results = semantic_search(query, documents_collection)
        
        return jsonify({'results': results})
    except Exception as e:
        print(f"Error in semantic search: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['GET'])
def get_document(doc_id):
    try:
        doc = documents_collection.find_one({'_id': ObjectId(doc_id)})
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        
        doc['_id'] = str(doc['_id'])
        return jsonify(doc)
    except Exception as e:
        print(f"Error in get_document: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['PUT'])
def update_document(doc_id):
    try:
        data = request.get_json()
        update_data = {}

        if 'status' in data:
            update_data['status'] = data['status']
        if 'tags' in data:
            update_data['tags'] = data['tags']
        if 'starred' in data: 
            update_data['starred'] = data['starred'] 
        
        if not update_data: 
            return jsonify({'error': 'No update fields provided'}), 400

        result = documents_collection.update_one(
            {'_id': ObjectId(doc_id)},
            {'$set': update_data}
        )
        
        if result.matched_count == 0:
            return jsonify({'error': 'Document not found'}), 404
        
        return jsonify({'message': 'Document updated successfully'}), 200
    except Exception as e:
        print(f"Error in update_document: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        total_docs = documents_collection.count_documents({})
        urgent_docs = documents_collection.count_documents({'status': 'urgent'})
        today_docs = documents_collection.count_documents({
            'date': {'$gte': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
        
        return jsonify({
            'total_documents': total_docs,
            'urgent_items': urgent_docs,
            'documents_today': today_docs
        })
    except Exception as e:
        print(f"Error in get_stats: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>/download', methods=['GET'])
def download_document(doc_id):
    """Download a document as a text file with metadata."""
    try:
        doc = documents_collection.find_one({'_id': ObjectId(doc_id)})
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        
        # Create a formatted text file content
        content = []
        content.append(f"{'='*80}")
        content.append(f"DOCUMENT: {doc.get('title', 'Untitled')}")
        content.append(f"{'='*80}\n")
        
        # Add metadata
        content.append("METADATA:")
        content.append(f"  Department: {doc.get('department', 'N/A')}")
        content.append(f"  Type: {doc.get('type', 'N/A')}")
        content.append(f"  Date: {doc.get('date', 'N/A')}")
        content.append(f"  Status: {doc.get('status', 'N/A')}")
        content.append(f"  Source: {doc.get('source', 'N/A')}")
        content.append(f"  Language: {doc.get('language', 'N/A')}")
        content.append(f"  ID: {str(doc['_id'])}\n")
        
        # Add tags
        if doc.get('tags'):
            content.append(f"Tags: {', '.join(doc.get('tags', []))}\n")
        
        # Add summary
        if doc.get('summary'):
            content.append("SUMMARY:")
            content.append(f"{doc.get('summary', '')}\n")
        
        # Add tables
        if doc.get('tables_data') and len(doc.get('tables_data', [])) > 0:
            content.append("\nTABLES:")
            content.append("-" * 80)
            for idx, table_obj in enumerate(doc.get('tables_data', []), 1):
                caption = table_obj.get('caption', f'Table {idx}')
                content.append(f"\n{caption}:")
                
                if table_obj.get('data') and len(table_obj.get('data', [])) > 0:
                    table_data = table_obj.get('data', [])
                    # Add header
                    header = table_data[0]
                    content.append(" | ".join(str(h) for h in header))
                    content.append("-" * 80)
                    # Add rows
                    for row in table_data[1:]:
                        content.append(" | ".join(str(cell) for cell in row))
                content.append("")
        
        # Add full content
        if doc.get('content'):
            content.append("\nFULL CONTENT:")
            content.append("-" * 80)
            content.append(doc.get('content', ''))
        
        content.append(f"\n{'='*80}")
        content.append("End of Document")
        content.append(f"{'='*80}")
        
        file_content = "\n".join(content)
        
        # Create response with file download
        response = make_response(file_content)
        
        # Create sanitized filename
        safe_title = doc.get('title', 'document').replace(" ", "_").replace("/", "_")
        filename = f"{safe_title}_{str(doc['_id'])[:8]}.txt"
        
        response.headers['Content-Disposition'] = f'attachment; filename="{filename}"'
        response.headers['Content-Type'] = 'text/plain; charset=utf-8'
        
        return response, 200
    except Exception as e:
        print(f"Error in download_document: {str(e)}")
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy'})


if __name__ == '__main__':
    if not GEMINI_API_KEY:
        print("🚨 Warning: GEMINI_API_KEY environment variable is not set.")
        print("AI features will be disabled, and mock data will be used.")
    app.run(debug=True, port=5000)
