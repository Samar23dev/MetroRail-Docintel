from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from pymongo import MongoClient
from bson.objectid import ObjectId
from datetime import datetime
import os
import math
from collections import Counter
from dotenv import load_dotenv
import json
from io import BytesIO
import logging
import base64

# --- New Imports for File Processing & API Calls ---
import requests
import fitz  # PyMuPDF
import docx # python-docx

load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Helper function to extract text from images using Gemini API
def extract_image_text_with_gemini(image_data, filename):
    """
    Uses Google Gemini API to extract text from image files (JPG, PNG, etc.)
    This replaces the need for pytesseract/Tesseract
    """
    if not GEMINI_API_KEY:
        logger.warning(f"GEMINI_API_KEY not set. Cannot extract text from image: {filename}")
        return "[Image file detected. Cannot extract text without GEMINI_API_KEY in .env]"
    
    try:
        # Encode image data to base64
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        
        # Determine image type from filename
        if filename.lower().endswith(('.jpg', '.jpeg')):
            media_type = "image/jpeg"
        elif filename.lower().endswith('.png'):
            media_type = "image/png"
        elif filename.lower().endswith('.gif'):
            media_type = "image/gif"
        elif filename.lower().endswith('.webp'):
            media_type = "image/webp"
        else:
            media_type = "image/jpeg"  # default
        
        # Call Gemini API
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
        
        headers = {"Content-Type": "application/json"}
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": "Please extract all visible text from this image. Return ONLY the extracted text content, nothing else."
                        },
                        {
                            "inlineData": {
                                "mimeType": media_type,
                                "data": image_base64
                            }
                        }
                    ]
                }
            ]
        }
        
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        
        if "contents" in result and len(result["contents"]) > 0:
            text = result["contents"][0]["parts"][0].get("text", "")
            if text.strip():
                logger.info(f"Successfully extracted text from image: {filename}")
                return text
            else:
                return "[Image file detected - no readable text extracted by Gemini]"
        else:
            return "[Image file processed by Gemini but no text found]"
            
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Gemini API for image {filename}: {str(e)}")
        return f"[Image file detected but could not extract text: {str(e)}]"
    except Exception as e:
        logger.error(f"Unexpected error extracting text from image {filename}: {str(e)}")
        return f"[Error processing image {filename}: {str(e)}]"

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
        
        # Image files (JPG, PNG) - use Gemini API for OCR
        elif filename.endswith('.jpg') or filename.endswith('.jpeg') or filename.endswith('.png') or filename.endswith('.gif') or filename.endswith('.webp'):
            file_storage.seek(0)
            image_data = file_storage.read()
            text = extract_image_text_with_gemini(image_data, filename)
        
        else:
            return None  # Unsupported file type
    
    except Exception as e:
        logger.error(f"Error extracting text from {filename}: {str(e)}", exc_info=True)
        return None
    
    return text if text.strip() else "[File processed but no text content found]"

# -------------------------
# [UPDATED] GEMINI AI ANALYSIS FUNCTION - NOW INCLUDES STATUS
# -------------------------

