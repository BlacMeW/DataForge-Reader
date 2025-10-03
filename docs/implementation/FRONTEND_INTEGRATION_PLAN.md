# 🎨 Frontend Integration Plan - Data Mining Features

**Date:** 2025-10-03  
**Status:** Planning Phase  

---

## 📋 Current Frontend Status

### ✅ What Exists:
- **FileUpload** - Handles PDF/EPUB uploads
- **ParseViewer** - Displays parsed paragraphs with filters
- **DataAnalytics** - Shows basic statistics (word count, page distribution)
- **DatasetTemplateSelector** - Template management
- **ExportButtons** - CSV/JSONL export

### 🆕 What's Missing:
- No integration with new data mining API endpoints
- No NLP features display (entities, keywords, sentiment)
- No text analysis visualization
- No batch analysis interface

---

## 🎯 Implementation Strategy

### Phase 1: Create Data Mining Component (Priority: HIGH)
**File:** `frontend/src/components/DataMining.tsx`

**Features:**
1. **Single Text Analysis**
   - Input: Text area for custom text or select from parsed paragraphs
   - Display: Entities, keywords, sentiment, statistics
   - Visual: Entity highlighting, keyword cloud, sentiment badge

2. **Batch Analysis**
   - Input: Select multiple paragraphs
   - Display: Aggregated results (top entities, keywords, sentiment distribution)
   - Visual: Charts for aggregated data

3. **Entity Visualization**
   - Color-coded entity types
   - Click to see entity details
   - Filter by entity type

4. **Keyword Cloud**
   - Size based on score
   - Interactive (click to filter)

5. **Sentiment Indicator**
   - Visual badge (green/yellow/red)
   - Score display
   - Confidence indicator

### Phase 2: Update ParseViewer (Priority: HIGH)
**File:** `frontend/src/components/ParseViewer.tsx`

**Changes:**
1. Add "Analyze with NLP" button for selected paragraphs
2. Add new tab: "NLP Analysis" (alongside "Content" and "Analytics")
3. Show inline entities when viewing paragraphs
4. Add sentiment badges to paragraph list

### Phase 3: Add API Service Layer (Priority: MEDIUM)
**File:** `frontend/src/services/dataMiningApi.ts`

**Functions:**
```typescript
- analyzeSingleText(text: string, options: AnalysisOptions)
- analyzeBatchTexts(texts: string[], options: AnalysisOptions)
- checkMiningHealth()
```

### Phase 4: Update Main App (Priority: MEDIUM)
**File:** `frontend/src/App.tsx`

**Changes:**
1. Add new view: "Data Mining"
2. Add navigation button for Data Mining
3. Add keyboard shortcut: Ctrl+4

---

## 🎨 UI/UX Design

