# DataForge Reader - Feature Improvements Plan
## Data Mining & Dataset Template Creation Enhancement

**Date**: October 3, 2025  
**Focus Areas**: Data Mining Capabilities & Template Creation System (Non-Security)

---

## Executive Summary

This document outlines comprehensive improvements to DataForge Reader's data mining and dataset template creation features. The improvements focus on making the system more intelligent, automated, and user-friendly while maintaining the existing architecture.

### Current State
- ✅ Basic text extraction (PDF/EPUB)
- ✅ Simple paragraph segmentation
- ✅ 5 predefined templates
- ✅ Manual annotation workflow
- ✅ CSV/JSONL export
- ❌ No intelligent data mining
- ❌ Limited template capabilities
- ❌ No automation or smart suggestions

### Proposed Improvements
1. **Advanced Data Mining**: NLP-powered text analysis and pattern detection
2. **Smart Template System**: Intelligent suggestions, validation, and versioning
3. **Automated Workflows**: Bulk operations and auto-annotation
4. **Enhanced Analytics**: Deep content insights and quality metrics

---

## Part 1: Advanced Data Mining Features

### 1.1 Intelligent Text Analysis

#### **A. Named Entity Recognition (NER)**
Extract and classify entities automatically from parsed text.

**Backend Implementation:**
```python
# backend/utils/text_analytics.py (NEW FILE)
from typing import List, Dict, Any, Optional
import spacy
from collections import Counter
import re

class TextAnalyzer:
    """Advanced text analysis utilities for data mining"""
    
    def __init__(self):
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            # Fallback to basic patterns if spacy not available
            self.nlp = None
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities with positions"""
        if not self.nlp:
            return self._extract_entities_regex(text)
        
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 1.0  # spacy doesn't provide scores by default
            })
        
        return entities
    
    def _extract_entities_regex(self, text: str) -> List[Dict[str, Any]]:
        """Fallback entity extraction using regex patterns"""
        entities = []
        
        # Email pattern
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        for match in re.finditer(email_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "EMAIL",
                "start": match.start(),
                "end": match.end()
            })
        
        # URL pattern
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        for match in re.finditer(url_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "URL",
                "start": match.start(),
                "end": match.end()
            })
        
        # Date patterns
        date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'
        for match in re.finditer(date_pattern, text, re.IGNORECASE):
            entities.append({
                "text": match.group(),
                "label": "DATE",
                "start": match.start(),
                "end": match.end()
            })
        
        # Phone numbers
        phone_pattern = r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b'
        for match in re.finditer(phone_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "PHONE",
                "start": match.start(),
                "end": match.end()
            })
        
        return entities
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Extract important keywords using multiple methods"""
        keywords = []
        
        if self.nlp:
            doc = self.nlp(text)
            
            # Extract noun phrases
            noun_phrases = [chunk.text for chunk in doc.noun_chunks]
            phrase_counts = Counter(noun_phrases)
            
            # Extract named entities as keywords
            entity_texts = [ent.text for ent in doc.ents]
            entity_counts = Counter(entity_texts)
            
            # Combine and score
            all_keywords = {}
            for phrase, count in phrase_counts.most_common(top_n):
                all_keywords[phrase] = {
                    "keyword": phrase,
                    "score": count,
                    "type": "noun_phrase"
                }
            
            for entity, count in entity_counts.most_common(top_n):
                if entity not in all_keywords:
                    all_keywords[entity] = {
                        "keyword": entity,
                        "score": count * 1.5,  # Give entities higher weight
                        "type": "entity"
                    }
        else:
            # Fallback: simple word frequency
            words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
            word_counts = Counter(words)
            
            for word, count in word_counts.most_common(top_n):
                all_keywords[word] = {
                    "keyword": word,
                    "score": count,
                    "type": "capitalized_word"
                }
        
        # Sort by score and return top N
        sorted_keywords = sorted(all_keywords.values(), key=lambda x: x["score"], reverse=True)
        return sorted_keywords[:top_n]
    
    def detect_language(self, text: str) -> str:
        """Detect text language"""
        if not self.nlp:
            return "en"  # Default to English
        
        # Use spacy's language detection
        doc = self.nlp(text[:1000])  # Sample first 1000 chars
        return doc.lang_
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Basic sentiment analysis"""
        # Simple lexicon-based sentiment
        positive_words = {'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
                         'love', 'best', 'perfect', 'beautiful', 'awesome', 'brilliant'}
        negative_words = {'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor',
                         'disappointing', 'useless', 'waste', 'broken', 'wrong'}
        
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        positive_count = len(words & positive_words)
        negative_count = len(words & negative_words)
        
        total = positive_count + negative_count
        if total == 0:
            return {"sentiment": "neutral", "score": 0.0, "confidence": 0.5}
        
        score = (positive_count - negative_count) / total
        
        if score > 0.2:
            sentiment = "positive"
        elif score < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": score,
            "confidence": min(abs(score) + 0.5, 1.0),
            "positive_indicators": positive_count,
            "negative_indicators": negative_count
        }
    
    def extract_statistics(self, text: str) -> Dict[str, Any]:
        """Extract numerical statistics and patterns from text"""
        stats = {
            "numbers": [],
            "percentages": [],
            "currencies": [],
            "measurements": []
        }
        
        # Extract numbers
        number_pattern = r'\b\d+(?:,\d{3})*(?:\.\d+)?\b'
        stats["numbers"] = [float(m.group().replace(',', '')) for m in re.finditer(number_pattern, text)]
        
        # Extract percentages
        percentage_pattern = r'\b\d+(?:\.\d+)?%'
        stats["percentages"] = [m.group() for m in re.finditer(percentage_pattern, text)]
        
        # Extract currency values
        currency_pattern = r'[$£€¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?'
        stats["currencies"] = [m.group() for m in re.finditer(currency_pattern, text)]
        
        # Extract measurements
        measurement_pattern = r'\b\d+(?:\.\d+)?\s*(?:kg|g|lb|oz|km|m|cm|mm|ft|in|L|ml|gal)\b'
        stats["measurements"] = [m.group() for m in re.finditer(measurement_pattern, text, re.IGNORECASE)]
        
        return stats

# Initialize global analyzer
text_analyzer = TextAnalyzer()
```

