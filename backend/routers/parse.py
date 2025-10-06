from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import os
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
import tempfile
import re
import json
import time
import logging
import warnings
import sys

# Get upload directory from environment variable or use default
def get_upload_dir():
    return os.environ.get("DATAFORGE_UPLOADS_DIR", "../storage/uploads")

from typing import List, Dict, Any
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

# Context manager to suppress PDF parsing warnings
class SuppressPDFWarnings:
    """Context manager to suppress PyMuPDF stderr warnings during PDF operations"""
    
    def __init__(self):
        self.original_stderr = None
        self.devnull = None
    
    def __enter__(self):
        # Redirect stderr to suppress PyMuPDF warnings
        self.original_stderr = sys.stderr
        self.devnull = open(os.devnull, 'w')
        sys.stderr = self.devnull
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Restore original stderr
        if self.original_stderr:
            sys.stderr = self.original_stderr
        if self.devnull:
            self.devnull.close()
        return False

# Configure warnings to suppress PDF-related warnings
warnings.filterwarnings("ignore", message=".*invalid float value.*")
warnings.filterwarnings("ignore", message=".*Cannot set gray.*")

router = APIRouter()

class ParseRequest(BaseModel):
    file_id: str
    use_ocr: bool = False  # Force OCR even for text-based PDFs

class ParseResponse(BaseModel):
    file_id: str
    filename: str
    total_pages: int
    paragraphs: List[Dict[str, Any]]
    extraction_method: str
    processing_time: float

def clean_text(text: str) -> str:
    """Clean extracted text by removing extra whitespace and fixing common issues"""
    if not text:
        return ""
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove leading/trailing whitespace
    text = text.strip()
    
    # Fix common OCR issues
    text = re.sub(r'([a-z])([A-Z])', r'\1 \2', text)  # Add space between lowercase and uppercase
    text = re.sub(r'(\w)([.!?])(\w)', r'\1\2 \3', text)  # Add space after punctuation
    
    return text

def extract_paragraphs_from_text(text: str, page_num: int) -> List[Dict[str, Any]]:
    """Split text into paragraphs and create structured data"""
    if not text.strip():
        return []
    
    # Split by double newlines or single newlines followed by significant whitespace
    paragraphs = re.split(r'\n\s*\n|\n(?=\s{4,})', text)
    
    result = []
    for i, paragraph in enumerate(paragraphs):
        cleaned = clean_text(paragraph)
        if len(cleaned) > 10:  # Filter out very short paragraphs
            # Calculate rich metadata
            words = cleaned.split()
            word_count = len(words)
            
            result.append({
                "id": f"p_{page_num}_{i}",
                "page": page_num,
                "paragraph_index": i,
                "text": cleaned,
                "word_count": word_count,
                "char_count": len(cleaned),
                "annotations": {},  # Placeholder for future annotations
                
                # Enhanced metadata for better data mining
                "sentence_count": len(re.findall(r'[.!?]+', cleaned)),
                "avg_word_length": round(sum(len(w) for w in words) / max(word_count, 1), 2),
                "has_numbers": bool(re.search(r'\d', cleaned)),
                "has_special_chars": bool(re.search(r'[^\w\s.,!?-]', cleaned)),
                "starts_with_capital": cleaned[0].isupper() if cleaned else False,
                "ends_with_punctuation": cleaned[-1] in '.!?' if cleaned else False,
                "is_question": cleaned.strip().endswith('?') if cleaned else False,
                
                # Content type hints for smart processing
                "likely_heading": len(cleaned) < 100 and not cleaned.endswith('.'),
                "likely_list_item": cleaned.startswith(('- ', '* ', '• ')) or bool(re.match(r'^\d+[\.\)]', cleaned.strip())),
                "likely_quote": cleaned.startswith(('"', '"', '«')) or cleaned.count('"') >= 2,
            })
    
    return result

def extract_text_pdfplumber(file_path: str) -> tuple[List[Dict[str, Any]], str]:
    """Extract text using pdfplumber (for text-based PDFs)"""
    paragraphs = []
    
    try:
        with SuppressPDFWarnings():
            with pdfplumber.open(file_path) as pdf:
                total_pages = len(pdf.pages)
                
                for page_num, page in enumerate(pdf.pages, 1):
                    text = page.extract_text()
                    if text and text.strip():
                        page_paragraphs = extract_paragraphs_from_text(text, page_num)
                        paragraphs.extend(page_paragraphs)
                
                return paragraphs, "pdfplumber"
    
    except Exception as e:
        raise Exception(f"PDFplumber extraction failed: {str(e)}")