def analyze_document_with_gemini(text_content):
    """Uses Gemini API to generate summary, tags, and other metadata, including a suggested status."""
    
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY not found. Returning mock data.")
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

        logger.info("Gemini analysis completed successfully")
        
        processed_data['language'] = "English" # Default
        
        return processed_data
        
    except Exception as e:
        logger.error(f"Error calling Gemini API: {str(e)}", exc_info=True)
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
    
    logger.info(f"Semantic search - Query: '{query}', Processed terms: {query_words}")
    
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
        logger.error(f"Error in get_documents: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


# --- [UPDATED] UPLOAD ROUTE - Status is now AI-assigned, supports multiple files ---
@app.route('/api/documents/upload', methods=['POST'])
def upload_document():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        # Handle multiple files - getlist() returns all files with key 'file'
        files = request.files.getlist('file')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'No file selected'}), 400
        
        uploaded_documents = []
        errors = []
        
        # Process each file
        for file in files:
            try:
                if file.filename == '':
                    errors.append({'filename': 'Unknown', 'error': 'Empty filename'})
                    continue
                
                # 1. Extract text from the file
                logger.info(f"Processing file: {file.filename}")
                text_content = extract_text_from_file(file)
                
                if text_content is None:
                    errors.append({'filename': file.filename, 'error': 'Unsupported file type or error reading file'})
                    continue
                
                if not text_content.strip():
                    errors.append({'filename': file.filename, 'error': 'File appears to be empty'})
                    continue
                    
                logger.info(f"Extracted {len(text_content)} characters from {file.filename}")

                # 2. Analyze text with Gemini (includes status now)
                logger.info(f"Analyzing document '{file.filename}' with Gemini AI...")
                processed_data = analyze_document_with_gemini(text_content)
                logger.info(f"Analysis complete for '{file.filename}'")

                # 3. Add remaining data (status is already in processed_data)
                processed_data['content'] = text_content # Store the full text
                processed_data['date'] = datetime.now()
                processed_data['source'] = 'uploaded'
                processed_data['starred'] = False
                
                # 4. Insert into database
                result = documents_collection.insert_one(processed_data)
                processed_data['_id'] = str(result.inserted_id)
                
                logger.info(f"Successfully added document '{file.filename}' ({result.inserted_id}) to database.")
                uploaded_documents.append(processed_data)
                
            except Exception as file_error:
                logger.error(f"Error processing file '{file.filename}': {str(file_error)}", exc_info=True)
                errors.append({'filename': file.filename, 'error': str(file_error)})
                continue
        
        # Return response with uploaded documents and any errors
        response = {
            'uploaded_count': len(uploaded_documents),
            'error_count': len(errors),
            'documents': uploaded_documents
        }
        
        if errors:
            response['errors'] = errors
            logger.warning(f"Upload completed with {len(errors)} errors")
        
        return jsonify(response), 201 if len(uploaded_documents) > 0 else 400
        
    except Exception as e:
        logger.error(f"Error in upload_document: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>', methods=['DELETE'])
def delete_document(doc_id):
    try:
        result = documents_collection.delete_one({'_id': ObjectId(doc_id)})
        if result.deleted_count == 0:
            return jsonify({'error': 'Document not found'}), 404
        return jsonify({'message': 'Document deleted successfully'}), 200
    except Exception as e:
        logger.error(f"Error in delete_document: {str(e)}", exc_info=True)
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
        logger.error(f"Error in semantic search: {str(e)}", exc_info=True)
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
        logger.error(f"Error in get_document: {str(e)}", exc_info=True)
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
        logger.error(f"Error in update_document: {str(e)}", exc_info=True)
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
        logger.error(f"Error in get_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/stats', methods=['GET'])
def get_dashboard_stats():
    """Get comprehensive dashboard statistics"""
    try:
        total_docs = documents_collection.count_documents({})
        urgent_docs = documents_collection.count_documents({'status': 'urgent'})
        today_docs = documents_collection.count_documents({
            'date': {'$gte': datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)}
        })
        approved_docs = documents_collection.count_documents({'status': 'approved'})
        review_docs = documents_collection.count_documents({'status': 'review'})
        starred_docs = documents_collection.count_documents({'starred': True})
        
        # Calculate average processing time (mock for now)
        avg_processing_time = 2.3
        
        return jsonify({
            'total_documents': total_docs,
            'urgent_items': urgent_docs,
            'documents_today': today_docs,
            'approved_documents': approved_docs,
            'review_documents': review_docs,
            'starred_documents': starred_docs,
            'avg_processing_time': avg_processing_time,
            'processing_efficiency': 94.2
        })
    except Exception as e:
        logger.error(f"Error in get_dashboard_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/departments', methods=['GET'])
def get_department_stats():
    """Get document count and urgent items per department"""
    try:
        departments_list = [
            "Operations", "Engineering", "Safety", "Procurement",
            "Human Resources", "Finance", "Environment"
        ]
        
        dept_stats = []
        for dept in departments_list:
            total = documents_collection.count_documents({'department': dept})
            urgent = documents_collection.count_documents({
                'department': dept,
                'status': 'urgent'
            })
            approved = documents_collection.count_documents({
                'department': dept,
                'status': 'approved'
            })
            
            dept_stats.append({
                'name': dept,
                'total_docs': total,
                'urgent_items': urgent,
                'approved_items': approved,
                'pending_items': total - urgent - approved
            })
        
        return jsonify({'departments': dept_stats})
    except Exception as e:
        logger.error(f"Error in get_department_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/upload-trends', methods=['GET'])
def get_upload_trends():
    """Get upload trends over time (last 30 days)"""
    try:
        from datetime import timedelta
        
        # Get documents from last 30 days
        days_back = 30
        trends = []
        
        for i in range(days_back):
            date = datetime.now() - timedelta(days=i)
            date_start = date.replace(hour=0, minute=0, second=0, microsecond=0)
            date_end = date.replace(hour=23, minute=59, second=59, microsecond=999999)
            
            count = documents_collection.count_documents({
                'date': {'$gte': date_start, '$lte': date_end}
            })
            
            trends.append({
                'date': date.strftime('%Y-%m-%d'),
                'count': count
            })
        
        trends.reverse()
        return jsonify({'trends': trends})
    except Exception as e:
        logger.error(f"Error in get_upload_trends: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/processing-efficiency', methods=['GET'])
def get_processing_efficiency_route():
    """Get document processing efficiency metrics"""
    try:
        total_docs = documents_collection.count_documents({})
        approved_docs = documents_collection.count_documents({'status': 'approved'})
        review_docs = documents_collection.count_documents({'status': 'review'})
        urgent_docs = documents_collection.count_documents({'status': 'urgent'})
        
        efficiency = (approved_docs / total_docs * 100) if total_docs > 0 else 0
        
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_count = documents_collection.count_documents({
            'date': {'$gte': today_start}
        })
        
        return jsonify({
            'total_processed': approved_docs,
            'total_documents': total_docs,
            'efficiency_percentage': round(efficiency, 2),
            'pending_review': review_docs,
            'urgent_items': urgent_docs,
            'average_processing_time': 2.3,
            'documents_processed_today': today_count,
            'processing_efficiency': round(efficiency, 1)
        })
    except Exception as e:
        logger.error(f"Error in get_processing_efficiency_route: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/tags', methods=['GET'])
def get_tags_stats():
    """Get most common tags with frequencies"""
    try:
        all_tags = []
        for doc in documents_collection.find({}, {'tags': 1}):
            if doc.get('tags'):
                all_tags.extend(doc['tags'])
        
        tag_counts = Counter(all_tags)
        top_tags = tag_counts.most_common(10)
        
        tags_data = [
            {'tag': tag, 'count': count}
            for tag, count in top_tags
        ]
        
        return jsonify({'tags': tags_data})
    except Exception as e:
        logger.error(f"Error in get_tags_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/document-types', methods=['GET'])
def get_document_types_stats():
    """Get document count by type"""
    try:
        pipeline = [
            {'$group': {'_id': '$type', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}},
            {'$limit': 10}
        ]
        
        doc_types = list(documents_collection.aggregate(pipeline))
        
        types_data = [
            {'type': item['_id'] or 'Unknown', 'count': item['count']}
            for item in doc_types
        ]
        
        return jsonify({'document_types': types_data})
    except Exception as e:
        logger.error(f"Error in get_document_types_stats: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/status-distribution', methods=['GET'])
def get_status_distribution():
    """Get document distribution by status"""
    try:
        statuses = ['urgent', 'review', 'approved']
        
        status_data = []
        for status in statuses:
            count = documents_collection.count_documents({'status': status})
            status_data.append({
                'status': status,
                'count': count,
                'percentage': 0
            })
        
        total = sum(item['count'] for item in status_data)
        if total > 0:
            for item in status_data:
                item['percentage'] = round((item['count'] / total) * 100, 1)
        
        return jsonify({'status_distribution': status_data})
    except Exception as e:
        logger.error(f"Error in get_status_distribution: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/recent-documents', methods=['GET'])
def get_recent_documents():
    """Get 5 most recent documents"""
    try:
        recent_docs = list(
            documents_collection.find({})
            .sort('date', -1)
            .limit(5)
        )
        
        for doc in recent_docs:
            doc['_id'] = str(doc['_id'])
        
        return jsonify({'recent_documents': recent_docs})
    except Exception as e:
        logger.error(f"Error in get_recent_documents: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/dashboard/language-distribution', methods=['GET'])
def get_language_distribution():
    """Get document distribution by language"""
    try:
        pipeline = [
            {'$group': {'_id': '$language', 'count': {'$sum': 1}}},
            {'$sort': {'count': -1}}
        ]
        
        languages = list(documents_collection.aggregate(pipeline))
        
        language_data = [
            {'language': item['_id'] or 'Unknown', 'count': item['count']}
            for item in languages
        ]
        
        return jsonify({'language_distribution': language_data})
    except Exception as e:
        logger.error(f"Error in get_language_distribution: {str(e)}", exc_info=True)
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
        
        # Create BytesIO object
        file_obj = BytesIO(file_content.encode('utf-8'))
        
        # Create sanitized filename
        safe_title = doc.get('title', 'document').replace(" ", "_").replace("/", "_")
        filename = f"{safe_title}_{str(doc['_id'])[:8]}.txt"
        
        return send_file(
            file_obj,
            mimetype='text/plain',
            as_attachment=True,
            download_name=filename
        )
    except Exception as e:
        logger.error(f"Error in download_document: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/export/csv', methods=['GET'])
def export_documents_csv():
    """Export all documents as CSV"""
    try:
        import csv
        import io
        
        documents = list(documents_collection.find({}))
        
        if not documents:
            return jsonify({'error': 'No documents to export'}), 404
        
        # Use StringIO for text data
        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=['title', 'department', 'type', 'status', 'date', 'language'])
        writer.writeheader()
        
        for doc in documents:
            writer.writerow({
                'title': doc.get('title', ''),
                'department': doc.get('department', ''),
                'type': doc.get('type', ''),
                'status': doc.get('status', ''),
                'date': str(doc.get('date', '')),
                'language': doc.get('language', '')
            })
        
        # Convert to bytes
        csv_bytes = output.getvalue().encode('utf-8')
        csv_buffer = BytesIO(csv_bytes)
        csv_buffer.seek(0)
        
        return send_file(
            csv_buffer,
            mimetype='text/csv',
            as_attachment=True,
            download_name='documents_export.csv'
        )
    except Exception as e:
        logger.error(f"Error in export_documents_csv: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/bulk-update-status', methods=['PUT'])
def bulk_update_status():
    """Bulk update document status"""
    try:
        data = request.get_json()
        doc_ids = data.get('doc_ids', [])
        new_status = data.get('status', '')
        
        if not doc_ids or not new_status:
            return jsonify({'error': 'doc_ids and status are required'}), 400
        
        object_ids = [ObjectId(doc_id) for doc_id in doc_ids]
        
        result = documents_collection.update_many(
            {'_id': {'$in': object_ids}},
            {'$set': {'status': new_status}}
        )
        
        return jsonify({
            'message': f'Updated {result.modified_count} documents',
            'modified_count': result.modified_count
        })
    except Exception as e:
        logger.error(f"Error in bulk_update_status: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/search-advanced', methods=['POST'])
def advanced_search():
    """Advanced search with multiple filters"""
    try:
        data = request.get_json()
        search_query = data.get('search', '')
        department = data.get('department', '')
        doc_type = data.get('type', '')
        status = data.get('status', '')
        date_from = data.get('date_from', '')
        date_to = data.get('date_to', '')
        tags = data.get('tags', [])
        
        query_filter = {}
        
        if search_query:
            query_filter['$or'] = [
                {'title': {'$regex': search_query, '$options': 'i'}},
                {'summary': {'$regex': search_query, '$options': 'i'}},
                {'tags': {'$regex': search_query, '$options': 'i'}},
                {'content': {'$regex': search_query, '$options': 'i'}}
            ]
        
        if department:
            query_filter['department'] = department
        
        if doc_type:
            query_filter['type'] = doc_type.replace('-', ' ').title()
        
        if status:
            query_filter['status'] = status
        
        if date_from or date_to:
            date_range = {}
            if date_from:
                date_range['$gte'] = datetime.strptime(date_from, '%Y-%m-%d')
            if date_to:
                date_range['$lte'] = datetime.strptime(date_to, '%Y-%m-%d')
            if date_range:
                query_filter['date'] = date_range
        
        if tags and len(tags) > 0:
            query_filter['tags'] = {'$in': tags}
        
        documents = list(documents_collection.find(query_filter).sort('date', -1))
        
        for doc in documents:
            doc['_id'] = str(doc['_id'])
        
        return jsonify({
            'results': documents,
            'count': len(documents)
        })
    except Exception as e:
        logger.error(f"Error in advanced_search: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/<doc_id>/star', methods=['POST'])
def star_document(doc_id):
    """Star/unstar a document"""
    try:
        doc = documents_collection.find_one({'_id': ObjectId(doc_id)})
        if not doc:
            return jsonify({'error': 'Document not found'}), 404
        
        new_starred_state = not doc.get('starred', False)
        
        documents_collection.update_one(
            {'_id': ObjectId(doc_id)},
            {'$set': {'starred': new_starred_state}}
        )
        
        return jsonify({
            'message': f'Document {"starred" if new_starred_state else "unstarred"} successfully',
            'starred': new_starred_state
        })
    except Exception as e:
        logger.error(f"Error in star_document: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        # Try to connect to database
        documents_collection.count_documents({})
        return jsonify({'status': 'healthy', 'database': 'connected'})
    except Exception as e:
        return jsonify({'status': 'unhealthy', 'error': str(e)}), 500


@app.route('/api/documents/starred', methods=['GET'])
def get_starred_documents():
    """Get all starred documents"""
    try:
        starred_docs = list(
            documents_collection.find({'starred': True})
            .sort('date', -1)
        )
        
        for doc in starred_docs:
            doc['_id'] = str(doc['_id'])
        
        return jsonify({
            'documents': starred_docs,
            'count': len(starred_docs)
        })
    except Exception as e:
        logger.error(f"Error in get_starred_documents: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.route('/api/documents/filter-by-department/<department>', methods=['GET'])
def get_documents_by_department(department):
    """Get all documents from a specific department"""
    try:
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        
        total = documents_collection.count_documents({'department': department})
        
        skip = (page - 1) * limit
        documents = list(
            documents_collection.find({'department': department})
            .sort('date', -1)
            .skip(skip)
            .limit(limit)
        )
        
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
        logger.error(f"Error in get_documents_by_department: {str(e)}", exc_info=True)
        return jsonify({'error': str(e)}), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    if not GEMINI_API_KEY:
        logger.warning("GEMINI_API_KEY environment variable is not set. AI features will be disabled, and mock data will be used.")
    app.run(debug=True, port=5000)