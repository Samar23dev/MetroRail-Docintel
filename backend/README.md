# KMRL DocIntel Backend

## Setup Instructions

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Setup MongoDB:
- Install MongoDB locally or use MongoDB Atlas
- Update MONGO_URI in .env file

4. Run the application:
```bash
python app.py
```

The backend will run on http://localhost:5000

## API Endpoints

- GET /api/documents - Fetch documents with filters
- POST /api/documents/upload - Upload and process document
- DELETE /api/documents/<doc_id> - Delete document
- GET /api/documents/<doc_id> - Get single document
- PUT /api/documents/<doc_id> - Update document
- POST /api/search/semantic - Semantic search
- GET /api/stats - Get dashboard statistics
- GET /health - Health check
