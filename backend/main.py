from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

# Create necessary directories - handle both regular and AppImage execution
try:
    os.makedirs("../storage/uploads", exist_ok=True)
    os.makedirs("../dataset_exports", exist_ok=True)
except (OSError, PermissionError):
    # If we can't create in parent directory (like in AppImage), use temp directories
    import tempfile
    temp_dir = tempfile.gettempdir()
    os.makedirs(os.path.join(temp_dir, "dataforge_storage", "uploads"), exist_ok=True)
    os.makedirs(os.path.join(temp_dir, "dataforge_exports"), exist_ok=True)
    print(f"Using temporary directories: {temp_dir}/dataforge_*")

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

# Import and include routers - AppImage compatible
import sys
import os

# Add current directory to Python path for AppImage compatibility
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    # Try relative imports first
    from .routers import upload, parse, annotate, export, templates
    print("Successfully imported routers with relative imports")
except ImportError as e:
    print(f"Relative import failed: {e}")
    try:
        # Fallback to absolute imports for AppImage environment
        from routers import upload, parse, annotate, export, templates
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
            upload = parse = annotate = export = templates = None

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