**API Endpoint:**
```python
# backend/routers/data_mining.py (NEW FILE)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from backend.utils.text_analytics import text_analyzer

router = APIRouter()

class TextAnalysisRequest(BaseModel):
    text: str
    features: List[str] = ["entities", "keywords", "sentiment", "statistics"]

class BatchAnalysisRequest(BaseModel):
    file_id: str
    paragraph_ids: Optional[List[str]] = None
    features: List[str] = ["entities", "keywords", "sentiment"]

@router.post("/mine/analyze")
async def analyze_text(request: TextAnalysisRequest):
    """Analyze text and extract insights"""
    results = {}
    
    try:
        if "entities" in request.features:
            results["entities"] = text_analyzer.extract_entities(request.text)
        
        if "keywords" in request.features:
            results["keywords"] = text_analyzer.extract_keywords(request.text)
        
        if "sentiment" in request.features:
            results["sentiment"] = text_analyzer.analyze_sentiment(request.text)
        
        if "statistics" in request.features:
            results["statistics"] = text_analyzer.extract_statistics(request.text)
        
        if "language" in request.features:
            results["language"] = text_analyzer.detect_language(request.text)
        
        return {
            "success": True,
            "analysis": results,
            "text_length": len(request.text)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/mine/batch-analyze")
async def batch_analyze(request: BatchAnalysisRequest):
    """Analyze multiple paragraphs from a file"""
    # Implementation would load paragraphs and analyze each
    pass
```

#### **B. Pattern Detection & Structure Analysis**

```python
# Addition to backend/utils/text_analytics.py

class PatternDetector:
    """Detect patterns and structures in text"""
    
    def detect_document_structure(self, paragraphs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze document structure and identify sections"""
        structure = {
            "sections": [],
            "headings": [],
            "lists": [],
            "tables": [],
            "code_blocks": []
        }
        
        for para in paragraphs:
            text = para.get("text", "")
            
            # Detect headings (shorter, capitalized, often end without punctuation)
            if len(text) < 100 and text[0].isupper() and not text.endswith('.'):
                structure["headings"].append({
                    "text": text,
                    "paragraph_id": para.get("id"),
                    "page": para.get("page")
                })
            
            # Detect lists (lines starting with bullets or numbers)
            if re.match(r'^\s*[\-\*•]\s+', text) or re.match(r'^\s*\d+[\.\)]\s+', text):
                structure["lists"].append({
                    "text": text,
                    "paragraph_id": para.get("id"),
                    "type": "bullet" if re.match(r'^\s*[\-\*•]', text) else "numbered"
                })
            
            # Detect code-like content
            if self._looks_like_code(text):
                structure["code_blocks"].append({
                    "text": text,
                    "paragraph_id": para.get("id")
                })
        
        return structure
    
    def _looks_like_code(self, text: str) -> bool:
        """Heuristic to detect code blocks"""
        code_indicators = [
            r'function\s+\w+\s*\(',
            r'class\s+\w+',
            r'def\s+\w+\s*\(',
            r'=>',
            r'\{[\s\S]*\}',
            r'import\s+\w+',
            r'#include\s*<',
        ]
        
        for pattern in code_indicators:
            if re.search(pattern, text):
                return True
        
        # Check for high ratio of special characters
        special_chars = len(re.findall(r'[{}()\[\];:]', text))
        return special_chars / max(len(text), 1) > 0.05
    
    def find_similar_paragraphs(self, paragraphs: List[Dict[str, Any]], 
                               threshold: float = 0.7) -> List[Dict[str, Any]]:
        """Find similar or duplicate paragraphs"""
        from difflib import SequenceMatcher
        
        similar_groups = []
        checked = set()
        
        for i, para1 in enumerate(paragraphs):
            if i in checked:
                continue
            
            group = [para1]
            for j, para2 in enumerate(paragraphs[i+1:], start=i+1):
                if j in checked:
                    continue
                
                similarity = SequenceMatcher(None, 
                                            para1.get("text", ""), 
                                            para2.get("text", "")).ratio()
                
                if similarity >= threshold:
                    group.append(para2)
                    checked.add(j)
            
            if len(group) > 1:
                similar_groups.append({
                    "group_id": len(similar_groups) + 1,
                    "paragraph_count": len(group),
                    "paragraphs": group,
                    "similarity_threshold": threshold
                })
        
        return similar_groups
    
    def extract_tables(self, paragraphs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Detect and extract table-like structures from text"""
        tables = []
        
        for para in paragraphs:
            text = para.get("text", "")
            
            # Look for tab-separated or pipe-separated content
            lines = text.split('\n')
            if len(lines) < 2:
                continue
            
            # Check if lines have consistent separators
            separators = ['|', '\t', '  ']
            for sep in separators:
                split_lines = [line.split(sep) for line in lines if sep in line]
                
                if len(split_lines) >= 2:
                    # Check if column counts are consistent
                    col_counts = [len(line) for line in split_lines]
                    if len(set(col_counts)) == 1:  # All rows have same columns
                        tables.append({
                            "paragraph_id": para.get("id"),
                            "rows": len(split_lines),
                            "columns": col_counts[0],
                            "separator": sep,
                            "data": split_lines
                        })
                        break
        
        return tables
```

