"""
Data Mining API - Intelligent Text Analysis
Provides advanced text analytics including NER, keyword extraction, sentiment analysis
"""

from fastapi import APIRouter, HTTPException, Body
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
import sys
import os

# Add parent directory to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from utils.text_analytics import text_analyzer

router = APIRouter(
    prefix="/mine",
    tags=["data-mining"]
)

# Request Models
class AnalyzeRequest(BaseModel):
    text: str = Field(..., description="Text to analyze", min_length=1)
    include_entities: bool = Field(True, description="Extract named entities")
    include_keywords: bool = Field(True, description="Extract keywords")
    include_sentiment: bool = Field(True, description="Analyze sentiment")
    include_statistics: bool = Field(True, description="Extract statistics")
    include_summary: bool = Field(True, description="Get text summary")
    top_keywords: int = Field(10, description="Number of top keywords to extract", ge=1, le=50)

class BatchAnalyzeRequest(BaseModel):
    texts: List[str] = Field(..., description="List of texts to analyze", min_items=1, max_items=100)
    include_entities: bool = True
    include_keywords: bool = True
    include_sentiment: bool = True
    include_statistics: bool = False
    include_summary: bool = False
    top_keywords: int = 10

# Response Models
class AnalysisResponse(BaseModel):
    text_length: int
    entities: Optional[List[Dict[str, Any]]] = None
    keywords: Optional[List[Dict[str, Any]]] = None
    sentiment: Optional[Dict[str, Any]] = None
    statistics: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    language: str = "en"

class BatchAnalysisResponse(BaseModel):
    total_texts: int
    results: List[AnalysisResponse]
    aggregated_entities: Optional[List[Dict[str, Any]]] = None
    aggregated_keywords: Optional[List[Dict[str, Any]]] = None
    overall_sentiment: Optional[Dict[str, Any]] = None

@router.post("/analyze", response_model=AnalysisResponse)
async def analyze_text(request: AnalyzeRequest):
    """
    Analyze single text with comprehensive NLP features
    
    Features:
    - Named Entity Recognition (PERSON, ORG, LOCATION, DATE, etc.)
    - Keyword Extraction (noun phrases + entities)
    - Sentiment Analysis (positive/negative/neutral)
    - Statistical Extraction (numbers, percentages, currencies)
    - Text Summary (word count, sentence count, lexical diversity)
    """
    try:
        result = {
            "text_length": len(request.text),
            "language": text_analyzer.detect_language(request.text)
        }
        
        if request.include_entities:
            result["entities"] = text_analyzer.extract_entities(request.text)
        
        if request.include_keywords:
            result["keywords"] = text_analyzer.extract_keywords(request.text, top_n=request.top_keywords)
        
        if request.include_sentiment:
            result["sentiment"] = text_analyzer.analyze_sentiment(request.text)
        
        if request.include_statistics:
            result["statistics"] = text_analyzer.extract_statistics(request.text)
        
        if request.include_summary:
            result["summary"] = text_analyzer.get_text_summary(request.text)
        
        return result
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch-analyze", response_model=BatchAnalysisResponse)
async def batch_analyze_texts(request: BatchAnalyzeRequest):
    """
    Analyze multiple texts in batch with aggregated results
    
    Returns:
    - Individual analysis for each text
    - Aggregated entities (most common across all texts)
    - Aggregated keywords (most frequent)
    - Overall sentiment (average)
    """
    try:
        results = []
        all_entities = []
        all_keywords = []
        sentiment_scores = []
        
        for text in request.texts:
            analysis = {
                "text_length": len(text),
                "language": text_analyzer.detect_language(text)
            }
            
            if request.include_entities:
                entities = text_analyzer.extract_entities(text)
                analysis["entities"] = entities
                all_entities.extend(entities)
            
            if request.include_keywords:
                keywords = text_analyzer.extract_keywords(text, top_n=request.top_keywords)
                analysis["keywords"] = keywords
                all_keywords.extend(keywords)
            
            if request.include_sentiment:
                sentiment = text_analyzer.analyze_sentiment(text)
                analysis["sentiment"] = sentiment
                sentiment_scores.append(sentiment["score"])
            
            if request.include_statistics:
                analysis["statistics"] = text_analyzer.extract_statistics(text)
            
            if request.include_summary:
                analysis["summary"] = text_analyzer.get_text_summary(text)
            
            results.append(analysis)
        
        # Aggregate entities by type and text
        aggregated_entities = None
        if request.include_entities and all_entities:
            entity_counter = {}
            for ent in all_entities:
                key = f"{ent['text']}|{ent['label']}"
                if key not in entity_counter:
                    entity_counter[key] = {
                        "text": ent["text"],
                        "label": ent["label"],
                        "count": 0,
                        "avg_confidence": 0
                    }
                entity_counter[key]["count"] += 1
                entity_counter[key]["avg_confidence"] += ent.get("confidence", 0.5)
            
            # Calculate averages and sort
            for key in entity_counter:
                count = entity_counter[key]["count"]
                entity_counter[key]["avg_confidence"] = round(
                    entity_counter[key]["avg_confidence"] / count, 3
                )
            
            aggregated_entities = sorted(
                entity_counter.values(),
                key=lambda x: x["count"],
                reverse=True
            )[:50]  # Top 50 entities
        
        # Aggregate keywords
        aggregated_keywords = None
        if request.include_keywords and all_keywords:
            keyword_counter = {}
            for kw in all_keywords:
                text = kw["keyword"]
                if text not in keyword_counter:
                    keyword_counter[text] = {
                        "keyword": text,
                        "total_score": 0,
                        "occurrences": 0
                    }
                keyword_counter[text]["total_score"] += kw["score"]
                keyword_counter[text]["occurrences"] += 1
            
            aggregated_keywords = sorted(
                [
                    {
                        "keyword": k,
                        "score": v["total_score"],
                        "occurrences": v["occurrences"]
                    }
                    for k, v in keyword_counter.items()
                ],
                key=lambda x: x["score"],
                reverse=True
            )[:20]  # Top 20 keywords
        
        # Overall sentiment
        overall_sentiment = None
        if request.include_sentiment and sentiment_scores:
            avg_score = sum(sentiment_scores) / len(sentiment_scores)
            if avg_score > 0.2:
                sentiment = "positive"
            elif avg_score < -0.2:
                sentiment = "negative"
            else:
                sentiment = "neutral"
            
            overall_sentiment = {
                "sentiment": sentiment,
                "average_score": round(avg_score, 3),
                "positive_count": sum(1 for s in sentiment_scores if s > 0.2),
                "negative_count": sum(1 for s in sentiment_scores if s < -0.2),
                "neutral_count": sum(1 for s in sentiment_scores if -0.2 <= s <= 0.2)
            }
        
        return {
            "total_texts": len(request.texts),
            "results": results,
            "aggregated_entities": aggregated_entities,
            "aggregated_keywords": aggregated_keywords,
            "overall_sentiment": overall_sentiment
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.get("/health")
async def health_check():
    """Check if NLP services are available"""
    return {
        "status": "healthy",
        "spacy_available": text_analyzer.spacy_available,
        "features": {
            "entity_extraction": True,
            "keyword_extraction": True,
            "sentiment_analysis": True,
            "statistics_extraction": True,
            "text_summarization": True
        }
    }
