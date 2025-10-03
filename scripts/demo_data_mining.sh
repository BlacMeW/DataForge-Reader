#!/bin/bash

# DataForge-Reader: Data Mining Feature Demo Script
# This script demonstrates the new NLP-powered Data Mining feature

set -e  # Exit on error

echo "========================================"
echo "DataForge-Reader: Data Mining Demo"
echo "========================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Check if backend is running
echo -e "${BLUE}[1/5] Checking Backend Status...${NC}"
if curl -s http://localhost:8000/api/mine/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo "❌ Backend is not running. Please start it first:"
    echo "   cd backend && python main.py"
    exit 1
fi

# Check if frontend is running
echo ""
echo -e "${BLUE}[2/5] Checking Frontend Status...${NC}"
if curl -s http://localhost:5173 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo "❌ Frontend is not running. Please start it first:"
    echo "   cd frontend && npm run dev"
    exit 1
fi

# Test the NLP analysis endpoint
echo ""
echo -e "${BLUE}[3/5] Testing NLP Analysis Endpoint...${NC}"

TEST_TEXT="Apple Inc. announced the new iPhone 15 on September 12, 2023. The device will retail for \$799 and includes advanced AI features. CEO Tim Cook stated that this represents a 50% improvement in performance. The company expects strong sales in both the United States and China."

echo "Sample text:"
echo "$TEST_TEXT"
echo ""

# Perform analysis
RESPONSE=$(curl -s -X POST http://localhost:8000/api/mine/analyze \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$TEST_TEXT\",
    \"include_entities\": true,
    \"include_keywords\": true,
    \"include_sentiment\": true,
    \"include_statistics\": true,
    \"include_summary\": true,
    \"top_keywords\": 5
  }")

echo -e "${GREEN}✓ Analysis complete!${NC}"
echo ""

# Parse and display results
echo -e "${PURPLE}[4/5] Analysis Results:${NC}"
echo ""

# Extract entities (simplified display)
echo "🏷️  Named Entities:"
echo "$RESPONSE" | grep -o '"text":"[^"]*","label":"[^"]*"' | head -5 | sed 's/"text":"//g' | sed 's/","label":"/ - /g' | sed 's/"//g' | sed 's/^/  • /'

echo ""

# Extract keywords
echo "🔑 Top Keywords:"
echo "$RESPONSE" | grep -o '"keyword":"[^"]*","score":[0-9.]*' | head -5 | sed 's/"keyword":"//g' | sed 's/","score":/ (score: /g' | sed 's/$/)/g' | sed 's/^/  • /'

echo ""

# Extract sentiment
echo "❤️  Sentiment Analysis:"
SENTIMENT=$(echo "$RESPONSE" | grep -o '"sentiment":"[^"]*"' | head -1 | sed 's/"sentiment":"//g' | sed 's/"//g')
echo "  • Overall: $SENTIMENT"

echo ""

# Extract statistics
echo "📊 Text Statistics:"
WORD_COUNT=$(echo "$RESPONSE" | grep -o '"word_count":[0-9]*' | head -1 | sed 's/"word_count"://g')
echo "  • Word count: $WORD_COUNT"
UNIQUE_WORDS=$(echo "$RESPONSE" | grep -o '"unique_words":[0-9]*' | head -1 | sed 's/"unique_words"://g')
echo "  • Unique words: $UNIQUE_WORDS"

echo ""
echo -e "${PURPLE}[5/5] Frontend Demo:${NC}"
echo ""
echo "✨ The Data Mining feature is now available in the UI!"
echo ""
echo "To use it:"
echo "  1. Open your browser to: http://localhost:5173"
echo "  2. Upload a PDF or DOCX document"
echo "  3. Click the purple 'Data Mining' button (or press Ctrl+4)"
echo "  4. Select a paragraph or enter custom text"
echo "  5. Click 'Analyze Text'"
echo "  6. Explore the 4 tabs:"
echo "     • 🏷️  Entities - Color-coded named entities"
echo "     • 🔑 Keywords - Top 10 ranked keywords"
echo "     • ❤️  Sentiment - Positive/Negative/Neutral analysis"
echo "     • 📊 Stats - Word count, diversity, extracted data"
echo ""
echo -e "${GREEN}========================================"
echo "Demo Complete! ✅"
echo "========================================${NC}"
echo ""
echo "📚 Documentation:"
echo "  • FRONTEND_DATA_MINING.md - Complete implementation guide"
echo "  • DATA_MINING_QUICKSTART.md - User quick start guide"
echo "  • IMPLEMENTATION_SUMMARY.md - Backend NLP details"
echo ""
echo "🚀 Ready to mine your data!"
