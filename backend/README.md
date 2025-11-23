# 🚀 KMRL DocIntel Backend

## Overview

This is the **Python Flask backend** for the KMRL DocIntel system. It handles:
- Document upload and multi-format text extraction
- AI-powered document analysis using Google Gemini API
- Semantic search with NLP enhancements
- MongoDB database operations
- RESTful API endpoints

**Framework**: Flask with Flask-CORS  
**Language**: Python 3.x  
**Database**: MongoDB

---

## 📋 Prerequisites

Before getting started, ensure you have:
- **Python 3.8+** installed
- **MongoDB** (local or Atlas cloud)
- **Google Gemini API Key** ([Get it here](https://ai.google.dev/))
- **Tesseract OCR** (for image text extraction)

### Installing Tesseract OCR (Required for Image Processing)

**Windows:**
1. Download installer from: https://github.com/UB-Mannheim/tesseract/wiki
2. Run the installer (use default path: `C:\Program Files\Tesseract-OCR`)
3. Add to PATH or configure in code

**macOS:**
```bash
brew install tesseract
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install tesseract-ocr
```

---

## ⚙️ Setup Instructions

### 1. Create Python Virtual Environment

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

**Dependencies include:**
- `flask` - Web framework
- `flask_cors` - Cross-Origin Resource Sharing
- `pymongo` - MongoDB driver
- `python-dotenv` - Environment variable management
- `requests` - HTTP requests for Gemini API
- `PyMuPDF` - PDF text extraction
- `python-docx` - Word document processing
- `openpyxl` - Excel file processing
- `Pillow` - Image processing
- `pytesseract` - Tesseract OCR wrapper

### 3. Configure Environment Variables

Create a `.env` file in the `backend` directory:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/

# Database Name
DB_NAME=kmrl_docintel

# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Port (optional, defaults to 5000)
PORT=5000
```

### 4. Setup MongoDB

**Option A: Local MongoDB Installation**

Windows (Run as Administrator):
```bash
net start MongoDB
```

macOS:
```bash
brew services start mongodb-community
```

Linux:
```bash
sudo systemctl start mongod
```

**Option B: MongoDB Atlas (Cloud)**

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get connection string and add to `.env`:
   ```env
   MONGO_URI=mongodb+srv://username:password@cluster-name.mongodb.net/
   ```

---

## 🚀 Running the Backend

```bash
# Ensure virtual environment is activated
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate

# Run the Flask application
python app.py
```

**Output:**
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

The backend API will be available at: `http://localhost:5000`

---

## 📡 API Endpoints

### Document Management

#### Get Documents
```
GET /api/documents
```
**Query Parameters:**
- `search` - Search query string
- `department` - Filter by department
- `type` - Filter by document type
- `page` - Page number (default: 1)
- `limit` - Documents per page (default: 10)

**Example:**
```
GET /api/documents?search=safety&department=operations&page=1&limit=10
```

**Response:**
```json
{
  "documents": [...],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

#### Upload Document
```
POST /api/documents/upload
Content-Type: multipart/form-data
```

**Request Body:**
- `file` - Document file (PDF, DOCX, XLS, JPG, PNG, TXT, etc.)

**Response:**
```json
{
  "_id": "mongo_object_id",
  "title": "Document Title",
  "summary": "AI-generated summary",
  "content": "Extracted text content",
  "department": "Operations",
  "type": "Safety Circular",
  "tags": ["tag1", "tag2"],
  "status": "review",
  "figures_data": [...],
  "tables_data": [...],
  "charts": [...]
}
```

#### Get Single Document
```
GET /api/documents/<doc_id>
```

**Response:** Complete document object

#### Update Document
```
PUT /api/documents/<doc_id>
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "approved",
  "tags": ["updated", "tag"],
  "starred": true
}
```

#### Delete Document
```
DELETE /api/documents/<doc_id>
```

#### Download Document
```
GET /api/documents/<doc_id>/download
```

Downloads document as formatted text file with metadata.

### Search API

#### Semantic Search
```
POST /api/search/semantic
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "safety requirements for phase 2"
}
```

**Response:**
```json
{
  "results": [
    {
      "_id": "mongo_id",
      "title": "Document Title",
      "summary": "...",
      "similarity": 0.85,
      ...
    }
  ]
}
```

### Analytics API

#### Get Statistics
```
GET /api/stats
```

**Response:**
```json
{
  "total_documents": 250,
  "urgent_items": 8,
  "documents_today": 47
}
```

### Health Check
```
GET /health
```

**Response:**
```json
{
  "status": "healthy"
}
```

---

## 📁 Project Structure

```
backend/
├── app.py                          # Main Flask application
├── config.py                       # Configuration classes
├── requirements.txt                # Python dependencies
├── .env                            # Environment variables (create this)
├── .gitignore
├── README.md                       # This file
│
├── 📁 config/
│   └── logger.js                   # Logging configuration
│
├── 📁 controllers/
│   └── documentController.js       # Request handlers
│
├── 📁 middleware/
│   └── logging.js                  # Logging middleware
│
├── 📁 models/
│   └── Document.js                 # Data models
│
├── 📁 routes/
│   └── documentRoutes.js           # API routes
│
└── 📁 utils/
    ├── document_processor.py       # File extraction utilities
    └── semantic_search.py          # NLP search engine
