#!/bin/bash
# Startup script for DataForge Reader

echo "🚀 Starting DataForge Reader..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is required but not installed."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is required but not installed."
    exit 1
fi

# Function to start backend
start_backend() {
    echo "📦 Starting FastAPI backend..."
    
    # Install Python dependencies if requirements.txt exists
    if [ -f "backend/requirements.txt" ]; then
        echo "📦 Installing Python dependencies..."
        cd backend
        pip install -r requirements.txt
        cd ..
    fi
    
    # Start FastAPI server from project root
    echo "🔧 Starting FastAPI server on http://localhost:8000"
    python -m uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000 &
    BACKEND_PID=$!
}

# Function to start frontend
start_frontend() {
    echo "⚛️  Starting React frontend..."
    
    # Install Node dependencies if package.json exists
    if [ -f "frontend/package.json" ]; then
        echo "📦 Installing Node.js dependencies..."
        cd frontend
        npm install
        cd ..
    fi
    
    # Start React development server
    echo "🔧 Starting React development server on http://localhost:5173"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..
}

# Start both services
start_backend
sleep 3
start_frontend

echo ""
echo "✅ DataForge Reader is running!"
echo "🌐 Frontend: http://localhost:5173"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for user interrupt
trap 'echo "🛑 Stopping services..."; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit' INT
wait