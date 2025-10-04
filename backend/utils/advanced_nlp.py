"""
Advanced NLP Features for DataForge-Reader
Enhanced text analysis with state-of-the-art NLP capabilities
"""

from typing import List, Dict, Any, Optional, Tuple, Set
import re
from collections import Counter, defaultdict
import math
import numpy as np
from datetime import datetime, timedelta
import json

try:
    import spacy
    SPACY_AVAILABLE = True
except ImportError:
    SPACY_AVAILABLE = False
    spacy = None

class AdvancedTextAnalyzer:
    """Advanced NLP text analysis with enhanced features"""
    
    def __init__(self):
        """
        Initialize the Advanced Text Analyzer with enhanced capabilities
        """
        # Initialize spaCy model
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            self.spacy_available = True
            print("Advanced Text Analyzer: spaCy model loaded successfully")
        except (OSError, ImportError) as e:
            print(f"Advanced Text Analyzer: Warning - spaCy model not available: {e}")
            self.nlp = None
            self.spacy_available = False
        
        # Initialize advanced components
        self._init_enhanced_sentiment_lexicons()
        self._init_tfidf_vectorizer()
    
    def detect_language(self, text: str) -> str:
        """
        Detect the language of the input text
        
        Args:
            text: Input text to analyze
            
        Returns:
            Language code (default: 'en' for English)
        """
        # For now, return English as default
        # This can be enhanced with language detection libraries like langdetect
        try:
            # Basic heuristic: if text contains mostly English words, return 'en'
            if self.spacy_available and self.nlp:
                doc = self.nlp(text[:100])  # Analyze first 100 characters
                english_tokens = sum(1 for token in doc if token.is_alpha and token.lang_ == 'en')
                total_alpha_tokens = sum(1 for token in doc if token.is_alpha)
                
                if total_alpha_tokens > 0 and english_tokens / total_alpha_tokens > 0.5:
                    return 'en'
            
            # Fallback: assume English
            return 'en'
        except:
            return 'en'
    
    def _init_enhanced_sentiment_lexicons(self):
        """Initialize comprehensive sentiment analysis lexicons"""
        self.positive_words = {
            # Basic positive
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
            'love', 'best', 'perfect', 'beautiful', 'awesome', 'brilliant',
            'outstanding', 'superb', 'magnificent', 'incredible', 'exceptional',
            'positive', 'happy', 'pleased', 'delighted', 'satisfied',
            
            # Advanced positive
            'remarkable', 'extraordinary', 'phenomenal', 'spectacular', 'stunning',
            'marvelous', 'impressive', 'superior', 'delightful', 'enchanting',
            'inspiring', 'uplifting', 'refreshing', 'invigorating', 'energizing',
            'motivating', 'encouraging', 'thrilling', 'exciting', 'fascinating',
            'captivating', 'engaging', 'compelling', 'valuable', 'beneficial',
            'productive', 'effective', 'efficient', 'successful', 'winning',
            'triumphant', 'victorious', 'accomplished', 'fulfilled', 'content',
            'joyful', 'blissful', 'ecstatic', 'elated', 'euphoric', 'radiant'
        }
        
        self.negative_words = {
            # Basic negative
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor',
            'disappointing', 'useless', 'waste', 'broken', 'wrong', 'failed',
            'negative', 'sad', 'unhappy', 'upset', 'angry', 'frustrated', 'dissatisfied',
            
            # Advanced negative
            'devastating', 'catastrophic', 'disastrous', 'dreadful', 'appalling',
            'abysmal', 'atrocious', 'deplorable', 'disgraceful', 'shameful',
            'pathetic', 'miserable', 'wretched', 'pitiful', 'inferior', 'defective',
            'flawed', 'faulty', 'inadequate', 'insufficient', 'incompetent',
            'hopeless', 'futile', 'pointless', 'meaningless', 'worthless',
            'destructive', 'harmful', 'damaging', 'detrimental', 'toxic',
            'irritating', 'annoying', 'disturbing', 'troubling', 'concerning',
            'alarming', 'worrying', 'distressing', 'heartbreaking', 'devastating'
        }
        
        # Intensity modifiers
        self.intensifiers = {
            'very': 1.5, 'extremely': 2.0, 'incredibly': 2.0, 'absolutely': 1.8,
            'completely': 1.7, 'totally': 1.6, 'really': 1.4, 'quite': 1.3,
            'rather': 1.2, 'fairly': 1.1, 'somewhat': 0.8, 'slightly': 0.6,
            'barely': 0.4, 'hardly': 0.3, 'not': -1.0, 'never': -1.0
        }
        
        # Emotion categories
        self.emotion_lexicon = {
            'joy': {'happy', 'joyful', 'delighted', 'pleased', 'content', 'cheerful', 'blissful'},
            'anger': {'angry', 'furious', 'mad', 'irritated', 'annoyed', 'enraged', 'outraged'},
            'fear': {'scared', 'frightened', 'afraid', 'terrified', 'anxious', 'worried', 'nervous'},
            'sadness': {'sad', 'depressed', 'sorrowful', 'melancholy', 'gloomy', 'miserable', 'heartbroken'},
            'surprise': {'surprised', 'amazed', 'astonished', 'shocked', 'stunned', 'bewildered'},
            'disgust': {'disgusted', 'revolted', 'repulsed', 'nauseated', 'sickened', 'appalled'},
            'trust': {'trust', 'confident', 'secure', 'reliable', 'dependable', 'faithful'},
            'anticipation': {'excited', 'eager', 'hopeful', 'optimistic', 'expectant', 'anticipating'}
        }
    
    def _init_tfidf_vectorizer(self):
        """Initialize TF-IDF components for advanced keyword extraction"""
        self.document_frequencies = defaultdict(int)
        self.total_documents = 0
        self.vocabulary = set()
    
    def enhanced_entity_recognition(self, text: str) -> List[Dict[str, Any]]:
        """Enhanced entity recognition with confidence scoring and entity linking"""
        entities = []
        
        if self.spacy_available and self.nlp:
            entities = self._extract_entities_spacy_enhanced(text)
        else:
            entities = self._extract_entities_regex_enhanced(text)
        
        # Post-process entities for enhancement
        entities = self._post_process_entities(entities, text)
        
        return entities
    
    def _extract_entities_spacy_enhanced(self, text: str) -> List[Dict[str, Any]]:
        """Enhanced spaCy entity extraction with additional processing"""
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            # Calculate confidence based on multiple factors
            confidence = self._calculate_entity_confidence(ent, doc)
            
            entity_info = {
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": confidence,
                "description": spacy.explain(ent.label_) if spacy and hasattr(spacy, 'explain') else ent.label_,
                "context": self._get_entity_context(ent, doc),
                "canonical_form": self._get_canonical_form(ent)
            }
            
            # Add additional entity properties
            if ent.label_ == "PERSON":
                entity_info["gender"] = self._infer_gender(ent.text)
                entity_info["name_parts"] = self._parse_person_name(ent.text)
            elif ent.label_ == "ORG":
                entity_info["org_type"] = self._classify_organization(ent.text)
            elif ent.label_ in ["DATE", "TIME"]:
                entity_info["temporal_info"] = self._parse_temporal_entity(ent.text)
            
            entities.append(entity_info)
        
        return entities
    
    def _post_process_entities(self, entities: List[Dict[str, Any]], text: str) -> List[Dict[str, Any]]:
        """Post-process entities to enhance confidence and resolve coreferences"""
        # For now, just return entities as-is
        # This method can be enhanced with more sophisticated processing
        return entities
    
    def _calculate_entity_confidence(self, ent, doc) -> float:
        """Calculate entity confidence based on multiple factors"""
        base_confidence = 0.7
        
        # Factor 1: Entity length (longer entities tend to be more reliable)
        length_factor = min(len(ent.text) / 20.0, 0.2)
        
        # Factor 2: Capitalization pattern
        cap_factor = 0.1 if ent.text[0].isupper() else 0.0
        
        # Factor 3: Context coherence
        context_factor = self._calculate_context_coherence(ent, doc)
        
        # Factor 4: Entity type reliability
        type_reliability = {
            "PERSON": 0.9, "ORG": 0.85, "GPE": 0.9, "DATE": 0.95,
            "MONEY": 0.95, "PERCENT": 0.98, "TIME": 0.9
        }
        type_factor = type_reliability.get(ent.label_, 0.8)
        
        return min(base_confidence + length_factor + cap_factor + context_factor, type_factor)
    
    def _calculate_context_coherence(self, ent, doc) -> float:
        """Calculate how well entity fits in context"""
        # Simple implementation - can be enhanced with word embeddings
        window_size = 3
        start_idx = max(0, ent.start - window_size)
        end_idx = min(len(doc), ent.end + window_size)
        
        context_tokens = doc[start_idx:end_idx]
        
        # Look for patterns that suggest reliable entities
        coherence_indicators = {
            "PERSON": ["Mr.", "Mrs.", "Dr.", "CEO", "President", "said", "stated"],
            "ORG": ["Inc.", "Corp.", "LLC", "Ltd.", "Company", "announced"],
            "GPE": ["in", "from", "to", "at", "located", "based"]
        }
        
        indicators = coherence_indicators.get(ent.label_, [])
        found_indicators = sum(1 for token in context_tokens 
                             if token.text.lower() in [ind.lower() for ind in indicators])
        
        return min(found_indicators * 0.1, 0.3)
    
    def advanced_sentiment_analysis(self, text: str) -> Dict[str, Any]:
        """Advanced multi-dimensional sentiment analysis"""
        # Basic sentiment with intensity
        basic_sentiment = self._analyze_sentiment_with_intensity(text)
        
        # Emotion detection
        emotions = self._detect_emotions(text)
        
        # Aspect-based sentiment (simplified implementation)
        aspects = self._extract_aspects_and_sentiment_fallback(text)
        
        # Subjectivity analysis (simplified)
        subjectivity = self._analyze_subjectivity_fallback(text)
        
        # Temporal sentiment patterns (placeholder)
        temporal_sentiment = {}
        
        return {
            "overall_sentiment": basic_sentiment,
            "emotions": emotions,
            "aspect_sentiment": aspects,
            "subjectivity": subjectivity,
            "temporal_patterns": temporal_sentiment,
            "sentiment_strength": self._calculate_sentiment_strength(text)
        }
    
    def _analyze_sentiment_with_intensity(self, text: str) -> Dict[str, Any]:
        """Sentiment analysis with intensity modifiers"""
        words = re.findall(r'\b\w+\b', text.lower())
        
        total_score = 0.0
        sentiment_words_found = []
        
        for i, word in enumerate(words):
            if word in self.positive_words:
                intensity = 1.0
                # Check for intensity modifiers in previous 2 words
                for j in range(max(0, i-2), i):
                    if words[j] in self.intensifiers:
                        intensity *= self.intensifiers[words[j]]
                
                score = intensity
                total_score += score
                sentiment_words_found.append({"word": word, "sentiment": "positive", "score": score})
                
            elif word in self.negative_words:
                intensity = 1.0
                for j in range(max(0, i-2), i):
                    if words[j] in self.intensifiers:
                        intensity *= abs(self.intensifiers[words[j]])
                
                score = -intensity
                total_score += score
                sentiment_words_found.append({"word": word, "sentiment": "negative", "score": score})
        
        # Normalize score
        if len(sentiment_words_found) > 0:
            normalized_score = total_score / len(sentiment_words_found)
        else:
            normalized_score = 0.0
        
        # Classify sentiment
        if normalized_score > 0.3:
            sentiment = "positive"
        elif normalized_score < -0.3:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": round(normalized_score, 3),
            "confidence": min(abs(normalized_score) + 0.3, 1.0),
            "sentiment_words": sentiment_words_found,
            "intensity_score": abs(normalized_score)
        }
    
    def _detect_emotions(self, text: str) -> Dict[str, float]:
        """Detect multiple emotions in text"""
        words = set(re.findall(r'\b\w+\b', text.lower()))
        emotion_scores = {}
        
        for emotion, emotion_words in self.emotion_lexicon.items():
            matches = len(words & emotion_words)
            if matches > 0:
                emotion_scores[emotion] = matches / len(emotion_words)
        
        # Normalize scores
        if emotion_scores:
            max_score = max(emotion_scores.values())
            emotion_scores = {emotion: score/max_score for emotion, score in emotion_scores.items()}
        
        return emotion_scores
    
    def advanced_keyword_extraction(self, text: str, top_n: int = 15) -> List[Dict[str, Any]]:
        """Advanced keyword extraction using multiple algorithms"""
        keywords = []
        
        # Method 1: Enhanced TF-IDF
        tfidf_keywords = self._extract_tfidf_keywords(text, top_n)
        
        # Method 2: TextRank algorithm
        textrank_keywords = self._extract_textrank_keywords(text, top_n)
        
        # Method 3: Named entity boosting
        entity_keywords = self._extract_entity_keywords_fallback(text)
        
        # Method 4: N-gram analysis
        ngram_keywords = self._extract_ngram_keywords(text, top_n)
        
        # Combine and rank all keywords
        combined_keywords = self._combine_keyword_scores(
            tfidf_keywords, textrank_keywords, entity_keywords, ngram_keywords
        )
        
        # Filter and enhance keywords
        enhanced_keywords = self._enhance_keywords(combined_keywords, text)
        
        return sorted(enhanced_keywords, key=lambda x: x["score"], reverse=True)[:top_n]
    
    def _extract_tfidf_keywords(self, text: str, top_n: int) -> List[Dict[str, Any]]:
        """Extract keywords using TF-IDF scoring"""
        words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
        word_freq = Counter(words)
        
        # Calculate TF-IDF for each word
        tfidf_scores = {}
        for word, tf in word_freq.items():
            # Term frequency
            tf_score = tf / len(words)
            
            # Inverse document frequency (simplified)
            df = self.document_frequencies.get(word, 1)
            idf_score = math.log((self.total_documents + 1) / (df + 1))
            
            tfidf_scores[word] = tf_score * idf_score
        
        # Convert to keyword format
        keywords = []
        for word, score in sorted(tfidf_scores.items(), key=lambda x: x[1], reverse=True)[:top_n]:
            keywords.append({
                "keyword": word,
                "score": score,
                "type": "tfidf",
                "frequency": word_freq[word]
            })
        
        return keywords
    
    def _extract_textrank_keywords(self, text: str, top_n: int) -> List[Dict[str, Any]]:
        """Extract keywords using TextRank algorithm (simplified)"""
        if not self.spacy_available:
            return []
        
        doc = self.nlp(text)
        
        # Build word co-occurrence graph
        sentences = [sent.text for sent in doc.sents]
        word_cooccurrence = defaultdict(lambda: defaultdict(int))
        
        for sentence in sentences:
            words = [token.lemma_.lower() for token in self.nlp(sentence) 
                    if token.is_alpha and not token.is_stop and len(token.text) > 2]
            
            # Create co-occurrence matrix
            for i, word1 in enumerate(words):
                for j, word2 in enumerate(words):
                    if i != j and abs(i - j) <= 3:  # Window size of 3
                        word_cooccurrence[word1][word2] += 1
        
        # Simple PageRank implementation
        words = list(word_cooccurrence.keys())
        if not words:
            return []
        
        scores = {word: 1.0 for word in words}
        
        # Iterate PageRank
        for _ in range(10):  # 10 iterations
            new_scores = {}
            for word in words:
                score = 0.15  # Damping factor component
                for neighbor, weight in word_cooccurrence[word].items():
                    if neighbor in scores:
                        neighbor_out_degree = sum(word_cooccurrence[neighbor].values())
                        score += 0.85 * (weight / neighbor_out_degree) * scores[neighbor]
                new_scores[word] = score
            scores = new_scores
        
        # Convert to keyword format
        keywords = []
        for word, score in sorted(scores.items(), key=lambda x: x[1], reverse=True)[:top_n]:
            keywords.append({
                "keyword": word,
                "score": score,
                "type": "textrank",
                "centrality": score
            })
        
        return keywords
    
    def _extract_entity_keywords_fallback(self, text: str) -> List[Dict[str, Any]]:
        """Extract keywords based on named entities"""
        keywords = []
        
        if self.spacy_available and self.nlp:
            doc = self.nlp(text)
            entity_texts = [ent.text.lower() for ent in doc.ents]
            
            for entity_text in entity_texts:
                keywords.append({
                    "keyword": entity_text,
                    "score": 0.8,  # High score for entities
                    "type": "entity",
                    "confidence": 0.8
                })
        
        return keywords
    
    def _extract_ngram_keywords(self, text: str, top_n: int) -> List[Dict[str, Any]]:
        """Extract n-gram keywords"""
        keywords = []
        words = text.lower().split()
        
        # Generate bigrams and trigrams
        for n in [2, 3]:
            ngrams = [' '.join(words[i:i+n]) for i in range(len(words)-n+1)]
            ngram_freq = Counter(ngrams)
            
            for ngram, freq in ngram_freq.most_common(top_n//2):
                keywords.append({
                    "keyword": ngram,
                    "score": freq / len(ngrams),
                    "type": f"{n}-gram",
                    "frequency": freq
                })
        
        return keywords
    
    def _combine_keyword_scores(self, *keyword_lists) -> List[Dict[str, Any]]:
        """Combine multiple keyword extraction methods"""
        keyword_scores = defaultdict(list)
        
        for keyword_list in keyword_lists:
            for kw in keyword_list:
                keyword_scores[kw["keyword"]].append(kw["score"])
        
        combined = []
        for keyword, scores in keyword_scores.items():
            combined_score = sum(scores) / len(scores)  # Average score
            combined.append({
                "keyword": keyword,
                "score": combined_score,
                "type": "combined",
                "methods_count": len(scores)
            })
        
        return sorted(combined, key=lambda x: x["score"], reverse=True)
    
    def _enhance_keywords(self, keywords: List[Dict[str, Any]], text: str) -> List[Dict[str, Any]]:
        """Enhance keywords with additional information"""
        # For now, just return the keywords as-is
        # This can be enhanced with semantic similarity, context analysis, etc.
        return keywords
    
    def topic_modeling(self, texts: List[str], num_topics: int = 5) -> Dict[str, Any]:
        """Simple topic modeling using word co-occurrence"""
        if not texts:
            return {"topics": [], "document_topics": []}
        
        # Combine all texts and extract keywords
        all_keywords = []
        for text in texts:
            keywords = self.advanced_keyword_extraction(text, 20)
            all_keywords.extend([kw["keyword"] for kw in keywords])
        
        # Find most common keyword combinations
        keyword_counter = Counter(all_keywords)
        top_keywords = [kw for kw, count in keyword_counter.most_common(50)]
        
        # Simple clustering of keywords into topics
        topics = []
        keywords_per_topic = len(top_keywords) // num_topics
        
        for i in range(num_topics):
            start_idx = i * keywords_per_topic
            end_idx = start_idx + keywords_per_topic if i < num_topics - 1 else len(top_keywords)
            
            topic_keywords = top_keywords[start_idx:end_idx]
            
            topics.append({
                "topic_id": i,
                "keywords": topic_keywords,
                "coherence_score": self._calculate_topic_coherence(topic_keywords, texts)
            })
        
        # Assign documents to topics
        document_topics = []
        for text in texts:
            text_keywords = set([kw["keyword"] for kw in self.advanced_keyword_extraction(text, 10)])
            
            topic_scores = []
            for topic in topics:
                overlap = len(text_keywords & set(topic["keywords"]))
                topic_scores.append(overlap / len(text_keywords) if text_keywords else 0)
            
            best_topic = topic_scores.index(max(topic_scores)) if topic_scores else 0
            document_topics.append({
                "document_index": len(document_topics),
                "primary_topic": best_topic,
                "topic_scores": topic_scores
            })
        
        return {
            "topics": topics,
            "document_topics": document_topics,
            "num_topics": num_topics
        }
    
    def _extract_aspects_and_sentiment_fallback(self, text: str) -> Dict[str, Any]:
        """Fallback aspect-based sentiment analysis"""
        return {
            "aspects": [],
            "aspect_sentiments": {},
            "dominant_aspect": None
        }
    
    def _analyze_subjectivity_fallback(self, text: str) -> Dict[str, float]:
        """Fallback subjectivity analysis"""
        # Simple heuristic: count opinion words
        opinion_words = ["think", "believe", "feel", "opinion", "probably", "maybe", "should", "could"]
        text_lower = text.lower()
        opinion_count = sum(1 for word in opinion_words if word in text_lower)
        
        return {
            "subjectivity_score": min(opinion_count / 10.0, 1.0),
            "objectivity_score": 1.0 - min(opinion_count / 10.0, 1.0)
        }
    
    def _calculate_sentiment_strength(self, text: str) -> float:
        """Calculate overall sentiment strength"""
        # Simple implementation based on word count and intensity
        words = text.lower().split()
        strong_words = ["very", "extremely", "absolutely", "completely", "totally", "definitely"]
        strength = sum(1 for word in words if word in strong_words)
        return min(strength / len(words) * 10, 1.0) if words else 0.0
    
    def _infer_heading_level(self, text: str) -> int:
        """Infer heading level based on text characteristics"""
        # Simple heuristic for heading levels
        if re.match(r'^\d+\.\s+', text):  # "1. Title"
            return 1
        elif re.match(r'^\d+\.\d+\s+', text):  # "1.1 Subtitle"
            return 2
        elif text.isupper():  # "ALL CAPS HEADING"
            return 1
        elif len(text) < 50:  # Short text likely a heading
            return 2
        else:
            return 3
    
    def _calculate_text_complexity(self, text: str) -> float:
        """Calculate text complexity score"""
        words = text.split()
        if not words:
            return 0.0
        
        # Simple complexity based on average word length and sentence length
        avg_word_length = sum(len(word) for word in words) / len(words)
        sentences = [s for s in re.split(r'[.!?]+', text) if s.strip()]
        avg_sentence_length = len(words) / len(sentences) if sentences else 0
        
        # Normalize to 0-1 scale
        complexity = (avg_word_length / 10 + avg_sentence_length / 20) / 2
        return min(complexity, 1.0)
    
    def _calculate_document_complexity(self, text: str) -> float:
        """Calculate overall document complexity"""
        # Wrapper for text complexity - can be enhanced with more sophisticated metrics
        return self._calculate_text_complexity(text)
    
    def text_similarity(self, text1: str, text2: str) -> Dict[str, float]:
        """Calculate text similarity using multiple methods"""
        # Method 1: Jaccard similarity on words
        words1 = set(re.findall(r'\b\w+\b', text1.lower()))
        words2 = set(re.findall(r'\b\w+\b', text2.lower()))
        
        jaccard = len(words1 & words2) / len(words1 | words2) if words1 | words2 else 0
        
        # Method 2: Cosine similarity on keyword vectors
        keywords1 = {kw["keyword"]: kw["score"] for kw in self.advanced_keyword_extraction(text1)}
        keywords2 = {kw["keyword"]: kw["score"] for kw in self.advanced_keyword_extraction(text2)}
        
        all_keywords = set(keywords1.keys()) | set(keywords2.keys())
        
        if all_keywords:
            vec1 = [keywords1.get(kw, 0) for kw in all_keywords]
            vec2 = [keywords2.get(kw, 0) for kw in all_keywords]
            
            dot_product = sum(a * b for a, b in zip(vec1, vec2))
            norm1 = math.sqrt(sum(a * a for a in vec1))
            norm2 = math.sqrt(sum(b * b for b in vec2))
            
            cosine = dot_product / (norm1 * norm2) if norm1 * norm2 > 0 else 0
        else:
            cosine = 0
        
        # Method 3: Entity overlap
        entities1 = {ent["text"].lower() for ent in self.enhanced_entity_recognition(text1)}
        entities2 = {ent["text"].lower() for ent in self.enhanced_entity_recognition(text2)}
        
        entity_overlap = len(entities1 & entities2) / len(entities1 | entities2) if entities1 | entities2 else 0
        
        return {
            "jaccard_similarity": round(jaccard, 3),
            "cosine_similarity": round(cosine, 3),
            "entity_overlap": round(entity_overlap, 3),
            "overall_similarity": round((jaccard + cosine + entity_overlap) / 3, 3)
        }
    
    def document_structure_analysis(self, text: str) -> Dict[str, Any]:
        """Analyze document structure and organization"""
        lines = text.split('\n')
        paragraphs = [p.strip() for p in text.split('\n\n') if p.strip()]
        sentences = re.split(r'[.!?]+', text)
        
        # Detect headings (simple heuristic)
        headings = []
        for i, line in enumerate(lines):
            line = line.strip()
            if (len(line) < 100 and 
                (line.isupper() or 
                 re.match(r'^[A-Z][^.!?]*$', line) or
                 re.match(r'^\d+\.?\s+[A-Z]', line))):
                headings.append({
                    "text": line,
                    "line_number": i + 1,
                    "level": self._infer_heading_level(line)
                })
        
        # Analyze paragraph structure
        paragraph_analysis = []
        for i, para in enumerate(paragraphs):
            para_sentences = re.split(r'[.!?]+', para)
            paragraph_analysis.append({
                "paragraph_index": i,
                "sentence_count": len([s for s in para_sentences if s.strip()]),
                "word_count": len(para.split()),
                "avg_sentence_length": len(para.split()) / max(len([s for s in para_sentences if s.strip()]), 1),
                "complexity": self._calculate_text_complexity(para)
            })
        
        return {
            "total_paragraphs": len(paragraphs),
            "total_sentences": len([s for s in sentences if s.strip()]),
            "headings": headings,
            "paragraph_analysis": paragraph_analysis,
            "document_complexity": self._calculate_document_complexity(text),
            "readability_score": self._calculate_readability_score(text)
        }
    
    def _calculate_readability_score(self, text: str) -> Dict[str, float]:
        """Calculate various readability metrics"""
        words = text.split()
        sentences = re.split(r'[.!?]+', text)
        sentences = [s for s in sentences if s.strip()]
        
        if not words or not sentences:
            return {"flesch_reading_ease": 0, "flesch_kincaid_grade": 0}
        
        # Count syllables (simple approximation)
        syllable_count = sum(self._count_syllables(word) for word in words)
        
        # Average sentence length
        avg_sentence_length = len(words) / len(sentences)
        
        # Average syllables per word
        avg_syllables_per_word = syllable_count / len(words)
        
        # Flesch Reading Ease
        flesch_ease = 206.835 - (1.015 * avg_sentence_length) - (84.6 * avg_syllables_per_word)
        
        # Flesch-Kincaid Grade Level
        flesch_grade = (0.39 * avg_sentence_length) + (11.8 * avg_syllables_per_word) - 15.59
        
        return {
            "flesch_reading_ease": round(max(0, min(100, flesch_ease)), 1),
            "flesch_kincaid_grade": round(max(0, flesch_grade), 1),
            "avg_sentence_length": round(avg_sentence_length, 1),
            "avg_syllables_per_word": round(avg_syllables_per_word, 2)
        }
    
    def _count_syllables(self, word: str) -> int:
        """Simple syllable counting"""
        word = word.lower()
        if not word:
            return 0
        
        vowels = "aeiouy"
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            is_vowel = char in vowels
            if is_vowel and not prev_was_vowel:
                syllable_count += 1
            prev_was_vowel = is_vowel
        
        # Handle silent e
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        return max(1, syllable_count)
    
    # Helper methods for various analyses
    def _get_entity_context(self, ent, doc) -> str:
        """Get context around entity"""
        start = max(0, ent.start - 3)
        end = min(len(doc), ent.end + 3)
        return " ".join([token.text for token in doc[start:end]])
    
    def _get_canonical_form(self, ent) -> str:
        """Get canonical form of entity"""
        return ent.text.title() if ent.label_ in ["PERSON", "ORG", "GPE"] else ent.text
    
    def _infer_gender(self, name: str) -> str:
        """Simple gender inference for names"""
        # This is a simplified implementation
        male_indicators = ['mr.', 'mr', 'sir', 'king', 'prince', 'duke']
        female_indicators = ['mrs.', 'mrs', 'ms.', 'ms', 'miss', 'queen', 'princess', 'duchess']
        
        name_lower = name.lower()
        for indicator in male_indicators:
            if indicator in name_lower:
                return "male"
        for indicator in female_indicators:
            if indicator in name_lower:
                return "female"
        
        return "unknown"
    
    def _parse_temporal_entity(self, text: str) -> Dict[str, Any]:
        """Parse temporal expressions"""
        return {
            "normalized_form": text,
            "type": "date" if re.search(r'\d{4}', text) else "relative",
            "precision": "day" if re.search(r'\d{1,2}', text) else "year"
        }
    
    # Additional helper methods would be implemented here...
    
    def batch_analyze_advanced(self, texts: List[str], options: Dict[str, Any] = None) -> Dict[str, Any]:
        """Advanced batch analysis with cross-document insights"""
        if not options:
            options = {
                "include_entities": True,
                "include_keywords": True,
                "include_sentiment": True,
                "include_topics": True,
                "include_similarity": True,
                "include_structure": True
            }
        
        results = []
        all_entities = []
        all_keywords = []
        all_sentiments = []
        
        # Analyze each text
        for i, text in enumerate(texts):
            analysis = {"text_index": i, "text_length": len(text)}
            
            if options.get("include_entities"):
                entities = self.enhanced_entity_recognition(text)
                analysis["entities"] = entities
                all_entities.extend(entities)
            
            if options.get("include_keywords"):
                keywords = self.advanced_keyword_extraction(text)
                analysis["keywords"] = keywords
                all_keywords.extend(keywords)
            
            if options.get("include_sentiment"):
                sentiment = self.advanced_sentiment_analysis(text)
                analysis["sentiment"] = sentiment
                all_sentiments.append(sentiment)
            
            if options.get("include_structure"):
                structure = self.document_structure_analysis(text)
                analysis["structure"] = structure
            
            results.append(analysis)
        
        # Cross-document analysis
        cross_analysis = {}
        
        if options.get("include_topics") and len(texts) > 1:
            cross_analysis["topics"] = self.topic_modeling(texts)
        
        if options.get("include_similarity") and len(texts) > 1:
            similarities = []
            for i in range(len(texts)):
                for j in range(i + 1, len(texts)):
                    sim = self.text_similarity(texts[i], texts[j])
                    similarities.append({
                        "text1_index": i,
                        "text2_index": j,
                        "similarity": sim
                    })
            cross_analysis["similarities"] = similarities
        
        # Aggregate statistics
        aggregated = self._aggregate_advanced_results(results, all_entities, all_keywords, all_sentiments)
        
        return {
            "individual_results": results,
            "cross_document_analysis": cross_analysis,
            "aggregated_results": aggregated,
            "total_texts": len(texts)
        }

# Global instance
advanced_text_analyzer = AdvancedTextAnalyzer()