from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import json
import csv
import io
import os
from typing import List, Dict, Any, Optional

router = APIRouter()

# Get directories from environment variables or use defaults
def get_storage_dir():
    return os.environ.get("DATAFORGE_STORAGE_DIR", "../storage")

def get_exports_dir():
    return os.environ.get("DATAFORGE_EXPORTS_DIR", "../dataset_exports")

class ExportRequest(BaseModel):
    file_id: str
    format: str  # "csv" or "jsonl"
    include_annotations: bool = True

def get_parsed_data(file_id: str) -> List[Dict[str, Any]]:
    """Retrieve parsed data for a file (would normally call parse endpoint)"""
    # In a real implementation, you might cache parsed data
    # For now, this is a placeholder - the frontend should call parse first
    return []

def get_annotations_data(file_id: str) -> Dict[str, Dict[str, Any]]:
    """Retrieve annotations for a file"""
    storage_dir = get_storage_dir()
    annotations_file = f"{storage_dir}/annotations/{file_id}_annotations.json"
    if os.path.exists(annotations_file):
        try:
            with open(annotations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

@router.post("/export")
async def export_data(request: ExportRequest):
    """Export annotated data as CSV or JSONL"""
    if request.format not in ["csv", "jsonl"]:
        raise HTTPException(status_code=400, detail="Format must be 'csv' or 'jsonl'")
    
    try:
        # Get parsed data (in real implementation, this would retrieve cached results)
        parsed_data = get_parsed_data(request.file_id)
        
        # Get annotations if requested
        annotations = {}
        if request.include_annotations:
            annotations = get_annotations_data(request.file_id)
        
        # Combine data
        export_data = []
        for paragraph in parsed_data:
            item = {
                "file_id": request.file_id,
                "paragraph_id": paragraph.get("id"),
                "page": paragraph.get("page"),
                "paragraph_index": paragraph.get("paragraph_index"),
                "text": paragraph.get("text"),
                "word_count": paragraph.get("word_count"),
                "char_count": paragraph.get("char_count")
            }
            
            # Add annotations if available
            paragraph_id = paragraph.get("id")
            if request.include_annotations and paragraph_id and paragraph_id in annotations:
                annotation = annotations[paragraph_id]
                item.update({
                    "annotation_id": annotation.get("annotation_id"),
                    "annotation_timestamp": annotation.get("timestamp"),
                    "annotations": json.dumps(annotation) if annotation else None
                })
            
            export_data.append(item)
        
        # Generate export file
        export_dir = get_exports_dir()
        os.makedirs(export_dir, exist_ok=True)
        
        filename = f"{request.file_id}_export.{request.format}"
        file_path = os.path.join(export_dir, filename)
        
        if request.format == "csv":
            content = export_to_csv(export_data)
        else:  # jsonl
            content = export_to_jsonl(export_data)
        
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return {
            "message": f"Data exported to {request.format.upper()} format successfully",
            "file_id": request.file_id,
            "format": request.format,
            "filename": filename,
            "record_count": len(export_data),
            "include_annotations": request.include_annotations,
            "download_url": f"/api/export/{request.file_id}?format={request.format}&include_annotations={request.include_annotations}"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

@router.get("/export/{file_id}")
async def download_export(
    file_id: str,
    format: str = Query(..., regex="^(csv|jsonl)$"),
    include_annotations: bool = Query(True)
):
    """Download exported data file"""
    try:
        export_dir = get_exports_dir()
        filename = f"{file_id}_export.{format}"
        file_path = os.path.join(export_dir, filename)
        
        if not os.path.exists(file_path):
            # Try to generate the file first
            request = ExportRequest(
                file_id=file_id,
                format=format,
                include_annotations=include_annotations
            )
            await export_data(request)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Export file not found")
        
        # Read and stream the file
        def file_generator():
            with open(file_path, 'r', encoding='utf-8') as f:
                while True:
                    chunk = f.read(8192)
                    if not chunk:
                        break
                    yield chunk
        
        media_type = "text/csv" if format == "csv" else "application/jsonl"
        
        return StreamingResponse(
            file_generator(),
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Type": media_type
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

def export_to_csv(data: List[Dict[str, Any]]) -> str:
    """Convert data to CSV format"""
    if not data:
        return ""
    
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)
    return output.getvalue()

def export_to_jsonl(data: List[Dict[str, Any]]) -> str:
    """Convert data to JSONL format (HuggingFace compatible)"""
    lines = []
    for item in data:
        lines.append(json.dumps(item, ensure_ascii=False))
    return "\n".join(lines)