### 1.2 Enhanced Text Segmentation

```python
# Update to backend/routers/parse.py

def advanced_paragraph_extraction(text: str, page_num: int) -> List[Dict[str, Any]]:
    """Advanced paragraph extraction with better segmentation"""
    paragraphs = []
    
    # Split by multiple newlines or indentation changes
    blocks = re.split(r'\n\s*\n+|\n(?=\s{4,})', text)
    
    for i, block in enumerate(blocks):
        cleaned = clean_text(block)
        if len(cleaned) < 10:
            continue
        
        # Analyze paragraph characteristics
        para_data = {
            "id": f"p_{page_num}_{i}",
            "page": page_num,
            "paragraph_index": i,
            "text": cleaned,
            "word_count": len(cleaned.split()),
            "char_count": len(cleaned),
            "annotations": {},
            
            # Additional metadata
            "sentence_count": len(re.findall(r'[.!?]+', cleaned)),
            "avg_word_length": sum(len(w) for w in cleaned.split()) / max(len(cleaned.split()), 1),
            "has_numbers": bool(re.search(r'\d', cleaned)),
            "has_special_chars": bool(re.search(r'[^\w\s.,!?-]', cleaned)),
            "starts_with_capital": cleaned[0].isupper() if cleaned else False,
            "ends_with_punctuation": cleaned[-1] in '.!?' if cleaned else False,
            "is_question": cleaned.strip().endswith('?') if cleaned else False,
            
            # Content type hints
            "likely_heading": len(cleaned) < 100 and not cleaned.endswith('.'),
            "likely_list_item": cleaned.startswith(('- ', '* ', '• ')) or re.match(r'^\d+[\.\)]', cleaned.strip()),
            "likely_quote": cleaned.startswith(('"', '"', '«')) or cleaned.count('"') >= 2,
        }
        
        paragraphs.append(para_data)
    
    return paragraphs
```

---

## Part 2: Smart Template System

### 2.1 Template Validation & Schema

```python
# backend/utils/template_validator.py (NEW FILE)
from pydantic import BaseModel, validator, ValidationError
from typing import List, Dict, Any, Optional
import json

class FieldDefinition(BaseModel):
    name: str
    type: str
    description: str
    required: bool = True
    default: Optional[Any] = None
    validation: Optional[Dict[str, Any]] = None
    
    @validator('type')
    def validate_field_type(cls, v):
        allowed_types = ['string', 'integer', 'float', 'boolean', 'array', 'object', 'categorical']
        if v not in allowed_types:
            raise ValueError(f'Field type must be one of {allowed_types}')
        return v

class TemplateValidator:
    """Validate templates and data against templates"""
    
    def validate_template(self, template: Dict[str, Any]) -> Dict[str, Any]:
        """Validate template structure"""
        errors = []
        warnings = []
        
        # Check required fields
        required_keys = ['id', 'name', 'fields', 'annotation_schema']
        for key in required_keys:
            if key not in template:
                errors.append(f"Missing required field: {key}")
        
        # Validate fields
        if 'fields' in template:
            if not isinstance(template['fields'], list):
                errors.append("'fields' must be a list")
            else:
                field_names = set()
                for i, field in enumerate(template['fields']):
                    if 'name' not in field:
                        errors.append(f"Field {i} missing 'name'")
                    elif field['name'] in field_names:
                        errors.append(f"Duplicate field name: {field['name']}")
                    else:
                        field_names.add(field['name'])
                    
                    if 'type' not in field:
                        errors.append(f"Field '{field.get('name', i)}' missing 'type'")
        
        # Validate annotation schema
        if 'annotation_schema' in template:
            schema = template['annotation_schema']
            if 'type' not in schema:
                warnings.append("Annotation schema missing 'type'")
            if 'instructions' not in schema:
                warnings.append("Annotation schema missing 'instructions'")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def validate_data_against_template(self, data: Dict[str, Any], 
                                      template: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data conforms to template"""
        errors = []
        warnings = []
        
        template_fields = {f['name']: f for f in template.get('fields', [])}
        
        # Check all required fields are present
        for field_name, field_def in template_fields.items():
            if field_def.get('required', True) and field_name not in data:
                errors.append(f"Missing required field: {field_name}")
        
        # Validate field types
        for field_name, value in data.items():
            if field_name not in template_fields:
                warnings.append(f"Unknown field: {field_name}")
                continue
            
            field_def = template_fields[field_name]
            expected_type = field_def.get('type')
            
            if not self._validate_type(value, expected_type):
                errors.append(f"Field '{field_name}' has invalid type. Expected {expected_type}")
            
            # Check categorical options
            if expected_type == 'categorical':
                options = field_def.get('options', [])
                if value not in options:
                    errors.append(f"Field '{field_name}' value '{value}' not in allowed options: {options}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def _validate_type(self, value: Any, expected_type: str) -> bool:
        """Check if value matches expected type"""
        type_mapping = {
            'string': str,
            'integer': int,
            'float': (int, float),
            'boolean': bool,
            'array': list,
            'object': dict,
            'categorical': str
        }
        
        expected_python_type = type_mapping.get(expected_type)
        if expected_python_type is None:
            return True  # Unknown type, accept
        
        return isinstance(value, expected_python_type)

template_validator = TemplateValidator()
```

