from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create necessary directories
os.makedirs("../storage/uploads", exist_ok=True)
os.makedirs("../dataset_exports", exist_ok=True)

app = FastAPI(
    title="DataForge Reader API",
    description="API for uploading, parsing, and annotating PDF/EPUB files",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React development servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers
try:
    from backend.routers import upload, parse, annotate, export
    app.include_router(upload.router, prefix="/api", tags=["upload"])
    app.include_router(parse.router, prefix="/api", tags=["parse"])
    app.include_router(annotate.router, prefix="/api", tags=["annotate"])
    app.include_router(export.router, prefix="/api", tags=["export"])
except ImportError as e:
    print(f"Warning: Could not import routers: {e}")
    print("Some API endpoints may not be available.")

@app.get("/")
def root():
    return {"message": "DataForge Reader API is running"}

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)