def extract_text_ocr(file_path: str) -> tuple[List[Dict[str, Any]], str]:
    """Extract text using OCR (for scanned PDFs or when forced)"""
    paragraphs = []
    
    try:
        # Convert PDF pages to images
        images = convert_from_path(file_path, dpi=300)
        
        for page_num, image in enumerate(images, 1):
            # Use pytesseract to extract text from image
            text = pytesseract.image_to_string(image, lang='eng')
            
            if text and text.strip():
                page_paragraphs = extract_paragraphs_from_text(text, page_num)
                paragraphs.extend(page_paragraphs)
        
        return paragraphs, "ocr"
    
    except Exception as e:
        raise Exception(f"OCR extraction failed: {str(e)}")

def detect_scanned_pdf(file_path: str) -> bool:
    """Detect if PDF is scanned by checking text content"""
    try:
        with SuppressPDFWarnings():
            with pdfplumber.open(file_path) as pdf:
                # Check first few pages for text content
                pages_to_check = min(3, len(pdf.pages))
                total_text = ""
                
                for i in range(pages_to_check):
                    text = pdf.pages[i].extract_text()
                    if text:
                        total_text += text
                
                # If very little text found, likely scanned
                return len(total_text.strip()) < 100
    
    except Exception:
        return True  # Assume scanned if detection fails

def extract_text_epub(file_path: str) -> tuple[List[Dict[str, Any]], str]:
    """Extract text from EPUB files"""
    paragraphs = []
    
    try:
        book = epub.read_epub(file_path)
        page_num = 1
        
        # Get all items in the book
        for item in book.get_items():
            if item.get_type() == ebooklib.ITEM_DOCUMENT:
                # Parse HTML content
                soup = BeautifulSoup(item.get_content(), 'html.parser')
                
                # Extract text from paragraphs and other text elements
                text_elements = soup.find_all(['p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'])
                
                for element in text_elements:
                    text = element.get_text(strip=True)
                    if text and len(text) > 10:  # Filter out very short content
                        cleaned = clean_text(text)
                        if cleaned:
                            paragraphs.append({
                                "id": f"epub_{page_num}_{len(paragraphs)}",
                                "page": page_num,
                                "paragraph_index": len([p for p in paragraphs if p["page"] == page_num]),
                                "text": cleaned,
                                "word_count": len(cleaned.split()),
                                "char_count": len(cleaned),
                                "annotations": {}
                            })
                
                page_num += 1
        
        return paragraphs, "epub"
    
    except Exception as e:
        raise Exception(f"EPUB extraction failed: {str(e)}")