### 2.2 Template Versioning & Storage

```python
# backend/utils/template_storage.py (NEW FILE)
import json
import os
from datetime import datetime
from typing import List, Dict, Any, Optional
from pathlib import Path

class TemplateStorage:
    """Manage template storage with versioning"""
    
    def __init__(self, storage_dir: str = "./storage/templates"):
        self.storage_dir = Path(storage_dir)
        self.storage_dir.mkdir(parents=True, exist_ok=True)
        self.index_file = self.storage_dir / "index.json"
        self._ensure_index()
    
    def _ensure_index(self):
        """Create index file if it doesn't exist"""
        if not self.index_file.exists():
            with open(self.index_file, 'w') as f:
                json.dump({"templates": [], "version": "1.0"}, f)
    
    def save_template(self, template: Dict[str, Any], user_id: Optional[str] = "default") -> str:
        """Save template with versioning"""
        template_id = template.get('id')
        if not template_id:
            raise ValueError("Template must have an 'id' field")
        
        # Create versioned filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        version = self._get_next_version(template_id)
        
        template_data = {
            **template,
            "version": version,
            "created_at": timestamp,
            "created_by": user_id,
            "file_version": f"v{version}"
        }
        
        # Save template file
        filename = f"{template_id}_v{version}.json"
        filepath = self.storage_dir / filename
        
        with open(filepath, 'w') as f:
            json.dump(template_data, f, indent=2)
        
        # Update index
        self._update_index(template_id, version, filename)
        
        return filename
    
    def get_template(self, template_id: str, version: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Retrieve template by ID and version"""
        if version is None:
            version = self._get_latest_version(template_id)
        
        filename = f"{template_id}_v{version}.json"
        filepath = self.storage_dir / filename
        
        if not filepath.exists():
            return None
        
        with open(filepath, 'r') as f:
            return json.load(f)
    
    def list_templates(self, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """List all available templates"""
        with open(self.index_file, 'r') as f:
            index = json.load(f)
        
        templates = index.get('templates', [])
        
        if user_id:
            templates = [t for t in templates if t.get('created_by') == user_id]
        
        return templates
    
    def _get_next_version(self, template_id: str) -> int:
        """Get next version number for template"""
        latest = self._get_latest_version(template_id)
        return latest + 1 if latest else 1
    
    def _get_latest_version(self, template_id: str) -> Optional[int]:
        """Get latest version number for template"""
        with open(self.index_file, 'r') as f:
            index = json.load(f)
        
        for template in index.get('templates', []):
            if template.get('id') == template_id:
                return template.get('latest_version', 0)
        
        return None
    
    def _update_index(self, template_id: str, version: int, filename: str):
        """Update index with new template version"""
        with open(self.index_file, 'r') as f:
            index = json.load(f)
        
        templates = index.get('templates', [])
        
        # Find existing template entry
        template_entry = None
        for t in templates:
            if t.get('id') == template_id:
                template_entry = t
                break
        
        if template_entry:
            template_entry['latest_version'] = version
            template_entry['versions'].append({
                "version": version,
                "filename": filename,
                "created_at": datetime.now().isoformat()
            })
        else:
            templates.append({
                "id": template_id,
                "latest_version": version,
                "versions": [{
                    "version": version,
                    "filename": filename,
                    "created_at": datetime.now().isoformat()
                }]
            })
        
        index['templates'] = templates
        
        with open(self.index_file, 'w') as f:
            json.dump(index, f, indent=2)

template_storage = TemplateStorage()
```

### 2.3 Smart Template Suggestions

