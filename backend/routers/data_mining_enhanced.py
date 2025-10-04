"""
Enhanced Data Mining Router with Advanced NLP Features
Provides comprehensive text analysis capabilities
"""

from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import asyncio
from datetime import datetime

# Import both analyzers for backward compatibility and enhancement
from ..utils.text_analytics import text_analyzer
from ..utils.advanced_nlp import advanced_text_analyzer

router = APIRouter()

# Enhanced Request Models
class EnhancedAnalyzeRequest(BaseModel):
    text: str = Field(..., description="Text to analyze")
    
    # Basic analysis options
    include_entities: bool = Field(default=True, description="Include named entity recognition")
    include_keywords: bool = Field(default=True, description="Include keyword extraction")
    include_sentiment: bool = Field(default=True, description="Include sentiment analysis")
    include_statistics: bool = Field(default=True, description="Include text statistics")
    include_summary: bool = Field(default=True, description="Include text summary")
    
    # Advanced analysis options
    include_emotions: bool = Field(default=False, description="Include emotion detection")
    include_topics: bool = Field(default=False, description="Include topic modeling")
    include_readability: bool = Field(default=False, description="Include readability analysis")
    include_structure: bool = Field(default=False, description="Include document structure analysis")
    
    # Configuration options
    top_keywords: int = Field(default=15, ge=1, le=50, description="Number of keywords to extract")
    analysis_depth: str = Field(default="standard", description="Analysis depth: basic, standard, comprehensive")

class BatchAnalyzeEnhancedRequest(BaseModel):
    texts: List[str] = Field(..., min_items=1, max_items=100, description="List of texts to analyze")
    
    # Analysis options (same as single analysis)
    include_entities: bool = Field(default=True)
    include_keywords: bool = Field(default=True)
    include_sentiment: bool = Field(default=True)
    include_statistics: bool = Field(default=True)
    include_summary: bool = Field(default=False)
    include_emotions: bool = Field(default=False)
    include_topics: bool = Field(default=True)
    include_readability: bool = Field(default=False)
    include_structure: bool = Field(default=False)
    
    # Batch-specific options
    include_cross_analysis: bool = Field(default=True, description="Include cross-document analysis")
    include_similarity_matrix: bool = Field(default=False, description="Include text similarity matrix")
    
    top_keywords: int = Field(default=15, ge=1, le=50)
    analysis_depth: str = Field(default="standard")

class TextSimilarityRequest(BaseModel):
    text1: str = Field(..., description="First text for comparison")
    text2: str = Field(..., description="Second text for comparison")

class TopicModelingRequest(BaseModel):
    texts: List[str] = Field(..., min_items=2, max_items=100, description="Texts for topic modeling")
    num_topics: int = Field(default=5, ge=2, le=20, description="Number of topics to extract")

# Enhanced Response Models
class EnhancedAnalysisResponse(BaseModel):
    text_length: int
    language: str
    analysis_timestamp: datetime
    
    # Basic analysis results
    entities: Optional[List[Dict[str, Any]]] = None
    keywords: Optional[List[Dict[str, Any]]] = None
    sentiment: Optional[Dict[str, Any]] = None
    statistics: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    
    # Advanced analysis results
    emotions: Optional[Dict[str, float]] = None
    readability: Optional[Dict[str, float]] = None
    structure: Optional[Dict[str, Any]] = None
    
    # Analysis metadata
    processing_time_ms: float
    analysis_depth: str

class BatchAnalysisEnhancedResponse(BaseModel):
    total_texts: int
    analysis_timestamp: datetime
    processing_time_ms: float
    
    # Individual results
    individual_results: List[EnhancedAnalysisResponse]
    
    # Aggregated results
    aggregated_entities: Optional[List[Dict[str, Any]]] = None
    aggregated_keywords: Optional[List[Dict[str, Any]]] = None
    aggregated_sentiment: Optional[Dict[str, Any]] = None
    aggregated_statistics: Optional[Dict[str, Any]] = None
    
    # Cross-document analysis
    topics: Optional[Dict[str, Any]] = None
    similarity_matrix: Optional[List[Dict[str, Any]]] = None
    document_clusters: Optional[List[Dict[str, Any]]] = None

