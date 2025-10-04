from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import json
import os
import uuid
from datetime import datetime

router = APIRouter()

class DatasetTemplate(BaseModel):
    id: str
    name: str
    description: str
    task_type: str  # "classification", "ner", "sentiment", "qa", "custom"
    fields: List[Dict[str, Any]]
    annotation_schema: Dict[str, Any]
    export_format: str  # "csv", "jsonl", "huggingface"
    created_at: Optional[str] = None
    usage_count: Optional[int] = None

class CustomDatasetRequest(BaseModel):
    name: str
    description: str
    fields: List[Dict[str, Any]]
    annotation_schema: Dict[str, Any]

# Get storage directory
def get_storage_dir():
    return os.environ.get("DATAFORGE_STORAGE_DIR", "./storage")

def get_templates_dir():
    """Get directory for storing custom templates"""
    storage_dir = get_storage_dir()
    templates_dir = f"{storage_dir}/templates"
    os.makedirs(templates_dir, exist_ok=True)
    return templates_dir

def load_custom_templates() -> Dict[str, DatasetTemplate]:
    """Load custom templates from storage"""
    templates_dir = get_templates_dir()
    custom_templates = {}
    
    for filename in os.listdir(templates_dir):
        if filename.endswith('.json'):
            try:
                with open(os.path.join(templates_dir, filename), 'r', encoding='utf-8') as f:
                    template_data = json.load(f)
                    template = DatasetTemplate(**template_data)
                    custom_templates[template.id] = template
            except Exception as e:
                print(f"Error loading template {filename}: {e}")
    
    return custom_templates