```python
# backend/utils/template_suggestions.py (NEW FILE)
from typing import List, Dict, Any
from collections import Counter
import re

class TemplateSuggester:
    """Suggest template fields based on content analysis"""
    
    def suggest_fields_from_content(self, paragraphs: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze content and suggest appropriate fields"""
        suggestions = {
            "recommended_template": None,
            "suggested_fields": [],
            "reasoning": []
        }
        
        # Analyze content characteristics
        all_text = " ".join([p.get('text', '') for p in paragraphs])
        
        # Check for Q&A patterns
        question_count = len(re.findall(r'\?', all_text))
        if question_count > len(paragraphs) * 0.3:
            suggestions["recommended_template"] = "question_answering"
            suggestions["reasoning"].append(f"High frequency of questions ({question_count})")
        
        # Check for sentiment indicators
        sentiment_words = len(re.findall(r'\b(good|bad|great|terrible|love|hate|excellent|poor)\b', all_text, re.IGNORECASE))
        if sentiment_words > 20:
            suggestions["recommended_template"] = "sentiment_analysis"
            suggestions["reasoning"].append(f"High frequency of sentiment words ({sentiment_words})")
        
        # Check for structured entities
        has_many_emails = len(re.findall(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', all_text)) > 5
        has_many_dates = len(re.findall(r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b', all_text)) > 5
        
        if has_many_emails or has_many_dates:
            suggestions["suggested_fields"].append({
                "name": "entities",
                "type": "array",
                "description": "Extracted entities (emails, dates, etc.)"
            })
            suggestions["reasoning"].append("Content contains structured data (emails/dates)")
        
        # Check for categorical content
        short_paragraphs = [p for p in paragraphs if p.get('word_count', 0) < 50]
        if len(short_paragraphs) > len(paragraphs) * 0.5:
            suggestions["suggested_fields"].append({
                "name": "category",
                "type": "categorical",
                "description": "Content category"
            })
            suggestions["reasoning"].append("Many short paragraphs suggest categorical data")
        
        # Always suggest basic fields
        suggestions["suggested_fields"].extend([
            {"name": "text", "type": "string", "description": "Source text"},
            {"name": "confidence", "type": "float", "description": "Annotation confidence"}
        ])
        
        return suggestions
    
    def suggest_annotation_schema(self, template_type: str, content_sample: str) -> Dict[str, Any]:
        """Suggest annotation schema based on template type and content"""
        schemas = {
            "classification": {
                "type": "single_choice",
                "options": self._extract_potential_categories(content_sample),
                "instructions": "Select the most appropriate category for this text"
            },
            "sentiment": {
                "type": "single_choice",
                "options": ["positive", "negative", "neutral"],
                "instructions": "Rate the sentiment of this text"
            },
            "ner": {
                "type": "span_selection",
                "entity_types": ["PERSON", "ORG", "LOC", "DATE"],
                "instructions": "Highlight and label entities in the text"
            }
        }
        
        return schemas.get(template_type, {
            "type": "text_input",
            "instructions": "Provide annotation for this content"
        })
    
    def _extract_potential_categories(self, text: str, max_categories: int = 5) -> List[str]:
        """Extract potential category names from content"""
        # Look for capitalized words/phrases that could be categories
        candidates = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
        category_counts = Counter(candidates)
        
        # Return most common as suggestions
        return [cat for cat, _ in category_counts.most_common(max_categories)]

template_suggester = TemplateSuggester()
```

---

## Part 3: Automated Workflows

### 3.1 Bulk Annotation System

```python
# backend/routers/bulk_operations.py (NEW FILE)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import asyncio

router = APIRouter()

class BulkAnnotationRequest(BaseModel):
    file_id: str
    paragraph_ids: List[str]
    annotation: Dict[str, Any]
    mode: str = "overwrite"  # "overwrite", "merge", "skip_existing"

class BulkAnalysisRequest(BaseModel):
    file_ids: List[str]
    analysis_types: List[str] = ["entities", "keywords", "sentiment"]

class AutoAnnotationRequest(BaseModel):
    file_id: str
    template_id: str
    confidence_threshold: float = 0.7

@router.post("/bulk/annotate")
async def bulk_annotate(request: BulkAnnotationRequest):
    """Apply annotation to multiple paragraphs"""
    from backend.routers.annotate import load_annotations, save_annotations
    
    try:
        # Load existing annotations
        all_annotations = load_annotations(request.file_id)
        
        updated_count = 0
        skipped_count = 0
        
        for para_id in request.paragraph_ids:
            if request.mode == "skip_existing" and para_id in all_annotations:
                skipped_count += 1
                continue
            
            if request.mode == "merge" and para_id in all_annotations:
                # Merge with existing
                all_annotations[para_id].update(request.annotation)
            else:
                # Overwrite or create new
                all_annotations[para_id] = request.annotation.copy()
            
            updated_count += 1
        
        # Save all annotations
        save_annotations(request.file_id, all_annotations)
        
        return {
            "success": True,
            "file_id": request.file_id,
            "updated": updated_count,
            "skipped": skipped_count,
            "total": len(request.paragraph_ids)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bulk annotation failed: {str(e)}")

@router.post("/bulk/auto-annotate")
async def auto_annotate(request: AutoAnnotationRequest):
    """Automatically annotate content based on template"""
    from backend.utils.text_analytics import text_analyzer
    from backend.routers.templates import PREDEFINED_TEMPLATES
    
    try:
        # Get template
        if request.template_id not in PREDEFINED_TEMPLATES:
            raise HTTPException(status_code=404, detail="Template not found")
        
        template = PREDEFINED_TEMPLATES[request.template_id]
        
        # Load paragraphs (would actually load from storage)
        # For now, return success message
        
        annotated_count = 0
        
        # Auto-annotation logic based on template type
        if template.task_type == "sentiment":
            # Auto sentiment analysis
            pass
        elif template.task_type == "ner":
            # Auto entity extraction
            pass
        
        return {
            "success": True,
            "file_id": request.file_id,
            "template_id": request.template_id,
            "annotated": annotated_count,
            "confidence_threshold": request.confidence_threshold
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-annotation failed: {str(e)}")

@router.post("/bulk/export")
async def bulk_export(file_ids: List[str], export_format: str = "jsonl"):
    """Export multiple files at once"""
    exports = []
    
    for file_id in file_ids:
        try:
            # Export each file
            # Implementation would call export router
            exports.append({
                "file_id": file_id,
                "status": "success",
                "filename": f"{file_id}_export.{export_format}"
            })
        except Exception as e:
            exports.append({
                "file_id": file_id,
                "status": "failed",
                "error": str(e)
            })
    
    return {
        "exports": exports,
        "success_count": len([e for e in exports if e["status"] == "success"]),
        "failed_count": len([e for e in exports if e["status"] == "failed"])
    }
```

