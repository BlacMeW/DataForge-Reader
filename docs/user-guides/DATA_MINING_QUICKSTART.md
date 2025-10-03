# 🎯 Quick Start: Using Data Mining Feature

## Overview
The Data Mining feature uses advanced Natural Language Processing (NLP) to analyze text and extract insights like entities, keywords, sentiment, and statistics.

---

## 📋 Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend running on `http://localhost:5173`
3. A document uploaded and parsed (to have paragraphs available)

---

## 🚀 Step-by-Step Guide

### Step 1: Upload a Document
1. Go to **File Upload** view (or press `Ctrl+1`)
2. Click **Choose File** and select a PDF or DOCX
3. Click **Upload** button
4. Wait for parsing to complete

### Step 2: Access Data Mining
**Option A**: Click the purple **Data Mining** button in the header
**Option B**: Press `Ctrl+4` keyboard shortcut

The Data Mining modal will appear!

### Step 3: Choose Your Text
You have two options:

#### Option A: Select from Paragraphs
1. Keep the "Select from paragraphs" radio button selected (default)
2. Click the dropdown menu
3. Choose a paragraph from the list
   - Format: "Paragraph X (Page Y) - Preview..."
4. Click **Analyze Text** button

#### Option B: Enter Custom Text
1. Click the "Enter custom text" radio button
2. Type or paste your text in the textarea
3. Minimum ~50 characters recommended
4. Click **Analyze Text** button

### Step 4: Wait for Analysis
- A loading spinner appears: "Analyzing..."
- Typical processing time: 1-3 seconds
- Large texts (>5000 words) may take longer

### Step 5: Explore Results
Navigate through the 4 tabs:

#### 🏷️ Entities Tab (Default)
**What you see:**
- Color-coded badges for each entity found
- Entity text in bold + label in small badge
- Example: "**John Smith** PERSON" in blue

**Entity Types:**
- 🔵 PERSON - Names of people (blue)
- 🟣 ORG - Organizations (purple)
- 🟢 GPE - Countries, cities, states (green)
- 🟠 DATE - Dates and times (orange)
- 💚 MONEY - Monetary values (emerald)
- 💜 PRODUCT - Product names (pink)
- 🔷 TIME - Time expressions (cyan)
- 🔴 PERCENT - Percentages (red)
- 🟦 CARDINAL - Numbers (indigo)

**Example:**
```
Apple Inc. released iPhone 15 on September 12, 2023 for $799
```
Entities found:
- Apple Inc. (ORG, purple)
- iPhone 15 (PRODUCT, pink)
- September 12, 2023 (DATE, orange)
- $799 (MONEY, emerald)

#### 🔑 Keywords Tab
**What you see:**
- Ranked list (1-10) of most important keywords
- Type badge: NOUN or PHRASE
- Horizontal bar showing relevance score

**Example:**
```
1. machine learning  [PHRASE] ████████████ 0.95
2. artificial intelligence [PHRASE] ██████████ 0.87
3. neural network [PHRASE] ████████ 0.76
...
```

**Use Cases:**
- Quick document summarization
- Topic identification
- SEO keyword research
- Content categorization

#### ❤️ Sentiment Tab
**What you see:**
- Large sentiment indicator:
  - ✓ for Positive (green background)
  - ✗ for Negative (red background)
  - ~ for Neutral (orange background)
- Sentiment label (Positive/Negative/Neutral)
- Score value (-1.0 to +1.0)
- Confidence percentage
- Two cards showing:
  - Positive Indicators count (green)
  - Negative Indicators count (red)

**Interpretation:**
- **Score > 0.1**: Positive
- **Score < -0.1**: Negative
- **Score between -0.1 and 0.1**: Neutral
- **Confidence**: How certain the model is (0-100%)

**Example:**
```
✓ Positive
Score: 0.456 | Confidence: 78%

Positive Indicators: 12
Negative Indicators: 3
```

#### 📊 Stats Tab
**What you see:**
- 6 metric cards with emoji icons:
  - 📝 Word count
  - 🔤 Character count
  - 📄 Sentence count
  - ✨ Unique words
  - 📏 Average word length
  - 🎯 Lexical diversity (percentage)

