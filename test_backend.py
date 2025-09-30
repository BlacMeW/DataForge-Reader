#!/usr/bin/env python3
"""
Quick test script for DataForge Reader backend
"""
import requests
import json
import time
import subprocess
import os

def start_backend():
    """Start the backend server"""
    print("Starting backend server...")
    os.chdir("/DATA/LLM_Projs/TestArea/DataForge-Reader")
    subprocess.Popen([
        "bash", "-c", 
        "source .venv/bin/activate && uvicorn backend.main:app --host 0.0.0.0 --port 8000"
    ])
    time.sleep(3)

def test_backend():
    """Test backend endpoints"""
    base_url = "http://localhost:8000"
    
    # Test health
    try:
        response = requests.get(f"{base_url}/")
        print(f"✅ Health check: {response.json()}")
    except Exception as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test uploads list
    try:
        response = requests.get(f"{base_url}/api/uploads")
        print(f"✅ Uploads endpoint: {response.status_code}")
        print(f"   Response: {response.json()}")
    except Exception as e:
        print(f"❌ Uploads endpoint failed: {e}")
        return False
    
    return True

def main():
    start_backend()
    if test_backend():
        print("\n🚀 Backend is working! You can now:")
        print("1. Open http://localhost:5173 for frontend")
        print("2. Upload PDF/EPUB files")
        print("3. Extract text and create datasets")
    else:
        print("\n❌ Backend tests failed")

if __name__ == "__main__":
    main()