```

---

## 🔍 Key Features

### 1. Multi-Format Document Processing

Supported file types:
- **PDF** - PyMuPDF (fitz)
- **Word** - python-docx (.doc, .docx)
- **Excel** - openpyxl (.xls, .xlsx)
- **Text** - Plain TXT files
- **Images** - Pillow + Tesseract OCR (JPG, PNG)

### 2. AI-Powered Analysis

Uses **Google Gemini 2.5-Flash API** to extract:
- Document title and summary
- Department classification
- Document type categorization
- Status assignment (urgent/approved/review)
- Tags and keywords
- Tables with captions
- Metrics and figures
- Chart data

### 3. Semantic Search with NLP

Features:
- Stopword removal and preprocessing
- Synonym expansion (safety → secure, protection)
- TF-IDF vectorization with length weighting
- Cosine similarity scoring
- Metadata matching with boost factors
- Top-K results ranking

### 4. MongoDB Integration

- Document storage with automatic indexing
- Flexible schema for extracted data
- Efficient querying with filters
- Pagination support

---

## 🛠️ Main Functions

### `extract_text_from_file(file_storage)`
Extracts text from uploaded files based on format. Returns raw text content.

### `analyze_document_with_gemini(text_content)`
Sends text to Gemini API for AI analysis. Returns structured JSON with:
- Title, summary, tags
- Department, type, status
- Tables, figures, charts

### `semantic_search(query, collection, top_k=10)`
Performs NLP-enhanced semantic search on MongoDB. Returns ranked results.

### Route Handlers
- `/api/documents` - GET, POST
- `/api/documents/<doc_id>` - GET, PUT, DELETE
- `/api/search/semantic` - POST
- `/api/stats` - GET

---

## 📊 Database Schema

### Document Collection
```javascript
{
  _id: ObjectId,
  title: String,
  summary: String,
  content: String,
  department: String,
  type: String,
  tags: [String],
  language: String,
  status: String,  // "urgent", "approved", "review"
  date: Date,
  source: String,
  starred: Boolean,
  
  tables_data: [{
    caption: String,
    data: [[String]]
  }],
  
  figures_data: [{
    description: String,
    values: [String],
    type: String  // "number", "percentage", "currency", "metric", "ratio"
  }],
  
  charts: [{
    title: String,
    description: String,
    chart_type: String,  // "bar", "line", "pie", "area"
    data_points: [{ label: String, value: String }]
  }]
}
```

---

## ⚠️ Troubleshooting

### Issue: "GEMINI_API_KEY not found"
**Solution:** Add your API key to `.env` file or set environment variable.

### Issue: MongoDB connection failed
**Solution:** Ensure MongoDB is running and `MONGO_URI` is correct in `.env`.

### Issue: Image OCR not working
**Solution:** Install Tesseract:
- Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
- macOS: `brew install tesseract`
- Linux: `sudo apt-get install tesseract-ocr`

### Issue: "No module named 'pytesseract'"
**Solution:** Run `pip install pytesseract` in your virtual environment.

### Issue: CORS errors in frontend
**Solution:** Flask-CORS is configured in `app.py`. Ensure it's initialized with `CORS(app)`.

---

## 🔐 Security Considerations

- ✅ File type validation (8 allowed formats)
- ✅ Input sanitization
- ✅ Error handling without exposing sensitive data
- ✅ Environment variables for API keys (never hardcode)
- ✅ CORS properly configured

---

## 📈 Performance Tips

1. **Optimize PDF Processing**: Large PDFs may take time; consider chunking
2. **Cache Search Results**: Use Redis for frequently searched queries
3. **Batch Processing**: Process multiple uploads asynchronously
4. **Database Indexing**: Already configured on title, department, type, tags

---

## 📝 Environment Variables Checklist

Before running, ensure `.env` contains:
- [ ] `MONGO_URI` - MongoDB connection string
- [ ] `DB_NAME` - Database name (kmrl_docintel)
- [ ] `GEMINI_API_KEY` - Google Gemini API key
- [ ] `PORT` - Server port (optional, defaults to 5000)

---

## 🤝 Integration with Frontend

The backend is designed to work with the React frontend. Ensure:

1. Backend runs on `http://localhost:5000`
2. Frontend configured to call backend API
3. CORS is enabled (Flask-CORS already configured)
4. MongoDB is running with proper credentials

---

## 📚 Additional Resources

- [Flask Documentation](https://flask.palletsprojects.com/)
- [PyMongo Documentation](https://pymongo.readthedocs.io/)
- [Google Gemini API](https://ai.google.dev//)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Tesseract OCR](https://github.com/UB-Mannheim/tesseract/wiki)

---

**Built with ❤️ for Kochi Metro Rail Limited**

For issues or questions, please refer to the main project README.md