def save_custom_template(template: DatasetTemplate):
    """Save a custom template to storage"""
    templates_dir = get_templates_dir()
    filename = f"{template.id}.json"
    filepath = os.path.join(templates_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(template.dict(), f, indent=2, ensure_ascii=False)

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
        export_format="jsonl",
        created_at="2024-01-15T10:00:00Z",
        usage_count=245
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
        export_format="jsonl",
        created_at="2024-01-10T14:30:00Z",
        usage_count=189
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
        export_format="jsonl",
        created_at="2024-01-20T09:15:00Z",
        usage_count=156
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
        export_format="jsonl",
        created_at="2024-01-25T16:45:00Z",
        usage_count=98
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
        export_format="jsonl",
        created_at="2024-02-01T11:20:00Z",
        usage_count=134
    ),

    "text_generation": DatasetTemplate(
        id="text_generation",
        name="Text Generation",
        description="Creative text generation and completion tasks",
        task_type="generation",
        fields=[
            {"name": "prompt", "type": "string", "description": "Input prompt or context"},
            {"name": "completion", "type": "string", "description": "Generated text completion"},
            {"name": "max_length", "type": "integer", "optional": True, "description": "Maximum generation length"},
            {"name": "temperature", "type": "float", "optional": True, "description": "Generation temperature"}
        ],
        annotation_schema={
            "type": "text_generation",
            "max_length": 1000,
            "instructions": "Complete the text naturally and coherently"
        },
        export_format="jsonl",
        created_at="2024-02-05T13:30:00Z",
        usage_count=87
    ),

    "machine_translation": DatasetTemplate(
        id="machine_translation",
        name="Machine Translation",
        description="Translate text between different languages",
        task_type="translation",
        fields=[
            {"name": "source_text", "type": "string", "description": "Text in source language"},
            {"name": "target_text", "type": "string", "description": "Translated text in target language"},
            {"name": "source_lang", "type": "string", "description": "Source language code (e.g., 'en', 'es', 'fr')"},
            {"name": "target_lang", "type": "string", "description": "Target language code (e.g., 'en', 'es', 'fr')"}
        ],
        annotation_schema={
            "type": "text_generation",
            "instructions": "Provide an accurate translation that preserves meaning and context"
        },
        export_format="jsonl",
        created_at="2024-02-10T15:45:00Z",
        usage_count=76
    ),

    "part_of_speech_tagging": DatasetTemplate(
        id="part_of_speech_tagging",
        name="Part-of-Speech Tagging",
        description="Token-level classification for grammatical categories",
        task_type="pos_tagging",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "tokens", "type": "list", "description": "Tokenized text"},
            {"name": "pos_tags", "type": "list", "description": "POS tags for each token"},
            {"name": "lemmas", "type": "list", "optional": True, "description": "Lemmatized forms"}
        ],
        annotation_schema={
            "type": "token_classification",
            "tag_set": ["NOUN", "VERB", "ADJ", "ADV", "PRON", "DET", "ADP", "CONJ", "PRT", "NUM", "X"],
            "instructions": "Assign the correct part-of-speech tag to each token"
        },
        export_format="jsonl",
        created_at="2024-02-15T09:20:00Z",
        usage_count=65
    ),

    "text_similarity": DatasetTemplate(
        id="text_similarity",
        name="Text Similarity",
        description="Determine semantic similarity between text pairs",
        task_type="similarity",
        fields=[
            {"name": "text1", "type": "string", "description": "First text"},
            {"name": "text2", "type": "string", "description": "Second text"},
            {"name": "similarity_score", "type": "float", "description": "Similarity score (0-1)"},
            {"name": "label", "type": "categorical", "options": ["similar", "dissimilar"], "optional": True}
        ],
        annotation_schema={
            "type": "similarity_rating",
            "scale": [0, 1],
            "instructions": "Rate how similar these two texts are semantically"
        },
        export_format="jsonl",
        created_at="2024-02-20T11:10:00Z",
        usage_count=52
    ),

    "dialogue_system": DatasetTemplate(
        id="dialogue_system",
        name="Dialogue System",
        description="Conversational AI and chatbot training data",
        task_type="dialogue",
        fields=[
            {"name": "context", "type": "list", "description": "Previous conversation turns"},
            {"name": "user_input", "type": "string", "description": "User message"},
            {"name": "response", "type": "string", "description": "System response"},
            {"name": "intent", "type": "string", "optional": True, "description": "Detected user intent"}
        ],
        annotation_schema={
            "type": "text_generation",
            "instructions": "Provide a natural, helpful response to the user's message"
        },
        export_format="jsonl",
        created_at="2024-02-25T14:00:00Z",
        usage_count=43
    ),

    "code_generation": DatasetTemplate(
        id="code_generation",
        name="Code Generation",
        description="Generate code from natural language descriptions",
        task_type="code_generation",
        fields=[
            {"name": "description", "type": "string", "description": "Natural language description of the task"},
            {"name": "code", "type": "string", "description": "Generated code"},
            {"name": "language", "type": "categorical", "options": ["python", "javascript", "java", "cpp", "go", "rust", "other"]},
            {"name": "framework", "type": "string", "optional": True, "description": "Specific framework or library"}
        ],
        annotation_schema={
            "type": "text_generation",
            "instructions": "Write clean, functional code that solves the described task"
        },
        export_format="jsonl",
        created_at="2024-03-01T10:30:00Z",
        usage_count=91
    ),

    "text_to_sql": DatasetTemplate(
        id="text_to_sql",
        name="Text-to-SQL",
        description="Convert natural language queries to SQL statements",
        task_type="text_to_sql",
        fields=[
            {"name": "question", "type": "string", "description": "Natural language question"},
            {"name": "sql_query", "type": "string", "description": "Generated SQL query"},
            {"name": "database_schema", "type": "string", "description": "Database schema information"},
            {"name": "query_type", "type": "categorical", "options": ["SELECT", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP"]}
        ],
        annotation_schema={
            "type": "text_generation",
            "instructions": "Generate a correct SQL query that answers the question using the provided schema"
        },
        export_format="jsonl",
        created_at="2024-03-05T12:15:00Z",
        usage_count=67
    ),

    "emotion_recognition": DatasetTemplate(
        id="emotion_recognition",
        name="Emotion Recognition",
        description="Classify emotions expressed in text",
        task_type="emotion_classification",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "emotion", "type": "categorical", "options": ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"]},
            {"name": "intensity", "type": "float", "optional": True, "description": "Emotion intensity (0-1)"},
            {"name": "confidence", "type": "float", "optional": True, "description": "Classification confidence"}
        ],
        annotation_schema={
            "type": "single_choice",
            "options": ["joy", "sadness", "anger", "fear", "surprise", "disgust", "neutral"],
            "instructions": "Select the primary emotion expressed in the text"
        },
        export_format="jsonl",
        created_at="2024-03-10T14:45:00Z",
        usage_count=58
    ),

    "language_identification": DatasetTemplate(
        id="language_identification",
        name="Language Identification",
        description="Detect the language of given text",
        task_type="language_id",
        fields=[
            {"name": "text", "type": "string", "description": "Input text"},
            {"name": "language", "type": "categorical", "options": ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "other"]},
            {"name": "confidence", "type": "float", "optional": True, "description": "Detection confidence score"},
            {"name": "script", "type": "string", "optional": True, "description": "Writing script (Latin, Cyrillic, Arabic, etc.)"}
        ],
        annotation_schema={
            "type": "single_choice",
            "options": ["en", "es", "fr", "de", "it", "pt", "ru", "zh", "ja", "ko", "ar", "hi", "other"],
            "allow_custom": True,
            "instructions": "Identify the primary language of the text"
        },
        export_format="jsonl",
        created_at="2024-03-15T16:20:00Z",
        usage_count=72
    )
}

