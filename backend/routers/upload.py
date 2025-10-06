from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import os
import uuid
import magic
from typing import List

# Get upload directory from environment variable or use default
def get_upload_dir():
    return os.environ.get("DATAFORGE_UPLOADS_DIR", "../storage/uploads")

router = APIRouter()

ALLOWED_EXTENSIONS = {'.pdf', '.epub', '.csv'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'application/epub+zip',
    'application/x-mobipocket-ebook',
    'application/zip',  # EPUB files are often detected as ZIP
    'application/octet-stream',  # Sometimes EPUB files are detected as binary
    'text/csv'
}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(file: UploadFile) -> tuple[bool, str]:
    """Validate uploaded file type and size"""
    # Check if filename exists
    if not file.filename:
        return False, "No filename provided"
    
    # Check file extension
    file_ext = os.path.splitext(file.filename.lower())[1]
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"File type {file_ext} not allowed. Only PDF and EPUB files are supported."
    
    # Check file size (estimate from content-length if available)
    if hasattr(file, 'size') and file.size and file.size > MAX_FILE_SIZE:
        return False, f"File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
    
    return True, "Valid file"

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    """Upload a PDF or EPUB file and save it to storage"""
    try:
        # Validate file
        is_valid, message = validate_file(file)
        if not is_valid:
            raise HTTPException(status_code=400, detail=message)
        
        # Generate unique filename
        file_id = str(uuid.uuid4())
        filename = file.filename or "unknown"
        file_ext = os.path.splitext(filename.lower())[1]
        unique_filename = f"{file_id}{file_ext}"
        
        # Create upload path
        upload_dir = get_upload_dir()
        os.makedirs(upload_dir, exist_ok=True)
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Read and validate file content
        content = await file.read()
        
        # Additional MIME type validation using python-magic
        try:
            mime_type = magic.from_buffer(content, mime=True)
            
            # Special handling for EPUB files (they can have various MIME types)
            if file_ext == '.epub':
                # For EPUB, accept common MIME types or skip validation
                epub_mime_types = {'application/epub+zip', 'application/zip', 'application/octet-stream'}
                if mime_type not in epub_mime_types:
                    print(f"Warning: EPUB file has unexpected MIME type: {mime_type}, but proceeding...")
            elif mime_type not in ALLOWED_MIME_TYPES:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Invalid file type detected: {mime_type}. Only PDF and EPUB files are supported."
                )
        except Exception as e:
            # If magic fails, continue with extension-based validation
            print(f"MIME type detection failed: {e}")
        
        # Check actual file size
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400, 
                detail=f"File size too large. Maximum size is {MAX_FILE_SIZE // (1024*1024)}MB."
            )
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(content)

        # If the uploaded file is a CSV, also copy it into the exports directory
        # using the expected exported dataset filename so the RAG indexing
        # endpoint (which loads exported datasets from exports dir) can find it.
        try:
            if file_ext == '.csv':
                exports_dir = os.environ.get("DATAFORGE_EXPORTS_DIR", "../dataset_exports")
                os.makedirs(exports_dir, exist_ok=True)
                export_filename = f"{file_id}_export.csv"
                export_path = os.path.join(exports_dir, export_filename)
                with open(export_path, 'wb') as ef:
                    ef.write(content)
        except Exception as e:
            # Non-fatal: warn and continue
            print(f"Warning: could not copy uploaded CSV to exports dir: {e}")
        
        return JSONResponse(
            status_code=200,
            content={
                "message": "File uploaded successfully",
                "file_id": file_id,
                "filename": file.filename,
                "file_path": unique_filename,
                "file_size": len(content),
                "file_type": file_ext[1:]  # Remove the dot
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@router.get("/uploads")
async def list_uploads():
    """List all uploaded files"""
    try:
        upload_dir = get_upload_dir()
        if not os.path.exists(upload_dir):
            return {"files": []}
        
        files = []
        for filename in os.listdir(upload_dir):
            file_path = os.path.join(upload_dir, filename)
            if os.path.isfile(file_path):
                stat = os.stat(file_path)
                file_id = os.path.splitext(filename)[0]
                file_ext = os.path.splitext(filename)[1][1:]  # Remove dot
                
                files.append({
                    "file_id": file_id,
                    "filename": filename,
                    "file_type": file_ext,
                    "file_size": stat.st_size,
                    "upload_time": stat.st_mtime
                })
        
        return {"files": files}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list files: {str(e)}")

@router.delete("/uploads/{file_id}")
async def delete_upload(file_id: str):
    """Delete an uploaded file"""
    try:
        upload_dir = get_upload_dir()
        
        # Find file with matching ID
        for filename in os.listdir(upload_dir):
            if filename.startswith(file_id):
                file_path = os.path.join(upload_dir, filename)
                os.remove(file_path)
                return {"message": f"File {filename} deleted successfully"}
        
        raise HTTPException(status_code=404, detail="File not found")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete file: {str(e)}")