@router.post("/parse", response_model=ParseResponse)
async def parse_file(request: ParseRequest):
    """Parse uploaded file and extract text as paragraphs"""
    import time
    start_time = time.time()
    
    try:
        # Find the uploaded file
        upload_dir = get_upload_dir()
        file_path = None
        original_filename = None
        
        for filename in os.listdir(upload_dir):
            if filename.startswith(request.file_id):
                file_path = os.path.join(upload_dir, filename)
                original_filename = filename
                break
        
        if not file_path or not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        # Determine file type
        file_ext = os.path.splitext(file_path)[1].lower()
        if file_ext not in ['.pdf', '.epub']:
            raise HTTPException(status_code=400, detail="Only PDF and EPUB files are supported")
        
        # Handle both PDF and EPUB files
        if file_ext == '.epub':
            paragraphs, extraction_method = extract_text_epub(file_path)
            total_pages = len(set(p["page"] for p in paragraphs)) if paragraphs else 1
        elif file_ext == '.pdf':
            paragraphs = []
            extraction_method = ""
            
            # Determine extraction method for PDF
            if request.use_ocr:
                # Force OCR
                paragraphs, extraction_method = extract_text_ocr(file_path)
            else:
                # Try text extraction first, fallback to OCR
                try:
                    if detect_scanned_pdf(file_path):
                        paragraphs, extraction_method = extract_text_ocr(file_path)
                    else:
                        paragraphs, extraction_method = extract_text_pdfplumber(file_path)
                        
                        # If no paragraphs found with pdfplumber, try OCR
                        if not paragraphs:
                            paragraphs, extraction_method = extract_text_ocr(file_path)
                            extraction_method += " (fallback)"
                
                except Exception as e:
                    # Final fallback to OCR
                    try:
                        paragraphs, extraction_method = extract_text_ocr(file_path)
                        extraction_method += " (fallback)"
                    except Exception as ocr_error:
                        raise HTTPException(
                            status_code=500, 
                            detail=f"Both text extraction and OCR failed. Text error: {str(e)}, OCR error: {str(ocr_error)}"
                        )
            
            # Get total pages for PDF
            try:
                with SuppressPDFWarnings():
                    with pdfplumber.open(file_path) as pdf:
                        total_pages = len(pdf.pages)
            except:
                total_pages = len(set(p["page"] for p in paragraphs)) if paragraphs else 0
        
        processing_time = time.time() - start_time
        
        # Cache the parsed results for export functionality
        save_to_cache(request.file_id, paragraphs, total_pages, extraction_method, processing_time)
        
        # Automatically index for RAG search
        try:
            from .rag import router as rag_router
            # Import the RAG indexing function
            from .rag import convert_parsed_data_to_rag_documents, rag_index
            
            # Convert parsed data to RAG format
            dataset_name = original_filename or f"Document {request.file_id}"
            rag_documents = convert_parsed_data_to_rag_documents(
                request.file_id, 
                {
                    'paragraphs': paragraphs,
                    'extraction_method': extraction_method,
                    'filename': dataset_name
                }, 
                dataset_name
            )
            
            # Index documents
            indexed_count = 0
            for doc in rag_documents:
                if doc['id'] not in rag_index['embeddings']:
                    # Create embedding (import the function)
                    from .rag import create_simple_embedding
                    embedding = create_simple_embedding(doc['fullText'])
                    rag_index['embeddings'][doc['id']] = embedding
                    rag_index['documents'].append(doc)
                    indexed_count += 1
            
            # Update stats
            if request.file_id not in rag_index['indexed_datasets']:
                rag_index['indexed_datasets'].add(request.file_id)
                rag_index['stats']['indexed_datasets'] += 1
            
            rag_index['stats']['total_documents'] += indexed_count
            from datetime import datetime
            rag_index['stats']['last_updated'] = datetime.now().isoformat()
            
            # Save index to disk
            from .rag import save_rag_index
            save_rag_index()
            
            print(f"Auto-indexed {indexed_count} paragraphs for RAG search")
            
        except Exception as rag_error:
            print(f"Warning: RAG auto-indexing failed: {rag_error}")
            # Don't fail the parsing if RAG indexing fails
        
        return ParseResponse(
            file_id=request.file_id,
            filename=original_filename or "unknown",
            total_pages=total_pages,
            paragraphs=paragraphs,
            extraction_method=extraction_method,
            processing_time=round(processing_time, 2)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Parsing failed: {str(e)}")

def save_to_cache(file_id: str, paragraphs: List[Dict[str, Any]], 
                  total_pages: int, extraction_method: str, processing_time: float):
    """Save parsed data to cache"""
    upload_dir = get_upload_dir()
    storage_dir = os.path.dirname(upload_dir)
    cache_dir = os.path.join(storage_dir, "cache")
    os.makedirs(cache_dir, exist_ok=True)
    
    cache_file = os.path.join(cache_dir, f"{file_id}_parsed.json")
    
    try:
        with open(cache_file, 'w', encoding='utf-8') as f:
            json.dump({
                'file_id': file_id,
                'paragraphs': paragraphs,
                'total_pages': total_pages,
                'extraction_method': extraction_method,
                'processing_time': processing_time,
                'cached_at': time.time()
            }, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Warning: Could not cache parsed data: {e}")


@router.get("/parse/{file_id}")
async def get_parsed_content(file_id: str):
    """Get previously parsed content (if cached) or parse file"""
    # For now, just call parse endpoint
    # In production, you might want to cache parsed results
    request = ParseRequest(file_id=file_id)
    return await parse_file(request)