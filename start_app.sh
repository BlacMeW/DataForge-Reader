#!/bin/bash

# DataForge Reader - Full Stack ML Dataset Creation Tool
# Start script for development

echo "🚀 Starting DataForge Reader"
echo "============================="

# Start backend
echo "📡 Starting backend server..."
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend
echo "🌐 Starting frontend server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ DataForge Reader is starting up!"
echo ""
echo "📍 Access points:"
echo "   Frontend: http://localhost:5173"
echo "   Backend API: http://localhost:8000"
echo "   API Docs: http://localhost:8000/docs"
echo ""
echo "🔧 Features available:"
echo "   • File Upload (PDF/EPUB)"
echo "   • Text Parsing & Extraction"
echo "   • ML Dataset Templates (5 predefined)"
echo "   • Custom Template Designer"
echo "   • Annotation System"
echo "   • Dataset Export (CSV/JSONL)"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Wait for user to stop
trap "echo 'Stopping servers...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait