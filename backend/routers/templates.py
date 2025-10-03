from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json

router = APIRouter()

class DatasetTemplate(BaseModel):
    id: str
    name: str
    description: str
    task_type: str  # "classification", "ner", "sentiment", "qa", "custom"
    fields: List[Dict[str, Any]]
    annotation_schema: Dict[str, Any]
    export_format: str  # "csv", "jsonl", "huggingface"

class CustomDatasetRequest(BaseModel):
    name: str
    description: str
    fields: List[Dict[str, Any]]
    annotation_schema: Dict[str, Any]

# Predefined dataset templates
PREDEFINED_TEMPLATES = {
    "sentiment_analysis": DatasetTemplate(
        id="sentiment_analysis",
        name="Sentiment Analysis",
        description="Text classification for positive/negative/neutral sentiment",
        task_type="classification",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "label", "type": "categorical", "options": ["positive", "negative", "neutral"]},
            {"name": "confidence", "type": "float", "optional": True}
        ],
        annotation_schema={
            "type": "single_choice",
            "options": ["positive", "negative", "neutral"],
            "instructions": "Select the overall sentiment of the text"
        },
        export_format="jsonl"
    ),
    
    "text_classification": DatasetTemplate(
        id="text_classification",
        name="Text Classification",
        description="General text classification with custom categories",
        task_type="classification",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "category", "type": "categorical", "options": []},
            {"name": "subcategory", "type": "string", "optional": True}
        ],
        annotation_schema={
            "type": "single_choice",
            "options": [],
            "allow_custom": True,
            "instructions": "Classify the text into appropriate category"
        },
        export_format="jsonl"
    ),
    
    "named_entity_recognition": DatasetTemplate(
        id="named_entity_recognition",
        name="Named Entity Recognition (NER)",
        description="Token-level classification for entity extraction",
        task_type="ner",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "entities", "type": "list", "description": "List of entities with positions"},
            {"name": "tokens", "type": "list", "description": "Tokenized text"},
            {"name": "labels", "type": "list", "description": "BIO labels for each token"}
        ],
        annotation_schema={
            "type": "entity_selection",
            "entity_types": ["PERSON", "ORG", "LOC", "MISC"],
            "labeling_scheme": "BIO",
            "instructions": "Highlight entities in the text and assign appropriate labels"
        },
        export_format="jsonl"
    ),
    
    "question_answering": DatasetTemplate(
        id="question_answering",
        name="Question Answering",
        description="Reading comprehension and question answering dataset",
        task_type="qa",
        fields=[
            {"name": "context", "type": "string", "description": "Source text/paragraph"},
            {"name": "question", "type": "string", "description": "Question about the context"},
            {"name": "answer", "type": "string", "description": "Answer text"},
            {"name": "answer_start", "type": "integer", "description": "Character position where answer starts"}
        ],
        annotation_schema={
            "type": "span_selection",
            "allow_no_answer": True,
            "instructions": "Select the text span that answers the question"
        },
        export_format="jsonl"
    ),
    
    "summarization": DatasetTemplate(
        id="summarization",
        name="Text Summarization",
        description="Abstractive or extractive text summarization",
        task_type="summarization",
        fields=[
            {"name": "document", "type": "string", "description": "Full document text"},
            {"name": "summary", "type": "string", "description": "Summary text"},
            {"name": "summary_type", "type": "categorical", "options": ["abstractive", "extractive"]}
        ],
        annotation_schema={
            "type": "text_generation",
            "max_length": 500,
            "instructions": "Write a concise summary of the main points"
        },
        export_format="jsonl"
    )
}

@router.get("/templates")
async def get_predefined_templates():
    """Get all predefined dataset templates"""
    return {
        "templates": list(PREDEFINED_TEMPLATES.values()),
        "count": len(PREDEFINED_TEMPLATES)
    }

@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID"""
    if template_id not in PREDEFINED_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return PREDEFINED_TEMPLATES[template_id]

@router.post("/templates/custom")
async def create_custom_template(request: CustomDatasetRequest):
    """Create a custom dataset template"""
    template = DatasetTemplate(
        id=f"custom_{request.name.lower().replace(' ', '_')}",
        name=request.name,
        description=request.description,
        task_type="custom",
        fields=request.fields,
        annotation_schema=request.annotation_schema,
        export_format="jsonl"
    )
    
    # In a real app, you'd save this to database
    # For now, just return the created template
    return {
        "message": "Custom template created successfully",
        "template": template
    }

@router.post("/templates/{template_id}/apply")
async def apply_template_to_file(template_id: str, file_id: str):
    """Apply a dataset template to parsed file content"""
    if template_id not in PREDEFINED_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = PREDEFINED_TEMPLATES[template_id]
    
    # This would integrate with the parsing system
    # For now, return template structure
    return {
        "message": f"Template {template.name} applied to file {file_id}",
        "template": template,
        "file_id": file_id,
        "annotation_url": f"/annotate/{file_id}?template={template_id}"
    }

@router.get("/templates/{template_id}/export-sample")
async def get_export_sample(template_id: str):
    """Get a sample export format for the template"""
    if template_id not in PREDEFINED_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    template = PREDEFINED_TEMPLATES[template_id]
    
    # Generate sample data based on template
    if template.task_type == "classification":
        sample = {
            "text": "This is a sample text for classification.",
            "label": "positive" if template_id == "sentiment_analysis" else "category_1"
        }
    elif template.task_type == "ner":
        sample = {
            "text": "John Smith works at Microsoft in Seattle.",
            "entities": [
                {"text": "John Smith", "label": "PERSON", "start": 0, "end": 10},
                {"text": "Microsoft", "label": "ORG", "start": 20, "end": 29},
                {"text": "Seattle", "label": "LOC", "start": 33, "end": 40}
            ]
        }
    elif template.task_type == "qa":
        sample = {
            "context": "The quick brown fox jumps over the lazy dog.",
            "question": "What color is the fox?",
            "answer": "brown",
            "answer_start": 10
        }
    else:
        sample = {field["name"]: f"sample_{field['name']}" for field in template.fields}
    
    return {
        "template": template,
        "sample_data": sample,
        "format": template.export_format
    }

@router.post("/templates/validate")
async def validate_template(template: Dict[str, Any]):
    """Validate a template structure"""
    errors = []
    warnings = []
    
    # Check required fields
    required_keys = ['id', 'name', 'fields']
    for key in required_keys:
        if key not in template:
            errors.append(f"Missing required field: '{key}'")
    
    # Validate fields array
    if 'fields' in template:
        if not isinstance(template['fields'], list):
            errors.append("'fields' must be a list")
        elif len(template['fields']) == 0:
            warnings.append("Template has no fields defined")
        else:
            field_names = set()
            for i, field in enumerate(template['fields']):
                # Check field structure
                if not isinstance(field, dict):
                    errors.append(f"Field {i} must be an object")
                    continue
                
                # Check field name
                if 'name' not in field:
                    errors.append(f"Field {i} missing 'name'")
                elif field['name'] in field_names:
                    errors.append(f"Duplicate field name: '{field['name']}'")
                else:
                    field_names.add(field['name'])
                
                # Check field type
                if 'type' not in field:
                    errors.append(f"Field '{field.get('name', i)}' missing 'type'")
                else:
                    valid_types = ['string', 'integer', 'float', 'boolean', 'categorical', 'list', 'object']
                    if field['type'] not in valid_types:
                        warnings.append(f"Field '{field.get('name')}' has non-standard type: '{field['type']}'")
                
                # Validate categorical options
                if field.get('type') == 'categorical' and 'options' not in field:
                    warnings.append(f"Categorical field '{field.get('name')}' should have 'options'")
    
    # Validate annotation schema
    if 'annotation_schema' in template:
        schema = template['annotation_schema']
        if not isinstance(schema, dict):
            errors.append("'annotation_schema' must be an object")
        else:
            if 'type' not in schema:
                warnings.append("Annotation schema missing 'type'")
            if 'instructions' not in schema:
                warnings.append("Annotation schema missing 'instructions' for users")
    else:
        warnings.append("Template missing 'annotation_schema'")
    
    # Check task type
    if 'task_type' in template:
        valid_task_types = ['classification', 'ner', 'qa', 'summarization', 'sentiment', 'custom']
        if template['task_type'] not in valid_task_types:
            warnings.append(f"Unusual task_type: '{template['task_type']}'")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors,
        "warnings": warnings,
        "message": "Template is valid" if len(errors) == 0 else f"Found {len(errors)} error(s)",
        "template_id": template.get('id', 'unknown')
    }
