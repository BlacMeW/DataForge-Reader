"""
Text Analytics Utilities for Data Mining
Provides NLP-powered analysis: NER, keyword extraction, sentiment analysis, pattern detection
"""

from typing import List, Dict, Any, Optional
import re
from collections import Counter

class TextAnalyzer:
    """Advanced text analysis utilities for data mining"""
    
    def __init__(self):
        try:
            import spacy
            self.nlp = spacy.load("en_core_web_sm")
            self.spacy_available = True
        except:
            print("Warning: spaCy not available, using fallback methods")
            self.nlp = None
            self.spacy_available = False
    
    def extract_entities(self, text: str) -> List[Dict[str, Any]]:
        """Extract named entities with positions"""
        if self.spacy_available and self.nlp:
            return self._extract_entities_spacy(text)
        else:
            return self._extract_entities_regex(text)
    
    def _extract_entities_spacy(self, text: str) -> List[Dict[str, Any]]:
        """Extract entities using spaCy NER"""
        doc = self.nlp(text)
        entities = []
        
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char,
                "confidence": 0.9  # spaCy doesn't provide scores by default
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
                "end": match.end(),
                "confidence": 0.95
            })
        
        # URL pattern
        url_pattern = r'http[s]?://(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*\\(\\),]|(?:%[0-9a-fA-F][0-9a-fA-F]))+'
        for match in re.finditer(url_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "URL",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.95
            })
        
        # Date patterns
        date_pattern = r'\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2},? \d{4}\b'
        for match in re.finditer(date_pattern, text, re.IGNORECASE):
            entities.append({
                "text": match.group(),
                "label": "DATE",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.85
            })
        
        # Phone numbers
        phone_pattern = r'\b(?:\+?1[-.]?)?\(?([0-9]{3})\)?[-.]?([0-9]{3})[-.]?([0-9]{4})\b'
        for match in re.finditer(phone_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "PHONE",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.85
            })
        
        # Money/Currency
        currency_pattern = r'[$£€¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?'
        for match in re.finditer(currency_pattern, text):
            entities.append({
                "text": match.group(),
                "label": "MONEY",
                "start": match.start(),
                "end": match.end(),
                "confidence": 0.9
            })
        
        return entities
    
    def extract_keywords(self, text: str, top_n: int = 10) -> List[Dict[str, Any]]:
        """Extract important keywords using multiple methods"""
        keywords = []
        
        if self.spacy_available and self.nlp:
            doc = self.nlp(text)
            
            # Extract noun phrases
            noun_phrases = [chunk.text.lower() for chunk in doc.noun_chunks if len(chunk.text) > 3]
            phrase_counts = Counter(noun_phrases)
            
            # Extract named entities as keywords
            entity_texts = [ent.text.lower() for ent in doc.ents]
            entity_counts = Counter(entity_texts)
            
            # Combine and score
            all_keywords = {}
            for phrase, count in phrase_counts.most_common(top_n * 2):
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
                    all_keywords[entity]["score"] += count * 0.5
        else:
            # Fallback: simple word frequency with capitalized words
            words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', text)
            word_counts = Counter([w.lower() for w in words])
            
            for word, count in word_counts.most_common(top_n * 2):
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
        if self.spacy_available and self.nlp:
            doc = self.nlp(text[:1000])  # Sample first 1000 chars
            return doc.lang_
        return "en"  # Default to English
    
    def analyze_sentiment(self, text: str) -> Dict[str, Any]:
        """Basic sentiment analysis"""
        # Simple lexicon-based sentiment
        positive_words = {
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 
            'love', 'best', 'perfect', 'beautiful', 'awesome', 'brilliant',
            'outstanding', 'superb', 'magnificent', 'incredible', 'exceptional',
            'positive', 'happy', 'pleased', 'delighted', 'satisfied'
        }
        negative_words = {
            'bad', 'terrible', 'awful', 'horrible', 'worst', 'hate', 'poor',
            'disappointing', 'useless', 'waste', 'broken', 'wrong', 'failed',
            'disappointing', 'negative', 'sad', 'unhappy', 'upset', 'angry',
            'frustrated', 'dissatisfied'
        }
        
        text_lower = text.lower()
        words = set(re.findall(r'\b\w+\b', text_lower))
        
        positive_count = len(words & positive_words)
        negative_count = len(words & negative_words)
        
        total = positive_count + negative_count
        if total == 0:
            return {
                "sentiment": "neutral",
                "score": 0.0,
                "confidence": 0.5,
                "positive_indicators": 0,
                "negative_indicators": 0
            }
        
        score = (positive_count - negative_count) / total
        
        if score > 0.2:
            sentiment = "positive"
        elif score < -0.2:
            sentiment = "negative"
        else:
            sentiment = "neutral"
        
        return {
            "sentiment": sentiment,
            "score": round(score, 3),
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
        numbers = [match.group() for match in re.finditer(number_pattern, text)]
        stats["numbers"] = [float(n.replace(',', '')) for n in numbers[:20]]  # Limit to 20
        
        # Extract percentages
        percentage_pattern = r'\b\d+(?:\.\d+)?%'
        stats["percentages"] = [m.group() for m in re.finditer(percentage_pattern, text)]
        
        # Extract currency values
        currency_pattern = r'[$£€¥]\s*\d+(?:,\d{3})*(?:\.\d{2})?'
        stats["currencies"] = [m.group() for m in re.finditer(currency_pattern, text)]
        
        # Extract measurements
        measurement_pattern = r'\b\d+(?:\.\d+)?\s*(?:kg|g|lb|oz|km|m|cm|mm|ft|in|L|ml|gal|GB|MB|KB)\b'
        stats["measurements"] = [m.group() for m in re.finditer(measurement_pattern, text, re.IGNORECASE)]
        
        return stats
    
    def get_text_summary(self, text: str) -> Dict[str, Any]:
        """Get comprehensive text summary"""
        words = text.split()
        
        # Count sentences - use spaCy if available, otherwise simple count
        if self.spacy_available and self.nlp:
            # Use spaCy for sentence splitting
            doc = self.nlp(text)
            sentences = list(doc.sents)
            sentence_count = len(sentences)
        else:
            # Fallback: count likely sentence endings (punctuation at end of text or followed by capital)
            # But be conservative - don't split on abbreviations
            import re
            # Simple approach: split on punctuation followed by space and capital letter, or end of text
            parts = re.split(r'([.!?]+)\s*', text)
            sentence_count = 1
            i = 0
            while i < len(parts) - 1:
                if parts[i+1] in ['.', '!', '?']:
                    # Check if followed by capital letter
                    remaining = ''.join(parts[i+2:])
                    remaining = remaining.lstrip()
                    if not remaining or remaining[0].isupper():
                        sentence_count += 1
                i += 2
        
        return {
            "word_count": len(words),
            "char_count": len(text),
            "sentence_count": sentence_count,
            "avg_word_length": round(sum(len(w) for w in words) / max(len(words), 1), 2),
            "avg_sentence_length": round(len(words) / max(sentence_count, 1), 2),
            "unique_words": len(set(w.lower() for w in words)),
            "lexical_diversity": round(len(set(w.lower() for w in words)) / max(len(words), 1), 3)
        }

# Global instance
text_analyzer = TextAnalyzer()