- Extracted data section:
  - **Numbers found**: All numeric values
  - **Currencies**: Dollar amounts, prices, etc.
  - **Percentages**: All percentage values

**Example:**
```
📝 Words: 1,234
🔤 Characters: 6,789
📄 Sentences: 45
✨ Unique Words: 567
📏 Avg Word Length: 5.2
🎯 Lexical Diversity: 45.9%

Extracted Data:
Numbers found: 42, 1000, 2023
Currencies: $799, $1,299
Percentages: 25%, 50%, 75%
```

### Step 6: Analyze More Text
1. Simply select a different paragraph or enter new text
2. Click **Analyze Text** again
3. Results update immediately

### Step 7: Close
- Click the **X** button in top-right corner
- Modal closes and you return to main view

---

## 💡 Tips & Tricks

### For Best Results:
1. **Text Length**: 
   - Minimum: 50 words for meaningful analysis
   - Optimal: 200-500 words
   - Maximum: No hard limit, but >5000 may be slow

2. **Entity Recognition**:
   - Works best with proper nouns (capitalized)
   - Handles various name formats
   - Recognizes dates in multiple formats

3. **Keyword Extraction**:
   - More effective with longer text
   - Focuses on noun phrases
   - Removes common stopwords automatically

4. **Sentiment Analysis**:
   - Requires context for accuracy
   - Works better with complete sentences
   - Considers positive/negative word balance

### Use Cases:

#### 📄 Document Analysis
- Summarize long reports
- Extract key information
- Identify main topics

#### 📊 Content Research
- Analyze competitor content
- Find trending keywords
- Evaluate content quality

#### 💼 Business Intelligence
- Extract business entities (companies, products)
- Identify monetary values
- Track dates and deadlines

#### 📚 Academic Research
- Extract citations and references
- Identify research topics
- Analyze paper sentiment

#### 📰 News Monitoring
- Track people and organizations
- Extract key facts (who, what, when, where)
- Gauge article sentiment

---

## 🎯 Quick Reference

### Keyboard Shortcuts
- `Ctrl+4` - Open Data Mining modal
- `Ctrl+1` - Go to File Upload
- `Ctrl+2` - Go to Projects
- `Ctrl+3` - Go to Templates
- `Ctrl+H` - Show all shortcuts

### Tab Navigation
Click tabs or use your preference:
1. Entities - See recognized entities
2. Keywords - View top keywords
3. Sentiment - Check overall sentiment
4. Stats - Review text statistics

### API Endpoint
The component uses:
```
POST http://localhost:8000/api/mine/analyze
```

---

## ⚠️ Troubleshooting

### "Please enter or select text to analyze"
**Solution**: Select a paragraph from dropdown or enter text in the textarea

### "No entities found in this text"
**Solution**: Try text with more proper nouns (names, places, organizations)

### "No keywords extracted"
**Solution**: Text too short or too generic. Use longer, more specific text

### Analysis taking too long
**Solution**: 
- Check backend server is running
- Reduce text length if >5000 words
- Check network connection

### Modal doesn't appear
**Solution**:
- Ensure you've parsed a document first (paragraphs must exist)
- Check browser console for errors
- Refresh the page

---

## 🔗 Related Features

### Export Integration (Coming Soon)
- Export analysis results to JSON
- Include entities, keywords in export
- Batch analysis of multiple documents

### ParseViewer Integration (Coming Soon)
- Inline entity highlighting in paragraphs
- Click entity to see all occurrences
- Filter paragraphs by sentiment

### Project Analytics (Coming Soon)
- Project-wide entity tracking
- Keyword trend analysis
- Multi-document sentiment comparison

---

## 📞 Need Help?

1. **User Guide**: Press `F1` to open comprehensive documentation
2. **Keyboard Shortcuts**: Press `Ctrl+H` for command reference
3. **API Health**: Check backend at `http://localhost:8000/api/mine/health`

---

**Happy Mining! 🎉**

Discover insights hidden in your text with AI-powered NLP analysis!
