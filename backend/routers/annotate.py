from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
import os
import json
import uuid
from datetime import datetime

router = APIRouter()

class AnnotationRequest(BaseModel):
    file_id: str
    paragraph_id: str
    annotations: Dict[str, Any]

class AnnotationResponse(BaseModel):
    message: str
    file_id: str
    paragraph_id: str
    annotations: Dict[str, Any]

def get_annotations_file_path(file_id: str) -> str:
    """Get the path to the annotations file for a given file_id"""
    annotations_dir = "../storage/annotations"
    os.makedirs(annotations_dir, exist_ok=True)
    return os.path.join(annotations_dir, f"{file_id}_annotations.json")

def load_annotations(file_id: str) -> Dict[str, Dict[str, Any]]:
    """Load annotations from file"""
    annotations_file = get_annotations_file_path(file_id)
    if os.path.exists(annotations_file):
        try:
            with open(annotations_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading annotations: {e}")
            return {}
    return {}

def save_annotations(file_id: str, annotations: Dict[str, Dict[str, Any]]):
    """Save annotations to file"""
    annotations_file = get_annotations_file_path(file_id)
    try:
        with open(annotations_file, 'w', encoding='utf-8') as f:
            json.dump(annotations, f, indent=2, ensure_ascii=False)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save annotations: {str(e)}")

@router.post("/annotate", response_model=AnnotationResponse)
async def save_annotation(request: AnnotationRequest):
    """Save annotations for a specific paragraph"""
    try:
        # Load existing annotations
        all_annotations = load_annotations(request.file_id)
        
        # Add timestamp to the annotation
        annotation_data = request.annotations.copy()
        annotation_data["timestamp"] = datetime.now().isoformat()
        annotation_data["annotation_id"] = str(uuid.uuid4())
        
        # Save the annotation for this paragraph
        all_annotations[request.paragraph_id] = annotation_data
        
        # Write back to file
        save_annotations(request.file_id, all_annotations)
        
        return AnnotationResponse(
            message="Annotation saved successfully",
            file_id=request.file_id,
            paragraph_id=request.paragraph_id,
            annotations=annotation_data
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save annotation: {str(e)}")

@router.get("/annotate/{file_id}")
async def get_annotations(file_id: str):
    """Get all annotations for a file"""
    try:
        annotations = load_annotations(file_id)
        return {
            "file_id": file_id,
            "annotations": annotations,
            "count": len(annotations),
            "message": f"Retrieved {len(annotations)} annotations successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve annotations: {str(e)}")

@router.delete("/annotate/{file_id}/{paragraph_id}")
async def delete_annotation(file_id: str, paragraph_id: str):
    """Delete annotation for a specific paragraph"""
    try:
        # Load existing annotations
        all_annotations = load_annotations(file_id)
        
        if paragraph_id not in all_annotations:
            raise HTTPException(status_code=404, detail="Annotation not found")
        
        # Remove the annotation
        del all_annotations[paragraph_id]
        
        # Save back to file
        save_annotations(file_id, all_annotations)
        
        return {
            "message": f"Annotation for paragraph {paragraph_id} deleted successfully",
            "file_id": file_id,
            "paragraph_id": paragraph_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete annotation: {str(e)}")