### Color Scheme for Entities:
- **PERSON** - Blue (#3b82f6)
- **ORG** - Purple (#8b5cf6)
- **GPE** (Location) - Green (#10b981)
- **DATE** - Orange (#f59e0b)
- **MONEY** - Emerald (#059669)
- **PRODUCT** - Pink (#ec4899)
- **Other** - Gray (#6b7280)

### Sentiment Indicators:
- **Positive** - Green badge with ✓
- **Neutral** - Yellow badge with ~
- **Negative** - Red badge with ✗

### Layout:
```
┌─────────────────────────────────────────────────┐
│  Input Section                                  │
│  [Select Paragraph ▼] or [Custom Text Area]    │
│  [Analyze Button]                               │
├─────────────────────────────────────────────────┤
│  Results Tabs:                                  │
│  • Entities  • Keywords  • Sentiment  • Stats  │
├─────────────────────────────────────────────────┤
│  Visual Display:                                │
│  - Entity highlighting                          │
│  - Keyword cloud                                │
│  - Sentiment gauge                              │
│  - Statistics cards                             │
└─────────────────────────────────────────────────┘
```

---

## 📦 Component Structure

```typescript
<DataMining>
  ├── <TextInput>
  │   ├── ParagraphSelector
  │   └── CustomTextArea
  ├── <AnalysisOptions>
  │   ├── EnableEntities
  │   ├── EnableKeywords
  │   ├── EnableSentiment
  │   └── EnableStatistics
  ├── <AnalysisResults>
  │   ├── <EntityDisplay>
  │   │   ├── EntityList
  │   │   └── EntityHighlighter
  │   ├── <KeywordCloud>
  │   ├── <SentimentIndicator>
  │   └── <StatisticsCards>
  └── <BatchAnalysis>
      ├── MultiSelectParagraphs
      ├── AggregatedResults
      └── ComparisonCharts
```

---

## 🔌 API Integration

### Endpoints to Use:
1. `POST /api/mine/analyze` - Single text analysis
2. `POST /api/mine/batch-analyze` - Multiple texts
3. `GET /api/mine/health` - Check service status

### Request/Response Types:

```typescript
interface AnalyzeRequest {
  text: string
  include_entities?: boolean
  include_keywords?: boolean
  include_sentiment?: boolean
  include_statistics?: boolean
  include_summary?: boolean
  top_keywords?: number
}

interface Entity {
  text: string
  label: string
  start: number
  end: number
  confidence: number
}

interface Keyword {
  keyword: string
  score: number
  type: string
}

interface Sentiment {
  sentiment: 'positive' | 'negative' | 'neutral'
  score: number
  confidence: number
  positive_indicators: number
  negative_indicators: number
}

interface AnalyzeResponse {
  text_length: number
  entities?: Entity[]
  keywords?: Keyword[]
  sentiment?: Sentiment
  statistics?: {
    numbers: number[]
    percentages: string[]
    currencies: string[]
    measurements: string[]
  }
  summary?: {
    word_count: number
    char_count: number
    sentence_count: number
    avg_word_length: number
    avg_sentence_length: number
    unique_words: number
    lexical_diversity: number
  }
  language: string
}
```

---

## 📅 Implementation Timeline

### Immediate (Today):
1. ✅ Review current frontend structure
2. ⏳ Create DataMining.tsx component
3. ⏳ Add basic API integration
4. ⏳ Test with sample data

### Short-term (This Week):
1. ⏳ Add entity visualization
2. ⏳ Add keyword cloud
3. ⏳ Add sentiment indicators
4. ⏳ Integrate with ParseViewer

### Medium-term (Next Week):
1. ⏳ Add batch analysis
2. ⏳ Add advanced visualizations
3. ⏳ Polish UI/UX
4. ⏳ Performance optimization

---

## 🧪 Testing Plan

### Manual Tests:
1. Analyze single paragraph - check entities displayed
2. Analyze multiple paragraphs - check aggregation
3. Test sentiment analysis - verify colors/badges
4. Test keyword extraction - verify relevance
5. Test with different text types (technical, casual, formal)

### Edge Cases:
1. Empty text
2. Very long text (>10,000 chars)
3. Non-English text
4. Text with special characters
5. API errors/timeouts

---

## 🎯 Success Criteria

### Functionality:
- ✅ Can analyze single text from any source
- ✅ Can analyze multiple paragraphs in batch
- ✅ All entity types displayed correctly
- ✅ Keywords ranked properly
- ✅ Sentiment accurately reflected

### Performance:
- ✅ Analysis completes in <2 seconds
- ✅ UI remains responsive during analysis
- ✅ Handles errors gracefully

### UX:
- ✅ Intuitive interface
- ✅ Clear visual feedback
- ✅ Helpful tooltips/explanations
- ✅ Mobile responsive (bonus)

---

## 🔧 Technical Considerations

### State Management:
- Use React hooks (useState, useEffect, useMemo)
- Consider Context API if state becomes complex

### Performance:
- Memoize expensive computations
- Debounce API calls
- Cache analysis results

### Error Handling:
- Graceful degradation if API unavailable
- Clear error messages
- Retry mechanism for failed requests

### Accessibility:
- Keyboard navigation
- Screen reader support
- ARIA labels
- Color contrast

---

## 📚 Documentation Needs

1. **User Guide Update** - Add section on Data Mining features
2. **Component Documentation** - JSDoc comments
3. **API Integration Guide** - For developers
4. **Example Use Cases** - Screenshots and walkthroughs

---

**Next Step:** Start implementing DataMining.tsx component!
