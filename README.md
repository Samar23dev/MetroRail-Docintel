# KMRL DocIntel - AI-Powered Document Intelligence System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-2.2-green?logo=flask)](https://flask.palletsprojects.com/)

An intelligent document management and analysis platform designed for KMRL (Kochi Metro Rail Limited). This system transforms static documents into smart, searchable, and actionable data using AI-powered analysis, advanced search capabilities, and insightful analytics.

## ✨ Key Features

### Core Functionality
-   **Multi-Format Document Upload**: Ingests a wide variety of file types, including `.pdf`, `.docx`, `.txt`, `.jpg`, `.png`, and Excel files.
-   **Advanced OCR**: Automatically detects scanned PDFs and images, performing Optical Character Recognition (OCR) to extract text, even from low-quality or handwritten scans.
-   **Secure File Storage**: Uploaded original files are stored securely on the server for later viewing and verification.
-   **Comprehensive Dashboard**: A central hub providing at-a-glance statistics on total documents, urgent items, processing efficiency, and department activity.

### AI-Powered Analysis (Google Gemini)
-   **Automated Metadata Extraction**: Gemini Pro/Flash analyzes document content to automatically generate a relevant `title`, a concise `summary`, and a set of `tags`.
-   **Intelligent Categorization**: Automatically determines the document's `department` (e.g., Engineering, Safety) and `type` (e.g., Invoice, Safety Circular).
-   **Status Assignment**: Assigns an initial status (`urgent`, `review`, `approved`) based on the document's content, flagging critical items immediately.
-   **Data Extraction**: Identifies and extracts complex data structures like `tables` and `charts`, preserving their structure and data points.
-   **Jump-to-Page**: **Crucially, the AI identifies the page number for each extracted table and chart**, allowing users to instantly jump to its location in the original document for verification.

### Search & Discovery
-   **Semantic Search**: Ask questions in natural language (e.g., "Show me maintenance reports from last month"). The backend uses NLP techniques (TF-IDF, synonym expansion, cosine similarity) to find the most contextually relevant documents.
-   **Faceted & Keyword Search**: Filter documents by department, type, date range, or keywords for traditional, precise searching.

### User Interface & Analytics
-   **Interactive UI**: A clean, responsive, and intuitive interface built with React and TailwindCSS.
-   **Detailed Document Modal**: A powerful modal view that provides a 360-degree look at each document, including:
    -   AI Summary & Metadata.
    -   An embedded viewer for the **original document**.
    -   Dynamically rendered **interactive charts** (Bar, Line, Pie) based on extracted data.
    -   Clearly formatted **data tables**.
-   **Analytics Engine**: Visualizes trends and distributions across departments, document types, and statuses.

## 🏛️ Architecture & Data Flow

This project uses a modern client-server architecture. The frontend is a single-page application (SPA) built in React that communicates with a Python Flask backend via a REST API.

### 1. Document Ingestion and Analysis Flow

This chart shows how a document is processed from the moment it's uploaded until it's available for searching.

```mermaid
graph TD
    A[User Uploads File <br> (PDF, DOCX, JPG...)] --> B{Flask Backend Receives Request};
    B --> C{Extract Raw Text};
    subgraph Text Extraction
        C --> D{Is it a text-based file? <br> (PDF, DOCX)};
        D -- Yes --> E[Use PyMuPDF / python-docx];
        D -- No --> F{Is it an image or scanned PDF?};
        F -- Yes --> G[Pre-process Image & Run OCR with Tesseract];
        F -- No --> H[Treat as plain text];
    end
    
    subgraph AI Analysis
      I(Extracted Text + Original File) --> J[Send to Google Gemini API];
      J --> K(Receive Structured JSON <br> title, summary, tags, charts, <br> tables with page_numbers);
    end

    E --> I;
    G --> I;
    H --> I;

    K --> L{Backend Post-Processing};
    L --> M[Normalize Chart Data];
    M --> N[Save Document & Metadata to MongoDB];
    N --> O[Document is now searchable];

```

### 2. Search Request Flow

This chart illustrates how both semantic and traditional search queries are handled.

```mermaid
graph TD
    A[User Enters Query in React UI] --> B{Choose Search Type};
    B -- Semantic Search --> C[POST /api/search/semantic];
    C --> D[Flask Backend];
    D --> E[Pre-process Query <br> (stopwords, synonyms)];
    E --> F[Calculate TF-IDF & Cosine Similarity <br> against documents in DB];
    F --> G[Return Ranked, Relevant Results];

    B -- Traditional Search / Filter --> H[GET /api/documents?search=...];
    H --> I[Flask Backend];
    I --> J[Construct MongoDB Query <br> (regex, filters)];
    J --> K[Return Filtered Documents];

    G --> L[React UI Displays Results];
    K --> L;
```

