# DataForge Reader

A full-stack web application for PDF/EPUB text extraction and ML dataset creation.

## 🚀 Features

### Core Functionality
- **File Upload & Processing**: Support for PDF and EPUB files
- **Text Extraction**: Advanced parsing with metadata preservation
- **ML Dataset Templates**: 5 predefined templates for common ML tasks
- **Custom Template Designer**: Create custom dataset schemas
- **Annotation System**: Interactive text annotation interface
- **Dataset Export**: Export to CSV and JSONL formats

### ML Dataset Templates
1. **Sentiment Analysis** - Binary/multi-class sentiment classification
2. **Named Entity Recognition (NER)** - Token-level entity extraction
3. **Question Answering** - Reading comprehension datasets
4. **Text Summarization** - Abstractive/extractive summarization
5. **Text Classification** - General purpose text categorization

### Technical Stack
- **Backend**: FastAPI, Python 3.x, uvicorn
- **Frontend**: React, TypeScript, Vite
- **Styling**: Simple CSS (replaced TailwindCSS for reliability)
- **Text Processing**: pdfplumber, pytesseract, ebooklib
- **Data Storage**: JSON files for annotations, configurable export formats

## 📦 Installation

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup
```bash
cd frontend
npm install
```

## 🎯 Quick Start

### Option 1: Use the Backend Server Manager (Recommended)
The server manager provides systemd-like control over the backend server with automatic port management.

```bash
# Start backend server
./server start --force

# In another terminal, start frontend
cd frontend
npm run dev
```

**Server Manager Commands:**
```bash
./server start          # Start backend server
./server stop           # Stop backend server
./server restart        # Restart backend server
./server status         # Check server status
./server logs           # View recent logs
./server logs --follow  # Follow logs in real-time
```

See [SERVER_MANAGER.md](SERVER_MANAGER.md) for complete documentation or [SERVER_QUICK_REF.md](SERVER_QUICK_REF.md) for quick reference.

### Option 2: Use the start script
```bash
./start_app.sh
```

### Option 3: Start manually
```bash
# Terminal 1 - Backend
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Terminal 2 - Frontend  
cd frontend
npm run dev
```

### Access Points
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 🛠️ Usage

### Basic Workflow
1. **Select Template**: Choose a predefined ML template or create custom one
2. **Upload File**: Upload PDF or EPUB document
3. **Parse Content**: Automatic text extraction with paragraph segmentation
4. **Annotate Data**: Use the annotation interface to label data
5. **Export Dataset**: Download as CSV or JSONL for ML training

### Template System
The application provides sophisticated template management:

#### Predefined Templates
- **Sentiment Analysis**: Single/multi-choice classification
- **NER**: Entity highlighting with BIO labeling scheme
- **Question Answering**: Span selection for reading comprehension
- **Summarization**: Text generation tasks
- **Classification**: General categorization tasks

#### Custom Templates
Create templates with:
- Custom field definitions (string, integer, float, boolean, categorical, list)
- Flexible annotation schemas (single_choice, multi_choice, text_input, span_selection)
- Detailed annotation instructions for consistency

## 🏗️ Architecture

### Backend Structure
```
backend/
├── main.py                 # FastAPI application
├── requirements.txt        # Python dependencies
└── routers/
    ├── upload.py          # File upload handling
    ├── parse.py           # Text extraction
    ├── annotate.py        # Annotation management
    ├── export.py          # Dataset export
    └── templates.py       # ML template system
```

### Frontend Structure
```
frontend/
├── src/
│   ├── App.tsx            # Main application
│   ├── components/
│   │   ├── FileUpload.tsx             # File upload interface
│   │   ├── ParseViewer.tsx            # Text display & annotation
│   │   ├── DatasetTemplateSelector.tsx # Template selection
│   │   └── CustomTemplateDesigner.tsx  # Custom template creation
│   └── index.css          # Simple CSS styling
└── package.json
```

### API Endpoints
- `POST /api/upload/file` - Upload files
- `GET /api/parse/{file_id}` - Parse uploaded files
- `POST /api/annotate/{file_id}` - Save annotations
- `GET /api/export/{file_id}` - Export datasets
- `GET /api/dataset/templates` - Get predefined templates
- `POST /api/dataset/templates/custom` - Create custom templates

## 🧪 Testing

### Backend API Testing
```bash
python test_templates.py
```

### Template System Testing
The test script validates:
- Predefined template retrieval
- Custom template creation
- Export sample generation
- API endpoint functionality

## 🔧 Configuration

### Environment Variables
Set these in your environment or `.env` file:
- `UPLOAD_DIR`: Directory for uploaded files (default: `storage/uploads`)
- `ANNOTATION_DIR`: Directory for annotation files (default: `storage/annotations`)
- `EXPORT_DIR`: Directory for exported datasets (default: `dataset_exports`)

### Customization
- **Templates**: Add new predefined templates in `backend/routers/templates.py`
- **File Formats**: Extend parsing in `backend/routers/parse.py`
- **Export Formats**: Add new formats in `backend/routers/export.py`
- **UI Styling**: Modify `frontend/src/index.css`

## 🐛 Troubleshooting

### Common Issues
1. **Upload failures**: Check backend server is running on port 8000
2. **Parsing errors**: Ensure required Python packages are installed
3. **Frontend build issues**: Verify Node.js version compatibility
4. **CORS errors**: Backend includes CORS middleware for development

### Dependencies
If you encounter import errors, install missing packages:
```bash
cd backend
pip install ebooklib beautifulsoup4 python-multipart
```

## 🚧 Development Status

### Completed Features ✅
- File upload and validation
- PDF/EPUB text extraction
- Comprehensive template system (5 predefined templates)
- Custom template designer with full UI
- Annotation storage system
- Dataset export functionality
- Full-stack integration with proper error handling

### Architecture Decisions
- **CSS Framework**: Switched from TailwindCSS to simple CSS for better reliability
- **State Management**: React hooks with TypeScript for type safety
- **API Design**: RESTful endpoints with FastAPI automatic documentation
- **File Storage**: Local filesystem with configurable directories
- **Template System**: JSON-based schema with predefined ML task templates

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

---

Built with ❤️ for the ML community

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