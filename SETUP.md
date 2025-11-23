# DocIntel - Kochi Metro Document Intelligence System

## 📋 Overview

DocIntel is an intelligent document management and analysis system for the Kochi Metro Rail project. It combines document processing, semantic search, and AI-powered insights to streamline document management workflows.

### Key Features

- 📄 **Multi-format Document Support**: Upload and process PDF, DOCX, TXT, and images
- 🖼️ **Image OCR with Gemini API**: Extract text from JPG, PNG, GIF, WebP without system dependencies
- 🔍 **Advanced Search**: Keyword and semantic search with 8+ filter options
- 📊 **Analytics Dashboard**: Real-time insights on document metrics
- 🏷️ **Document Management**: Filter by department, status, language, and more
- 🤖 **AI Analysis**: Powered by Gemini API for intelligent document summarization
- 📱 **Responsive UI**: Modern React-based interface with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **MongoDB** (local or cloud instance)
- **Gemini API Key** (from Google AI Studio)

### Installation

#### 1. Clone Repository
```bash
git clone <repository-url>
cd Docintel
```

#### 2. Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

#### 3. Environment Configuration
Create `.env` file in the root directory:
```env
# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017
DB_NAME=kmrl_docintel

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
FLASK_ENV=development
PORT=5000
```

#### 4. Frontend Setup
```bash
cd ..
npm install
```

#### 5. Run Development Server

**Terminal 1 - Backend:**
```bash
cd backend
python app.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 📂 Project Structure

```
Docintel/
├── backend/
│   ├── app.py                 # Flask server with API endpoints
│   ├── config.py              # Configuration management
│   ├── requirements.txt        # Python dependencies
│   ├── config/
│   │   └── logger.js          # Logging configuration
│   ├── controllers/
│   │   └── documentController.js
│   ├── middleware/
│   │   └── logging.js
│   ├── models/
│   │   └── Document.js
│   ├── routes/
│   │   └── documentRoutes.js
│   └── utils/
│       ├── document_processor.py
│       └── semantic_search.py
│
├── src/
│   ├── main.jsx               # React entry point
│   ├── App.jsx                # Main App component
│   ├── index.css              # Global styles
│   ├── components/
│   │   ├── Dashboard.jsx      # Main dashboard
│   │   ├── Documents.jsx      # Document management
│   │   ├── SearchPage.jsx     # Advanced search
│   │   ├── Analytics.jsx      # Analytics view
│   │   ├── Header.jsx         # Navigation header
│   │   ├── Sidebar.jsx        # Sidebar navigation
│   │   ├── EnhancedDocumentViewModal.jsx
│   │   └── charts/
│   │       └── ChartComponents.jsx
│   ├── utils/
│   │   ├── api.js             # API calls
│   │   └── analyticsApi.js    # Analytics API
│   ├── constants/
│   │   └── config.js          # Frontend config
│   └── assets/                # Static assets
│
├── public/
│   └── vite.svg
│
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── eslint.config.js
│
├── README.md                  # Main documentation
├── SETUP.md                   # This file
├── RECENT_UPDATES.md          # Technical updates
└── TESTING_DEPLOYMENT.md      # Testing guide
```

---

## 🔧 Technology Stack

### Frontend
- **React 18** - UI library
- **Vite** - Build tool (fast development)
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Chart.js** - Analytics visualization

### Backend
- **Python 3.8+** - Server language
- **Flask** - Web framework
- **MongoDB** - Document database
- **Pymongo** - Python MongoDB driver
- **Python-docx** - DOCX file handling
- **PyPDF2** - PDF processing
- **requests** - HTTP library
- **python-dotenv** - Environment management

### External APIs
- **Gemini API** - Text extraction and analysis

### DevTools
- **ESLint** - JavaScript linting
- **Tailwind CSS** - CSS framework
- **PostCSS** - CSS processing

---

## 📖 Usage Guide

### Uploading Documents

1. Go to **Documents** tab
2. Click **Upload Document** button
3. Select one or multiple files (PDF, DOCX, TXT, JPG, PNG, GIF, WebP)
4. Click **Upload**
5. Wait for processing (images are processed via Gemini API)

### Searching Documents

#### Keyword Search
1. Go to **Search** tab
2. Select "Keyword Search"
3. Enter search term
4. Click **Search**

#### Semantic Search
1. Go to **Search** tab
2. Select "Semantic Search"
3. Enter search term or concept
4. Adjust **Relevance Threshold** if needed
5. Click **Apply Filters** → **Semantic Search**

### Using Filters

**Available Filters:**
- **Department**: Filter by department
- **Document Type**: Filter by document type
- **Status**: Urgent, Review, Approved, Published
- **Language**: English, Malayalam, Bilingual
- **Date Range**: Filter by date range
- **Tags**: Filter by tags
- **Relevance Threshold**: For semantic search
- **Starred Only**: Show only starred documents

### Viewing Analytics

1. Go to **Analytics** tab
2. View real-time metrics:
   - Total documents
   - Documents by department
   - Documents by status
   - Language distribution
   - Recent uploads

---

## 🔌 API Endpoints

### Document Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/documents/upload` | Upload document |
| GET | `/api/documents` | Get all documents |
| GET | `/api/documents/<id>` | Get document by ID |
| PUT | `/api/documents/<id>` | Update document |
| DELETE | `/api/documents/<id>` | Delete document |

