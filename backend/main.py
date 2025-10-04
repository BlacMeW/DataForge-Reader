from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create necessary directories - handle both regular and AppImage execution
storage_dir = "./storage"
uploads_dir = "./storage/uploads"
exports_dir = "./dataset_exports"

try:
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(exports_dir, exist_ok=True)
    print(f"Using regular directories: {uploads_dir}, {exports_dir}")
except (OSError, PermissionError):
    # If we can't create in parent directory (like in AppImage), use temp directories
    import tempfile
    temp_dir = tempfile.gettempdir()
    storage_dir = os.path.join(temp_dir, "dataforge_storage")
    uploads_dir = os.path.join(temp_dir, "dataforge_storage", "uploads")
    annotations_dir = os.path.join(temp_dir, "dataforge_storage", "annotations")
    exports_dir = os.path.join(temp_dir, "dataforge_exports")
    
    os.makedirs(uploads_dir, exist_ok=True)
    os.makedirs(annotations_dir, exist_ok=True)
    os.makedirs(exports_dir, exist_ok=True)
    print(f"Using temporary directories: {uploads_dir}, {annotations_dir}, {exports_dir}")

# Set environment variables for routers to use
os.environ["DATAFORGE_STORAGE_DIR"] = storage_dir
os.environ["DATAFORGE_UPLOADS_DIR"] = uploads_dir
os.environ["DATAFORGE_EXPORTS_DIR"] = exports_dir

app = FastAPI(
    title="DataForge Reader API",
    description="API for uploading, parsing, and annotating PDF/EPUB files",
    version="1.0.0"
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173"
    ],  # React development servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Import and include routers - AppImage compatible
import sys
import os

# Add current directory to Python path for AppImage compatibility
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Try relative imports first
    from .routers import upload, parse, annotate, export, templates, data_mining
    from .routers import data_mining_enhanced
    print("Successfully imported routers with relative imports")
except ImportError as e:
    print(f"Relative import failed: {e}")
    try:
        # Fallback to absolute imports for AppImage environment
        from routers import upload, parse, annotate, export, templates, data_mining
        from routers import data_mining_enhanced
        print("Successfully imported routers with absolute imports")
    except ImportError as e2:
        print(f"Absolute import also failed: {e2}")
        # Last resort: import individual files
        try:
            import routers.upload as upload
            import routers.parse as parse
            import routers.annotate as annotate
            import routers.export as export
            import routers.templates as templates
            import routers.data_mining as data_mining
            import routers.data_mining_enhanced as data_mining_enhanced
            print("Successfully imported individual router modules")
        except ImportError as e3:
            print(f"All import methods failed: {e3}")
            # Add basic endpoints as fallback
            from fastapi import File, UploadFile
            @app.post("/api/upload")
            async def upload_file(file: UploadFile = File(...)):
                return {"message": "Upload endpoint working", "filename": file.filename}
            
            @app.get("/api/dataset/templates")
            async def get_templates_fallback():
                return {"templates": [], "error": "Templates router not available"}
            
            print("Added fallback endpoints")
            upload = parse = annotate = export = templates = data_mining = data_mining_enhanced = None

# Include routers if successfully imported
try:
    if 'upload' in locals() and upload and hasattr(upload, 'router'):
        app.include_router(upload.router, prefix="/api", tags=["upload"])
        print("Added upload router")

    if 'parse' in locals() and parse and hasattr(parse, 'router'):
        app.include_router(parse.router, prefix="/api", tags=["parse"])
        print("Added parse router")

    if 'annotate' in locals() and annotate and hasattr(annotate, 'router'):
        app.include_router(annotate.router, prefix="/api", tags=["annotate"])
        print("Added annotate router")

    if 'export' in locals() and export and hasattr(export, 'router'):
        app.include_router(export.router, prefix="/api", tags=["export"])
        print("Added export router")

    if 'templates' in locals() and templates and hasattr(templates, 'router'):
        app.include_router(templates.router, prefix="/api/dataset", tags=["templates"])
        print("Added templates router - this should fix the AppImage issue!")
    else:
        print("WARNING: Templates router not loaded - this is the AppImage issue!")
    
    if 'data_mining' in locals() and data_mining and hasattr(data_mining, 'router'):
        app.include_router(data_mining.router, prefix="/api", tags=["data-mining"])
        print("Added data mining router")
    
    # Add enhanced data mining router with advanced NLP features
    if 'data_mining_enhanced' in locals() and data_mining_enhanced and hasattr(data_mining_enhanced, 'router'):
        app.include_router(data_mining_enhanced.router, prefix="/api/nlp", tags=["nlp-enhanced"])
        print("Added enhanced NLP data mining router")
except Exception as e:
    print(f"Error adding routers: {e}")

@app.get("/")
def root():
    return {"message": "DataForge Reader API is running"}

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "message": "DataForge Reader API is running"}

@app.get("/api/user-guide")
def get_user_guide():
    """Serve the user guide documentation"""
    try:
        import os
        guide_path = os.path.join(os.path.dirname(__file__), "..", "USER_GUIDE.md")
        with open(guide_path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"content": content, "format": "markdown"}
    except FileNotFoundError:
        return {"error": "User guide not found", "content": "# User Guide\n\nUser guide is being prepared..."}
    except Exception as e:
        return {"error": str(e), "content": "# Error\n\nFailed to load user guide."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)