### 3.2 Template Auto-Mapping

```python
# backend/utils/template_mapper.py (NEW FILE)
from typing import Dict, Any, List
import re

class TemplateMapper:
    """Automatically map parsed content to template fields"""
    
    def auto_map_content(self, paragraphs: List[Dict[str, Any]], 
                         template: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Map paragraphs to template structure"""
        mapped_data = []
        template_fields = {f['name']: f for f in template.get('fields', [])}
        
        for para in paragraphs:
            mapped_item = {}
            
            # Always map text field if exists
            if 'text' in template_fields:
                mapped_item['text'] = para.get('text', '')
            
            # Map based on template type
            task_type = template.get('task_type', 'custom')
            
            if task_type == 'sentiment':
                mapped_item = self._map_sentiment(para, template_fields)
            elif task_type == 'ner':
                mapped_item = self._map_ner(para, template_fields)
            elif task_type == 'qa':
                mapped_item = self._map_qa(para, template_fields)
            else:
                # Generic mapping
                for field_name, field_def in template_fields.items():
                    if field_name in para:
                        mapped_item[field_name] = para[field_name]
            
            # Add metadata
            mapped_item['_source'] = {
                'paragraph_id': para.get('id'),
                'page': para.get('page'),
                'file_id': para.get('file_id')
            }
            
            mapped_data.append(mapped_item)
        
        return mapped_data
    
    def _map_sentiment(self, para: Dict[str, Any], 
                      template_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Map paragraph to sentiment template"""
        from backend.utils.text_analytics import text_analyzer
        
        text = para.get('text', '')
        sentiment_result = text_analyzer.analyze_sentiment(text)
        
        return {
            'text': text,
            'label': sentiment_result['sentiment'],
            'confidence': sentiment_result.get('confidence', 0.0)
        }
    
    def _map_ner(self, para: Dict[str, Any], 
                 template_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Map paragraph to NER template"""
        from backend.utils.text_analytics import text_analyzer
        
        text = para.get('text', '')
        entities = text_analyzer.extract_entities(text)
        
        return {
            'text': text,
            'entities': entities,
            'entity_count': len(entities)
        }
    
    def _map_qa(self, para: Dict[str, Any], 
                template_fields: Dict[str, Any]) -> Dict[str, Any]:
        """Map paragraph to QA template"""
        text = para.get('text', '')
        
        # Detect if paragraph contains question
        is_question = '?' in text
        
        return {
            'context': text if not is_question else '',
            'question': text if is_question else '',
            'answer': '',  # To be filled by annotator
            'answer_start': -1
        }

template_mapper = TemplateMapper()
```

---

## Part 4: Frontend Enhancements

### 4.1 Enhanced Template Designer UI