### Search

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/search/keyword` | Keyword search |
| POST | `/api/search/semantic` | Semantic search |
| POST | `/api/search/filter` | Filter documents |

### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Get analytics summary |
| GET | `/api/analytics/department` | Department metrics |
| GET | `/api/analytics/status` | Status distribution |

---

## 🖼️ Image Processing (Gemini API)

### Supported Formats
- **JPG/JPEG** - Standard JPEG images
- **PNG** - Portable Network Graphics
- **GIF** - Graphics Interchange Format
- **WebP** - Modern web image format

### How It Works

1. User uploads an image file
2. Backend encodes image to base64
3. Image sent to **Gemini Vision API**
4. Text extracted from image
5. Extracted text stored in document
6. Text becomes searchable

### Configuration

**In `backend/app.py`:**
```python
def extract_image_text_with_gemini(image_data):
    # Encodes image to base64
    # Calls Gemini Vision API
    # Returns extracted text
```

**Environment Variable Required:**
```env
GEMINI_API_KEY=your_api_key_here
```

---

## 🔍 Search Functionality

### Keyword Search
- Full-text search across all documents
- Searches document content, titles, and metadata
- Returns exact matches and partial matches

### Semantic Search
- Conceptual matching using embeddings
- Finds documents with similar meaning
- Adjustable relevance threshold (0-100)
- Better for finding conceptually related documents

**Example:**
```
Keyword: "safety"        → Finds docs with word "safety"
Semantic: "safety"       → Finds docs about accident prevention, 
                           incident reporting, protective measures, etc.
```

---

## 📊 Analytics Dashboard

The dashboard displays:

1. **Document Metrics**
   - Total documents uploaded
   - Documents pending review
   - Recent uploads

2. **Department Distribution**
   - Documents per department
   - Visual chart representation

3. **Status Distribution**
   - Urgent count
   - Under review count
   - Approved count
   - Published count

4. **Language Statistics**
   - English documents
   - Malayalam documents
   - Bilingual documents

5. **Recent Activity**
   - Recently uploaded documents
   - Recent searches
   - Recent updates

---

## ⚙️ Configuration

### Backend Configuration (`backend/config.py`)

```python
# Database
MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'kmrl_docintel')

# API
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

# Server
FLASK_ENV = os.getenv('FLASK_ENV', 'development')
DEBUG = FLASK_ENV == 'development'
```

### Frontend Configuration (`src/constants/config.js`)

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const UPLOAD_MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const UPLOAD_ALLOWED_TYPES = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
```