# Enhanced Endpoints

@router.post("/analyze-enhanced", response_model=EnhancedAnalysisResponse)
async def analyze_text_enhanced(request: EnhancedAnalyzeRequest):
    """
    Enhanced text analysis with advanced NLP features
    
    Features:
    - Multi-dimensional sentiment analysis with emotion detection
    - Advanced keyword extraction using multiple algorithms (TF-IDF, TextRank)
    - Enhanced named entity recognition with confidence scoring
    - Document structure and readability analysis
    - Topic modeling capabilities
    """
    start_time = datetime.now()
    
    try:
        result = {
            "text_length": len(request.text),
            "analysis_timestamp": start_time,
            "analysis_depth": request.analysis_depth
        }
        
        # Choose analyzer based on analysis depth
        if request.analysis_depth == "comprehensive":
            analyzer = advanced_text_analyzer
        else:
            analyzer = text_analyzer  # Fallback to basic analyzer
        
        # Language detection
        result["language"] = analyzer.detect_language(request.text)
        
        # Basic analysis (compatible with existing API)
        if request.include_entities:
            if hasattr(analyzer, 'enhanced_entity_recognition'):
                result["entities"] = analyzer.enhanced_entity_recognition(request.text)
            else:
                result["entities"] = analyzer.extract_entities(request.text)
        
        if request.include_keywords:
            if hasattr(analyzer, 'advanced_keyword_extraction'):
                result["keywords"] = analyzer.advanced_keyword_extraction(request.text, request.top_keywords)
            else:
                result["keywords"] = analyzer.extract_keywords(request.text, request.top_keywords)
        
        if request.include_sentiment:
            if hasattr(analyzer, 'advanced_sentiment_analysis') and request.analysis_depth == "comprehensive":
                result["sentiment"] = analyzer.advanced_sentiment_analysis(request.text)
            elif hasattr(analyzer, 'analyze_sentiment'):
                result["sentiment"] = analyzer.analyze_sentiment(request.text)
            else:
                # Fallback sentiment
                positive_words = ["good", "great", "excellent", "amazing", "wonderful", "fantastic", "positive", "revolutionary"]
                negative_words = ["bad", "terrible", "awful", "horrible", "negative", "poor", "disappointing"]
                words = request.text.lower().split()
                pos_count = sum(1 for word in words if word in positive_words)
                neg_count = sum(1 for word in words if word in negative_words)
                
                if pos_count > neg_count:
                    sentiment = "positive"
                    score = min(pos_count / len(words) * 10, 1.0) if words else 0.0
                elif neg_count > pos_count:
                    sentiment = "negative"
                    score = -min(neg_count / len(words) * 10, 1.0) if words else 0.0
                else:
                    sentiment = "neutral"
                    score = 0.0
                
                result["sentiment"] = {
                    "sentiment": sentiment,
                    "score": score,
                    "confidence": 0.7
                }
        
        if request.include_statistics:
            if hasattr(analyzer, 'extract_statistics'):
                result["statistics"] = analyzer.extract_statistics(request.text)
            else:
                # Fallback statistics
                result["statistics"] = {
                    "word_count": len(request.text.split()),
                    "character_count": len(request.text),
                    "sentence_count": len([s for s in request.text.split('.') if s.strip()]),
                    "paragraph_count": len([p for p in request.text.split('\n\n') if p.strip()])
                }
        
        if request.include_summary:
            if hasattr(analyzer, 'get_text_summary'):
                result["summary"] = analyzer.get_text_summary(request.text)
            else:
                # Fallback summary
                sentences = [s.strip() for s in request.text.split('.') if s.strip()]
                result["summary"] = {
                    "first_sentence": sentences[0] if sentences else "",
                    "sentence_count": len(sentences),
                    "summary_length": min(3, len(sentences))
                }
        
        # Advanced analysis (only with comprehensive depth)
        if request.analysis_depth == "comprehensive":
            if request.include_emotions and hasattr(analyzer, '_detect_emotions'):
                result["emotions"] = analyzer._detect_emotions(request.text)
            
            if request.include_readability and hasattr(analyzer, '_calculate_readability_score'):
                result["readability"] = analyzer._calculate_readability_score(request.text)
            
            if request.include_structure and hasattr(analyzer, 'document_structure_analysis'):
                result["structure"] = analyzer.document_structure_analysis(request.text)
        
        # Calculate processing time
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds() * 1000
        result["processing_time_ms"] = round(processing_time, 2)
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch-analyze-enhanced", response_model=BatchAnalysisEnhancedResponse)
async def batch_analyze_enhanced(request: BatchAnalyzeEnhancedRequest):
    """
    Enhanced batch text analysis with cross-document insights
    
    Features:
    - Parallel processing of multiple texts
    - Cross-document topic modeling
    - Text similarity analysis
    - Document clustering
    - Aggregated insights across all texts
    """
    start_time = datetime.now()
    
    try:
        # Choose analyzer based on analysis depth
        if request.analysis_depth == "comprehensive":
            analyzer = advanced_text_analyzer
            
            # Use advanced batch analysis
            if hasattr(analyzer, 'batch_analyze_advanced'):
                options = {
                    "include_entities": request.include_entities,
                    "include_keywords": request.include_keywords,
                    "include_sentiment": request.include_sentiment,
                    "include_topics": request.include_topics,
                    "include_similarity": request.include_similarity_matrix,
                    "include_structure": request.include_structure
                }
                analysis_result = analyzer.batch_analyze_advanced(request.texts, options)
                
                # Format response
                end_time = datetime.now()
                processing_time = (end_time - start_time).total_seconds() * 1000
                
                return {
                    "total_texts": len(request.texts),
                    "analysis_timestamp": start_time,
                    "processing_time_ms": round(processing_time, 2),
                    "individual_results": analysis_result.get("individual_results", []),
                    "topics": analysis_result.get("cross_document_analysis", {}).get("topics"),
                    "similarity_matrix": analysis_result.get("cross_document_analysis", {}).get("similarities"),
                    "aggregated_entities": analysis_result.get("aggregated_results", {}).get("entities"),
                    "aggregated_keywords": analysis_result.get("aggregated_results", {}).get("keywords"),
                    "aggregated_sentiment": analysis_result.get("aggregated_results", {}).get("sentiment")
                }
        
        # Fallback to basic batch analysis
        results = []
        all_entities = []
        all_keywords = []
        sentiment_scores = []
        
        for i, text in enumerate(request.texts):
            # Create a proper EnhancedAnalysisResponse format
            analysis = {
                "text_length": len(text),
                "language": "en",  # Default language
                "analysis_timestamp": start_time,
                "analysis_depth": request.analysis_depth,
                "processing_time_ms": 0.0,  # Will be calculated later
                "entities": None,
                "keywords": None,
                "sentiment": None,
                "statistics": None,
                "summary": None,
                "emotions": None,
                "readability": None,
                "structure": None
            }
            
            if request.include_entities:
                entities = text_analyzer.extract_entities(text)
                analysis["entities"] = entities
                all_entities.extend(entities)
            
            if request.include_keywords:
                keywords = text_analyzer.extract_keywords(text, request.top_keywords)
                analysis["keywords"] = keywords
                all_keywords.extend(keywords)
            
            if request.include_sentiment:
                sentiment = text_analyzer.analyze_sentiment(text)
                analysis["sentiment"] = sentiment
                if sentiment:
                    sentiment_scores.append(sentiment.get("score", 0))
            
            if request.include_statistics:
                analysis["statistics"] = {
                    "word_count": len(text.split()),
                    "character_count": len(text),
                    "sentence_count": len([s for s in text.split('.') if s.strip()]),
                    "paragraph_count": len([p for p in text.split('\n\n') if p.strip()])
                }
            
            results.append(analysis)
        
        # Basic aggregation
        aggregated_entities = None
        if all_entities:
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
            
            for key, entity in entity_counter.items():
                entity["avg_confidence"] = round(entity["avg_confidence"] / entity["count"], 3)
            
            aggregated_entities = sorted(entity_counter.values(), key=lambda x: x["count"], reverse=True)
        
        # Calculate processing time
        end_time = datetime.now()
        processing_time = (end_time - start_time).total_seconds() * 1000
        
        return {
            "total_texts": len(request.texts),
            "analysis_timestamp": start_time,
            "processing_time_ms": round(processing_time, 2),
            "individual_results": results,
            "aggregated_entities": aggregated_entities,
            "topics": None,  # Only available in comprehensive mode
            "similarity_matrix": None  # Only available in comprehensive mode
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.post("/text-similarity")
async def analyze_text_similarity(request: TextSimilarityRequest):
    """
    Analyze similarity between two texts using multiple algorithms
    """
    try:
        if hasattr(advanced_text_analyzer, 'text_similarity'):
            similarity = advanced_text_analyzer.text_similarity(request.text1, request.text2)
        else:
            # Fallback: simple word overlap
            words1 = set(request.text1.lower().split())
            words2 = set(request.text2.lower().split())
            
            jaccard = len(words1 & words2) / len(words1 | words2) if words1 | words2 else 0
            
            similarity = {
                "jaccard_similarity": round(jaccard, 3),
                "cosine_similarity": 0.0,  # Not implemented in fallback
                "entity_overlap": 0.0,  # Not implemented in fallback
                "overall_similarity": round(jaccard, 3)
            }
        
        return {
            "similarity_analysis": similarity,
            "text1_length": len(request.text1),
            "text2_length": len(request.text2)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Similarity analysis failed: {str(e)}")

@router.post("/topic-modeling")
async def extract_topics(request: TopicModelingRequest):
    """
    Extract topics from multiple texts using topic modeling
    """
    try:
        if hasattr(advanced_text_analyzer, 'topic_modeling'):
            topics = advanced_text_analyzer.topic_modeling(request.texts, request.num_topics)
        else:
            # Fallback: basic keyword-based topics
            all_keywords = []
            for text in request.texts:
                keywords = text_analyzer.extract_keywords(text, 10)
                all_keywords.extend([kw["keyword"] for kw in keywords])
            
            from collections import Counter
            top_keywords = [kw for kw, count in Counter(all_keywords).most_common(20)]
            
            # Simple topic grouping
            topics = {
                "topics": [{
                    "topic_id": 0,
                    "keywords": top_keywords[:10],
                    "coherence_score": 0.5
                }],
                "document_topics": [{"document_index": i, "primary_topic": 0} 
                                  for i in range(len(request.texts))],
                "num_topics": 1
            }
        
        return {
            "topic_analysis": topics,
            "total_texts": len(request.texts),
            "requested_topics": request.num_topics
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Topic modeling failed: {str(e)}")

@router.get("/nlp-capabilities")
async def get_nlp_capabilities():
    """
    Get information about available NLP capabilities and models
    """
    capabilities = {
        "basic_features": {
            "named_entity_recognition": True,
            "keyword_extraction": True,
            "sentiment_analysis": True,
            "text_statistics": True,
            "language_detection": True
        },
        "advanced_features": {
            "emotion_detection": hasattr(advanced_text_analyzer, '_detect_emotions'),
            "multi_dimensional_sentiment": hasattr(advanced_text_analyzer, 'advanced_sentiment_analysis'),
            "advanced_keyword_extraction": hasattr(advanced_text_analyzer, 'advanced_keyword_extraction'),
            "topic_modeling": hasattr(advanced_text_analyzer, 'topic_modeling'),
            "text_similarity": hasattr(advanced_text_analyzer, 'text_similarity'),
            "document_structure_analysis": hasattr(advanced_text_analyzer, 'document_structure_analysis'),
            "readability_analysis": hasattr(advanced_text_analyzer, '_calculate_readability_score')
        },
        "models_available": {
            "spacy_model": advanced_text_analyzer.spacy_available,
            "spacy_model_name": "en_core_web_sm" if advanced_text_analyzer.spacy_available else None
        },
        "supported_languages": ["en"],  # Can be extended
        "max_text_length": 50000,  # Character limit
        "max_batch_size": 100
    }
    
    return capabilities

@router.get("/health-enhanced")
async def health_check_enhanced():
    """
    Enhanced health check with detailed system information
    """
    try:
        # Test basic analyzer
        basic_test = text_analyzer.analyze_sentiment("This is a test.")
        basic_health = basic_test is not None
        
        # Test advanced analyzer if available
        advanced_health = False
        if hasattr(advanced_text_analyzer, 'advanced_sentiment_analysis'):
            try:
                advanced_test = advanced_text_analyzer.advanced_sentiment_analysis("This is a test.")
                advanced_health = advanced_test is not None
            except:
                advanced_health = False
        
        return {
            "status": "healthy" if basic_health else "degraded",
            "timestamp": datetime.now().isoformat(),
            "analyzers": {
                "basic_analyzer": {
                    "status": "healthy" if basic_health else "unhealthy",
                    "spacy_available": text_analyzer.spacy_available
                },
                "advanced_analyzer": {
                    "status": "healthy" if advanced_health else "unavailable",
                    "spacy_available": advanced_text_analyzer.spacy_available
                }
            },
            "capabilities": await get_nlp_capabilities()
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# Backward compatibility - keep existing endpoints
@router.post("/analyze", response_model=dict)
async def analyze_text_basic(request: dict):
    """
    Basic analysis endpoint for backward compatibility
    """
    try:
        # Convert old request format to new format
        enhanced_request = EnhancedAnalyzeRequest(
            text=request.get("text", ""),
            include_entities=request.get("include_entities", True),
            include_keywords=request.get("include_keywords", True),
            include_sentiment=request.get("include_sentiment", True),
            include_statistics=request.get("include_statistics", True),
            include_summary=request.get("include_summary", True),
            top_keywords=request.get("top_keywords", 10),
            analysis_depth="basic"
        )
        
        result = await analyze_text_enhanced(enhanced_request)
        
        # Convert back to old format
        return {
            "text_length": result.text_length,
            "language": result.language,
            "entities": result.entities,
            "keywords": result.keywords,
            "sentiment": result.sentiment,
            "statistics": result.statistics,
            "summary": result.summary
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/batch-analyze", response_model=dict)
async def batch_analyze_basic(request: dict):
    """
    Basic batch analysis endpoint for backward compatibility
    """
    try:
        # Convert old request format
        enhanced_request = BatchAnalyzeEnhancedRequest(
            texts=request.get("texts", []),
            include_entities=request.get("include_entities", True),
            include_keywords=request.get("include_keywords", True),
            include_sentiment=request.get("include_sentiment", True),
            include_statistics=request.get("include_statistics", True),
            top_keywords=request.get("top_keywords", 10),
            analysis_depth="basic",
            include_cross_analysis=False
        )
        
        result = await batch_analyze_enhanced(enhanced_request)
        
        # Convert back to old format
        return {
            "total_texts": result.total_texts,
            "individual_results": result.individual_results,
            "aggregated_entities": result.aggregated_entities,
            "aggregated_keywords": result.aggregated_keywords,
            "aggregated_sentiment": result.aggregated_sentiment
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch analysis failed: {str(e)}")

@router.get("/health")
async def health_check_basic():
    """
    Basic health check for backward compatibility
    """
    health_info = await health_check_enhanced()
    
    return {
        "status": health_info["status"],
        "spacy_model": "en_core_web_sm" if text_analyzer.spacy_available else None,
        "version": "2.0.0-enhanced"
    }