```typescript
// frontend/src/components/SmartTemplateDesigner.tsx (NEW FILE)
import React, { useState, useEffect } from 'react'
import { Lightbulb, Check, AlertCircle } from 'lucide-react'
import axios from 'axios'

interface TemplateSuggestion {
  recommended_template: string | null
  suggested_fields: Array<{
    name: string
    type: string
    description: string
  }>
  reasoning: string[]
}

interface SmartTemplateDesignerProps {
  fileId: string
  paragraphs: any[]
  onTemplateCreated: (template: any) => void
}

const SmartTemplateDesigner: React.FC<SmartTemplateDesignerProps> = ({
  fileId,
  paragraphs,
  onTemplateCreated
}) => {
  const [suggestions, setSuggestions] = useState<TemplateSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (paragraphs.length > 0) {
      generateSuggestions()
    }
  }, [paragraphs])

  const generateSuggestions = async () => {
    setLoading(true)
    try {
      // Call backend to analyze content and suggest fields
      const response = await axios.post('/api/templates/suggest', {
        file_id: fileId,
        sample_paragraphs: paragraphs.slice(0, 10)
      })
      setSuggestions(response.data)
    } catch (error) {
      console.error('Failed to generate suggestions:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleSuggestion = (fieldName: string) => {
    const newSelected = new Set(selectedSuggestions)
    if (newSelected.has(fieldName)) {
      newSelected.delete(fieldName)
    } else {
      newSelected.add(fieldName)
    }
    setSelectedSuggestions(newSelected)
  }

  const createFromSuggestions = () => {
    if (!suggestions) return

    const selectedFields = suggestions.suggested_fields.filter(f => 
      selectedSuggestions.has(f.name)
    )

    const template = {
      name: `Auto-generated Template`,
      fields: selectedFields,
      task_type: suggestions.recommended_template || 'custom'
    }

    onTemplateCreated(template)
  }

  if (loading) {
    return <div>Analyzing content and generating suggestions...</div>
  }

  if (!suggestions) {
    return <div>No suggestions available</div>
  }

  return (
    <div className="smart-template-designer">
      <div className="suggestion-header">
        <Lightbulb size={24} color="#f59e0b" />
        <h3>Smart Template Suggestions</h3>
      </div>

      {suggestions.recommended_template && (
        <div className="recommendation-banner">
          <Check size={20} />
          <span>
            Recommended template: <strong>{suggestions.recommended_template}</strong>
          </span>
        </div>
      )}

      <div className="reasoning-section">
        <h4>Why these suggestions?</h4>
        <ul>
          {suggestions.reasoning.map((reason, idx) => (
            <li key={idx}>
              <AlertCircle size={16} />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="suggested-fields">
        <h4>Suggested Fields</h4>
        {suggestions.suggested_fields.map((field) => (
          <div 
            key={field.name}
            className={`field-suggestion ${selectedSuggestions.has(field.name) ? 'selected' : ''}`}
            onClick={() => toggleSuggestion(field.name)}
          >
            <input 
              type="checkbox"
              checked={selectedSuggestions.has(field.name)}
              readOnly
            />
            <div className="field-info">
              <strong>{field.name}</strong>
              <span className="field-type">{field.type}</span>
              <p>{field.description}</p>
            </div>
          </div>
        ))}
      </div>

      <button 
        onClick={createFromSuggestions}
        disabled={selectedSuggestions.size === 0}
        className="create-button"
      >
        Create Template with Selected Fields ({selectedSuggestions.size})
      </button>
    </div>
  )
}

export default SmartTemplateDesigner
```

### 4.2 Bulk Annotation Interface

```typescript
// frontend/src/components/BulkAnnotationPanel.tsx (NEW FILE)
import React, { useState } from 'react'
import { CheckSquare, Square, Zap } from 'lucide-react'
import axios from 'axios'

interface BulkAnnotationPanelProps {
  fileId: string
  paragraphs: any[]
  template: any
  onAnnotationComplete: () => void
}

const BulkAnnotationPanel: React.FC<BulkAnnotationPanelProps> = ({
  fileId,
  paragraphs,
  template,
  onAnnotationComplete
}) => {
  const [selectedParagraphs, setSelectedParagraphs] = useState<Set<string>>(new Set())
  const [annotation, setAnnotation] = useState<any>({})
  const [isAnnotating, setIsAnnotating] = useState(false)

  const toggleParagraph = (paraId: string) => {
    const newSelected = new Set(selectedParagraphs)
    if (newSelected.has(paraId)) {
      newSelected.delete(paraId)
    } else {
      newSelected.add(paraId)
    }
    setSelectedParagraphs(newSelected)
  }

  const selectAll = () => {
    setSelectedParagraphs(new Set(paragraphs.map(p => p.id)))
  }

  const deselectAll = () => {
    setSelectedParagraphs(new Set())
  }

  const applyBulkAnnotation = async () => {
    setIsAnnotating(true)
    try {
      await axios.post('/api/bulk/annotate', {
        file_id: fileId,
        paragraph_ids: Array.from(selectedParagraphs),
        annotation: annotation,
        mode: 'overwrite'
      })
      onAnnotationComplete()
      setSelectedParagraphs(new Set())
    } catch (error) {
      console.error('Bulk annotation failed:', error)
      alert('Failed to apply bulk annotation')
    } finally {
      setIsAnnotating(false)
    }
  }

  const autoAnnotate = async () => {
    setIsAnnotating(true)
    try {
      await axios.post('/api/bulk/auto-annotate', {
        file_id: fileId,
        template_id: template.id,
        confidence_threshold: 0.7
      })
      onAnnotationComplete()
    } catch (error) {
      console.error('Auto-annotation failed:', error)
      alert('Failed to auto-annotate')
    } finally {
      setIsAnnotating(false)
    }
  }

  return (
    <div className="bulk-annotation-panel">
      <div className="panel-header">
        <h3>Bulk Annotation</h3>
        <div className="selection-controls">
          <button onClick={selectAll}>Select All</button>
          <button onClick={deselectAll}>Deselect All</button>
          <span>{selectedParagraphs.size} selected</span>
        </div>
      </div>

      <div className="auto-annotate-section">
        <button 
          onClick={autoAnnotate}
          disabled={isAnnotating}
          className="auto-button"
        >
          <Zap size={16} />
          Auto-Annotate with AI
        </button>
        <p className="help-text">
          Automatically annotate content using pattern detection and NLP
        </p>
      </div>

      <div className="manual-annotation-section">
        <h4>Manual Bulk Annotation</h4>
        <div className="annotation-form">
          {/* Render form fields based on template */}
          {template.fields.map((field: any) => (
            <div key={field.name} className="form-field">
              <label>{field.name}</label>
              <input
                type="text"
                value={annotation[field.name] || ''}
                onChange={(e) => setAnnotation({
                  ...annotation,
                  [field.name]: e.target.value
                })}
              />
            </div>
          ))}
        </div>

        <button 
          onClick={applyBulkAnnotation}
          disabled={selectedParagraphs.size === 0 || isAnnotating}
          className="apply-button"
        >
          Apply to {selectedParagraphs.size} Paragraphs
        </button>
      </div>

      <div className="paragraph-list">
        {paragraphs.map((para) => (
          <div 
            key={para.id}
            className={`paragraph-item ${selectedParagraphs.has(para.id) ? 'selected' : ''}`}
            onClick={() => toggleParagraph(para.id)}
          >
            {selectedParagraphs.has(para.id) ? 
              <CheckSquare size={20} /> : 
              <Square size={20} />
            }
            <div className="paragraph-preview">
              <span className="para-id">P{para.paragraph_index}</span>
              <span className="para-text">{para.text.substring(0, 100)}...</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BulkAnnotationPanel
```