---

## 🧪 Testing

See `TESTING_DEPLOYMENT.md` for:
- Unit tests
- Integration tests
- Performance benchmarks
- Troubleshooting guide

---

## 🚀 Deployment

### Production Build

**Frontend:**
```bash
npm run build
```

**Backend:**
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### Environment Setup for Production

Update `.env` with production values:
```env
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/
DB_NAME=kmrl_docintel_prod
GEMINI_API_KEY=prod_api_key
FLASK_ENV=production
```

### Deployment Platforms

**Frontend:**
- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker container

**Backend:**
- AWS EC2 / Lambda
- Google Cloud Run
- Heroku
- Docker container

---

## 📝 Logging

### Backend Logging

Logs are configured in `backend/config/logger.js`:

```
[2025-11-23 14:30:45] INFO - Document uploaded: report.pdf
[2025-11-23 14:30:50] INFO - Successfully extracted text from image: chart.png
[2025-11-23 14:31:00] INFO - Gemini analysis completed for report.pdf
```

### View Logs

```bash
# Recent logs
tail -f backend/logs.txt

# Search logs
grep "Error" backend/logs.txt
grep "extract_image_text_with_gemini" backend/logs.txt
```

---

## 🔐 Security

### Best Practices Implemented

- ✅ Environment variables for sensitive data
- ✅ CORS configuration for API access
- ✅ Input validation on file uploads
- ✅ File type validation
- ✅ Size limit enforcement (50MB default)

### Recommended Security Measures

1. **Authentication**: Add JWT tokens
2. **Authorization**: Implement role-based access
3. **HTTPS**: Use SSL/TLS in production
4. **API Keys**: Rotate Gemini API keys regularly
5. **Rate Limiting**: Implement request rate limits
6. **Logging**: Monitor API access and errors

---

## 🐛 Troubleshooting

### Image Upload Fails

**Problem**: "Failed to extract text from image"

**Solution**:
1. Check `GEMINI_API_KEY` is set correctly
2. Verify image contains readable text
3. Check image format is supported (JPG, PNG, GIF, WebP)
4. Review backend logs for API errors

### Search Returns No Results

**Problem**: "No documents found"

**Solution**:
1. Verify documents are uploaded
2. Try broader search terms
3. Check filters aren't too restrictive
4. Clear filters and try again

### MongoDB Connection Error

**Problem**: "Connection refused"

**Solution**:
1. Verify MongoDB is running: `mongosh`
2. Check `MONGO_URI` in `.env`
3. Verify network connectivity
4. Check MongoDB credentials

---

## 📚 Additional Resources

- **Gemini API Docs**: https://ai.google.dev/
- **MongoDB Docs**: https://docs.mongodb.com/
- **Flask Docs**: https://flask.palletsprojects.com/
- **React Docs**: https://react.dev/
- **Tailwind CSS**: https://tailwindcss.com/

---

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.1 | Nov 23, 2025 | Gemini OCR integration, advanced search filters, document filtering |
| 2.0 | Nov 20, 2025 | Multiple file upload, logging improvements |
| 1.0 | Nov 15, 2025 | Initial release |

---

## 🤝 Contributing

To contribute to this project:

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -m "Add feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Open a Pull Request

---

## 📄 License

This project is part of the Kochi Metro Rail project.

---

## 👥 Team

- **Project**: Kochi Metro Document Intelligence (DocIntel)
- **Maintainer**: Samar23dev
- **Repository**: MetroRail-Docintel

---

## ❓ Support

For issues, questions, or feature requests:
1. Check existing issues in repository
2. Review troubleshooting section above
3. Check TESTING_DEPLOYMENT.md
4. Review RECENT_UPDATES.md for technical details

---

**Last Updated**: November 23, 2025 ✓
