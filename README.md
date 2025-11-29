# MetroRail-Docintel: Document Intelligence Platform

MetroRail-Docintel is a sophisticated, AI-powered document management and analysis platform designed for enterprise use. It provides a robust backend service built with Flask, MongoDB, and Google's Gemini AI to ingest, analyze, and manage a wide variety of documents, turning unstructured information into structured, actionable data.

This platform is tailored for organizations like KMRL (Kochi Metro Rail Limited) to streamline document workflows, enhance searchability, and derive insights from their operational data.

## ✨ Key Features

- **Multi-Format Document Processing**: Ingests and extracts text from various file types, including:
  - Text-based and scanned PDFs (using OCR).
  - Word documents (`.docx`, `.doc`).
  - Excel spreadsheets (`.xls`, `.xlsx`).
  - Plain text files (`.txt`).
  - Images (`.jpg`, `.png`) with OCR capabilities.
- **AI-Powered Analysis with Google Gemini**: Leverages Google's `gemini-1.5-pro` or `gemini-1.5-flash` models to automatically:
  - Generate a concise title and summary.
  - Assign relevant tags, department, and document type.
  - Suggest a status (`urgent`, `approved`, `review`) based on content.
  - Extract structured data like tables, figures, and charts.
- **Advanced OCR Engine**: Utilizes `pytesseract` with image preprocessing (contrast enhancement, filtering) to achieve high accuracy on scanned and handwritten documents.
- **Semantic Search**: A powerful search engine that understands the *meaning* behind your query, not just keywords. It uses NLP techniques like synonym expansion and TF-IDF-like scoring for highly relevant results.
- **Comprehensive REST API**: A rich set of endpoints for:
  - Full CRUD (Create, Read, Update, Delete) operations on documents.
  - File uploads, downloads, and data exports (`.txt`, `.csv`).
  - Advanced search and filtering capabilities.
  - Bulk operations (e.g., updating status for multiple documents).
- **Dashboard Analytics**: Endpoints to power a frontend dashboard with statistics on:
  - Document counts per department.
  - Status distribution (urgent, approved, review).
  - Most common tags and document types.

## 🏗️ Architecture

The backend is built on a modern, scalable technology stack:

- **Web Framework**: **Flask** (provides the REST API).
- **Database**: **MongoDB** (a flexible NoSQL database for storing document metadata, content, and analysis results).
- **AI Engine**: **Google Gemini** (via the `google-genai` Python SDK for state-of-the-art content analysis).
- **Text Extraction**: A powerful pipeline using **PyMuPDF**, **python-docx**, and **Pytesseract** for OCR.
- **Deployment**: Can be run as a standard Python application or containerized with Docker.

---

## 🚀 Getting Started

Follow these instructions to set up and run the backend server on your local machine.

### 1. Prerequisites

- **Python 3.8+**
- **MongoDB**: Ensure you have a running MongoDB instance (local or on a cloud service like MongoDB Atlas).
- **Tesseract-OCR**: This is required for processing scanned PDFs and images.
  - **Windows**: Download and install from the official Tesseract repository. Make sure to add the installation directory to your system's `PATH`.
  - **macOS**: `brew install tesseract`
  - **Linux (Ubuntu/Debian)**: `sudo apt-get install tesseract-ocr`

### 2. Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/MetroRail-Docintel.git
cd MetroRail-Docintel/backend

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
# venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# 3. Install the required Python packages
pip install -r requirements.txt
```

*(Note: A `requirements.txt` file should be created with all dependencies like `Flask`, `pymongo`, `google-generativeai`, `PyMuPDF`, `pytesseract`, `Pillow`, etc.)*

### 3. Environment Configuration (Crucial!)

This project uses a `.env` file to manage environment variables. This file is critical for connecting to the database and enabling AI features.

**Create a file named `.env` in the `backend` directory.** Copy the contents of the example below and fill in your own values.

#### `.env.example`

```env
# ============================
# METRORAIL-DOCINTEL .ENV FILE
# ============================

# --- Database Configuration ---
# Your MongoDB connection string
MONGO_URI="mongodb://localhost:27017/"

# The name of the database to use
DB_NAME="metrorail_docintel"

# --- Google Gemini AI Configuration ---
# IMPORTANT: Get your API key from Google AI Studio (https://aistudio.google.com/app/apikey)
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# --- File Upload Configuration ---
# (Optional) The folder where uploaded files will be stored. Defaults to 'backend/uploads'.
# UPLOAD_FOLDER="C:/path/to/your/uploads"

# --- OCR Configuration (Optional) ---
# Languages for Tesseract OCR. 'eng' for English, 'mal' for Malayalam.
# OCR_LANGUAGES="eng+mal"
```

**⚠️ Important:**
- Your `GEMINI_API_KEY` is a secret and should never be committed to version control. The `.gitignore` file should include `.env`.
- Without a valid `GEMINI_API_KEY`, the AI analysis features will be disabled, and the application will return mock data.

### 4. Running the Server

Once your `.env` file is configured, you can start the Flask development server.

```bash
python app.py
```

The server will start, and you should see output indicating that it's running, typically on `http://127.0.0.1:5000`.

```
 * Serving Flask app 'app'
 * Debug mode: on
⚡ Using GEMINI_1.5_FLASH for fast document analysis
✅ Gemini client initialized successfully.
 * Running on http://127.0.0.1:5000
Press CTRL+C to quit
```

You are now ready to connect a frontend application or use tools like Postman to interact with the API.