## 🛠️ Tech Stack

| Category      | Technology                                                                                                  |
|---------------|-------------------------------------------------------------------------------------------------------------|
| **Backend**   | [Python](https://www.python.org/), [Flask](https://flask.palletsprojects.com/), [MongoDB](https://www.mongodb.com/), [PyMongo](https://pymongo.readthedocs.io/), [Google GenAI SDK](https://github.com/google/generative-ai-python), [PyMuPDF (Fitz)](https://github.com/pymupdf/PyMuPDF), [python-docx](https://python-docx.readthedocs.io/), [Pillow](https://python-pillow.org/), [Tesseract (OCR)](https://github.com/tesseract-ocr/tesseract) |
| **Frontend**  | [React.js](https://reactjs.org/), [TailwindCSS](https://tailwindcss.com/), [Chart.js](https://www.chartjs.org/), [Lucide React](https://lucide.dev/) (Icons) |
| **DevOps**    | [dotenv](https://github.com/theskumar/python-dotenv) for environment management                               |

## 🚀 Getting Started

Follow these instructions to get the project running on your local machine.

### Prerequisites

-   [Python 3.10+](https://www.python.org/downloads/) & `pip`
-   [Node.js 18+](https://nodejs.org/) & `npm`
-   [MongoDB](https://www.mongodb.com/try/download/community) installed and running.
-   **Tesseract OCR Engine**: This must be installed on your system.
    -   **Windows**: Download from [UB Mannheim](https://github.com/UB-Mannheim/tesseract/wiki) or install via Chocolatey (`choco install tesseract`).
    -   **macOS**: `brew install tesseract`
    -   **Linux (Ubuntu)**: `sudo apt install tesseract-ocr`

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/kmrl-docintel.git
cd kmrl-docintel
```

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment and activate it
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file and add your configuration
touch .env
```

**Contents of `backend/.env`:**
```env
# Your MongoDB connection string
MONGO_URI="mongodb://localhost:27017/"
DB_NAME="kmrl_docintel"

# Your Google AI Studio API Key
GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"

# Model can be 'pro' or 'flash'. 'pro' is recommended for better results.
GEMINI_MODEL="pro"

# Optional: Path to the folder where uploaded files will be stored
# UPLOAD_FOLDER="C:/path/to/your/uploads"
```

### 3. Frontend Setup

```bash
# Navigate to the root project directory (or wherever your package.json is)
cd ..

# Install dependencies
npm install

# Create a .env file for the frontend
touch .env
```

**Contents of `.env` (in the root or frontend folder):**
```env
# The base URL of your Flask backend
VITE_API_URL="http://localhost:5000"
```

### 4. Running the Application

1.  **Start the Backend**:
    ```bash
    # From the /backend directory with virtual env active
    flask run
    ```
    The backend API should now be running on `http://localhost:5000`.

2.  **Start the Frontend**:
    Open a **new terminal**.
    ```bash
    # From the project's root directory
    npm run dev
    ```
    The React application should now be running and accessible at `http://localhost:5173` (or another port if 5173 is busy).

## 📜 API Endpoints

A summary of the main API routes available.

| Method | Endpoint                             | Description                                            |
|--------|--------------------------------------|--------------------------------------------------------|
| `GET`  | `/api/documents`                     | Get a paginated list of documents with filters.        |
| `POST` | `/api/documents/upload`              | Upload a new document for processing and analysis.     |
| `GET`  | `/api/documents/<doc_id>`            | Get details for a single document.                     |
| `PUT`  | `/api/documents/<doc_id>`            | Update a document's status, tags, or starred state.    |
| `DELETE`| `/api/documents/<doc_id>`           | Delete a document.                                     |
| `GET`  | `/api/documents/<doc_id>/file`       | Download the original file for a document.             |
| `POST` | `/api/search/semantic`               | Perform a semantic search with a natural language query. |
| `GET`  | `/api/dashboard/stats`               | Get main statistics for the dashboard homepage.        |
| `GET`  | `/api/dashboard/departments`         | Get document counts aggregated by department.          |
| `GET`  | `/api/dashboard/tags`                | Get the most frequently used tags.                     |

## 🔮 Future Improvements

-   **User Authentication & RBAC**: Implement user login and role-based access control (e.g., Admin, Viewer) to secure the application.
-   **Document Versioning**: Track changes and allow users to view or revert to previous versions of a document.
-   **Batch Processing**: Allow users to upload and process multiple documents at once.
-   **Enhanced Analytics**: Create more detailed reports and time-series analysis on document processing and trends.
-   **Production Deployment**: Add Dockerfiles and deployment scripts for platforms like AWS, Google Cloud, or Heroku.
