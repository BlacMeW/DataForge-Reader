from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid

app = FastAPI(title="DataForge Reader API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "DataForge Reader API is running"}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Quick upload endpoint"""
    try:
        # Validate file type
        if not file.filename.lower().endswith(('.pdf', '.epub')):
            raise HTTPException(status_code=400, detail="Only PDF and EPUB files allowed")
        
        # Generate file ID
        file_id = str(uuid.uuid4())
        
        # Save file
        os.makedirs("storage/uploads", exist_ok=True)
        file_path = f"storage/uploads/{file_id}_{file.filename}"
        
        content = await file.read()
        with open(file_path, "wb") as f:
            f.write(content)
        
        return {
            "file_id": file_id,
            "filename": file.filename,
            "file_type": file.filename.split('.')[-1],
            "file_size": len(content)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/parse")
async def parse_file(data: dict):
    """Quick parse endpoint"""
    file_id = data.get("file_id")
    if not file_id:
        raise HTTPException(status_code=400, detail="file_id required")
    
    # Mock response for now
    return {
        "file_id": file_id,
        "filename": "test.pdf",
        "total_pages": 1,
        "paragraphs": [
            {
                "id": "p_1_0",
                "page": 1,
                "paragraph_index": 0,
                "text": "This is a test paragraph from your uploaded document.",
                "word_count": 10,
                "char_count": 50,
                "annotations": {}
            }
        ],
        "extraction_method": "test",
        "processing_time": 0.1
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)