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
from typing import List, Dict, Any
import ebooklib
from ebooklib import epub
from bs4 import BeautifulSoup

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
            result.append({
                "id": f"p_{page_num}_{i}",
                "page": page_num,
                "paragraph_index": i,
                "text": cleaned,
                "word_count": len(cleaned.split()),
                "char_count": len(cleaned),
                "annotations": {}  # Placeholder for future annotations
            })
    
    return result

def extract_text_pdfplumber(file_path: str) -> tuple[List[Dict[str, Any]], str]:
    """Extract text using pdfplumber (for text-based PDFs)"""
    paragraphs = []
    
    try:
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
        upload_dir = "../storage/uploads"
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
                with pdfplumber.open(file_path) as pdf:
                    total_pages = len(pdf.pages)
            except:
                total_pages = len(set(p["page"] for p in paragraphs)) if paragraphs else 0
        
        processing_time = time.time() - start_time
        
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

@router.get("/parse/{file_id}")
async def get_parsed_content(file_id: str):
    """Get previously parsed content (if cached) or parse file"""
    # For now, just call parse endpoint
    # In production, you might want to cache parsed results
    request = ParseRequest(file_id=file_id)
    return await parse_file(request)