---

## Part 5: Implementation Priority

### Phase 1: Core Data Mining (Week 1-2)
1. **Create text analytics utility** (`backend/utils/text_analytics.py`)
   - Entity extraction
   - Keyword extraction
   - Sentiment analysis
   - Pattern detection

2. **Add data mining API** (`backend/routers/data_mining.py`)
   - Text analysis endpoint
   - Batch analysis support

3. **Update parse.py**
   - Enhanced paragraph extraction
   - Metadata enrichment

### Phase 2: Smart Templates (Week 3-4)
1. **Template validation** (`backend/utils/template_validator.py`)
2. **Template storage with versioning** (`backend/utils/template_storage.py`)
3. **Template suggestions** (`backend/utils/template_suggestions.py`)
4. **Template auto-mapping** (`backend/utils/template_mapper.py`)

### Phase 3: Automation (Week 5-6)
1. **Bulk operations** (`backend/routers/bulk_operations.py`)
2. **Auto-annotation system**
3. **Batch export improvements**

### Phase 4: Frontend Integration (Week 7-8)
1. **Smart template designer UI**
2. **Bulk annotation panel**
3. **Analytics dashboard enhancements**
4. **Template preview and validation UI**

---

## Part 6: Dependencies to Add

```txt
# Add to backend/requirements.txt

# NLP and Text Processing
spacy==3.7.2
en-core-web-sm @ https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.7.0/en_core_web_sm-3.7.0-py3-none-any.whl

# Additional utilities
scikit-learn==1.3.2  # For similarity detection
nltk==3.8.1  # For advanced text processing
textblob==0.17.1  # For sentiment analysis (alternative)

# Existing packages (ensure present)
pdfplumber>=0.10.0
pytesseract>=0.3.10
pdf2image>=1.16.3
ebooklib>=0.18
beautifulsoup4>=4.12.0
fastapi>=0.104.0
uvicorn>=0.24.0
python-multipart>=0.0.6
```

---

## Part 7: Quick Wins (Can Implement Today)

### 1. Enhanced Paragraph Metadata
Update `parse.py` to add rich metadata:
```python
# Add to extract_paragraphs_from_text() function
para_data["sentence_count"] = len(re.findall(r'[.!?]+', cleaned))
para_data["has_numbers"] = bool(re.search(r'\d', cleaned))
para_data["is_question"] = cleaned.strip().endswith('?')
para_data["likely_heading"] = len(cleaned) < 100 and not cleaned.endswith('.')
```

### 2. Template Validation Endpoint
Add simple validation to `templates.py`:
```python
@router.post("/templates/validate")
async def validate_template(template: Dict[str, Any]):
    errors = []
    if 'fields' not in template:
        errors.append("Missing 'fields'")
    if 'annotation_schema' not in template:
        errors.append("Missing 'annotation_schema'")
    
    return {"valid": len(errors) == 0, "errors": errors}
```

### 3. Batch Export Fix
Fix the placeholder in `export.py`:
```python
def get_parsed_data(file_id: str) -> List[Dict[str, Any]]:
    """Retrieve parsed data from cache"""
    storage_dir = get_storage_dir()
    cache_file = f"{storage_dir}/cache/{file_id}_parsed.json"
    
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            return json.load(f).get('paragraphs', [])
    
    return []
```

---

## Summary

This improvement plan provides a comprehensive roadmap to enhance DataForge Reader's data mining and template creation capabilities. The features are designed to:

1. **Automate repetitive tasks** - Reduce manual annotation effort
2. **Provide intelligent suggestions** - Guide users to better templates
3. **Enable batch operations** - Process multiple documents efficiently
4. **Ensure data quality** - Validate templates and annotations
5. **Enhance insights** - Extract more value from documents

All improvements maintain the existing architecture and can be implemented incrementally without breaking changes.
