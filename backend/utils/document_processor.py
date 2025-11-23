import PyPDF2
from docx import Document as DocxDocument
import os
from datetime import datetime

DEPARTMENTS = {
    'operations': 'Operations',
    'engineering': 'Engineering',
    'safety': 'Safety',
    'procurement': 'Procurement',
    'hr': 'Human Resources',
    'finance': 'Finance',
    'environment': 'Environment'
}

DOC_TYPES = [
    'Safety Circular',
    'Invoice',
    'Engineering Drawing',
    'Maintenance Report',
    'Policy',
    'Regulatory Directive',
    'Impact Study',
    'Board Minutes',
    'Training Material',
    'Incident Report'
]

def process_document(file):
    """Process uploaded document and extract metadata"""
    try:
        filename = file.filename
        file_ext = os.path.splitext(filename)[1].lower()
        
        # Extract text based on file type
        if file_ext == '.pdf':
            text, metadata = extract_pdf(file)
        elif file_ext in ['.docx', '.doc']:
            text, metadata = extract_docx(file)
        elif file_ext == '.txt':
            text, metadata = extract_text(file)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
        
        # Generate summary (first 200 characters)
        summary = text[:200] + "..." if len(text) > 200 else text
        
        # Extract tags from content
        tags = extract_tags(text)
        
        # Detect language (simplified)
        language = detect_language(text)
        
        # Classify document type
        doc_type = classify_document_type(text)
        
        # Classify department
        department = classify_department(text)
        
        return {
            'title': filename,
            'content': text,
            'summary': summary,
            'department': department,
            'type': doc_type,
            'tags': tags,
            'language': language,
            'status': 'pending',
            'file_size': file.content_length or 0,
            'file_type': file_ext,
            'metadata': metadata
        }
    except Exception as e:
        raise Exception(f"Error processing document: {str(e)}")


def extract_pdf(file):
    """Extract text from PDF"""
    try:
        pdf_reader = PyPDF2.PdfReader(file)
        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()
        
        metadata = pdf_reader.metadata or {}
        return text, metadata
    except Exception as e:
        raise Exception(f"Error reading PDF: {str(e)}")


def extract_docx(file):
    """Extract text from DOCX"""
    try:
        doc = DocxDocument(file)
        text = "\n".join([para.text for para in doc.paragraphs])
        return text, {}
    except Exception as e:
        raise Exception(f"Error reading DOCX: {str(e)}")


def extract_text(file):
    """Extract text from TXT"""
    try:
        text = file.read().decode('utf-8')
        return text, {}
    except Exception as e:
        raise Exception(f"Error reading TXT: {str(e)}")


def extract_tags(text):
    """Extract keywords as tags"""
    keywords = [
        'safety', 'maintenance', 'urgent', 'metro', 'phase', 'extension',
        'policy', 'procedure', 'vendor', 'invoice', 'regulatory', 'compliance'
    ]
    tags = []
    text_lower = text.lower()
    for keyword in keywords:
        if keyword in text_lower:
            tags.append(keyword)
    return list(set(tags))[:5]  # Return max 5 unique tags


def detect_language(text):
    """Detect document language"""
    # Simplified detection - check for Malayalam characters
    if any('\u0D00' <= char <= '\u0D7F' for char in text):
        return 'Bilingual'
    return 'English'


def classify_document_type(text):
    """Classify document type based on content"""
    text_lower = text.lower()
    
    for doc_type in DOC_TYPES:
        if doc_type.lower() in text_lower:
            return doc_type
    
    return 'Other'


def classify_department(text):
    """Classify document to department"""
    text_lower = text.lower()
    
    department_keywords = {
        'operations': ['operations', 'operational', 'metro', 'line'],
        'engineering': ['engineering', 'drawing', 'design', 'construction'],
        'safety': ['safety', 'accident', 'incident', 'hazard'],
        'procurement': ['procurement', 'vendor', 'supplier', 'purchase'],
        'hr': ['human resources', 'hr', 'employee', 'recruitment'],
        'finance': ['finance', 'invoice', 'payment', 'budget', 'cost'],
        'environment': ['environment', 'environmental', 'impact', 'study']
    }
    
    for dept, keywords in department_keywords.items():
        for keyword in keywords:
            if keyword in text_lower:
                return DEPARTMENTS.get(dept, 'Operations')
    
    return 'Operations'
