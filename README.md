# DataForge Reader

A web application for uploading PDF/EPUB files, extracting text, annotating content, and exporting labeled data.

## Tech Stack
- **Frontend**: React + TailwindCSS
- **Backend**: FastAPI (Python)
- **PDF Processing**: pdfplumber, pytesseract, pdf2image
- **Export Formats**: CSV, JSONL (HuggingFace format)

## Project Structure
```
DataForge-Reader/
├── backend/              # FastAPI backend
│   ├── main.py          # FastAPI application
│   ├── requirements.txt # Python dependencies
│   └── routers/         # API route modules
├── frontend/            # React frontend
│   ├── src/             # React source code
│   └── public/          # Static assets
├── storage/
│   └── uploads/         # Uploaded files
└── dataset_exports/     # Exported datasets
```

## API Endpoints
- `POST /upload` - Upload PDF/EPUB files
- `POST /parse` - Extract text from uploaded files
- `POST /annotate` - Save annotations
- `GET /export` - Export labeled data as CSV/JSON

## Getting Started

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm start
```