@router.get("/templates")
async def get_predefined_templates():
    """Get all predefined dataset templates"""
    return {
        "templates": list(PREDEFINED_TEMPLATES.values()),
        "count": len(PREDEFINED_TEMPLATES)
    }

@router.get("/templates/custom")
async def get_custom_templates():
    """Get all custom templates"""
    custom_templates = load_custom_templates()
    return {
        "templates": list(custom_templates.values()),
        "count": len(custom_templates)
    }

@router.get("/templates/custom/{template_id}")
async def get_custom_template(template_id: str):
    """Get a specific custom template by ID"""
    custom_templates = load_custom_templates()
    if template_id not in custom_templates:
        raise HTTPException(status_code=404, detail="Custom template not found")
    
    return custom_templates[template_id]

@router.put("/templates/custom/{template_id}")
async def update_custom_template(template_id: str, request: CustomDatasetRequest):
    """Update a custom template"""
    custom_templates = load_custom_templates()
    if template_id not in custom_templates:
        raise HTTPException(status_code=404, detail="Custom template not found")
    
    # Update the template
    updated_template = DatasetTemplate(
        id=template_id,
        name=request.name,
        description=request.description,
        task_type="custom",
        fields=request.fields,
        annotation_schema=request.annotation_schema,
        export_format="jsonl"
    )
    
    # Save the updated template
    save_custom_template(updated_template)
    
    return {
        "message": "Custom template updated successfully",
        "template": updated_template
    }

@router.delete("/templates/custom/{template_id}")
async def delete_custom_template(template_id: str):
    """Delete a custom template"""
    custom_templates = load_custom_templates()
    if template_id not in custom_templates:
        raise HTTPException(status_code=404, detail="Custom template not found")
    
    # Delete the template file
    templates_dir = get_templates_dir()
    filename = f"{template_id}.json"
    filepath = os.path.join(templates_dir, filename)
    
    if os.path.exists(filepath):
        os.remove(filepath)
    
    return {
        "message": "Custom template deleted successfully",
        "template_id": template_id
    }

@router.get("/templates/{template_id}")
async def get_template(template_id: str):
    """Get a specific template by ID"""
    if template_id not in PREDEFINED_TEMPLATES:
        raise HTTPException(status_code=404, detail="Template not found")
    
    return PREDEFINED_TEMPLATES[template_id]

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
