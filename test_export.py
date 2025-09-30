#!/usr/bin/env python3
"""
Test script for DataForge Reader export functionality
"""

import requests
import json
import time
import os

BASE_URL = "http://localhost:8000"

def test_export_functionality():
    print("🧪 Testing DataForge Reader Export System")
    print("=" * 50)
    
    # First, we need to simulate some parsed data for testing
    # Since the export function expects parsed data to exist
    
    # Test 1: Test export endpoint with minimal data
    print("\n1. Testing export endpoint...")
    test_file_id = "test_file_123"
    
    # Create a simple export request
    export_request = {
        "file_id": test_file_id,
        "format": "csv",
        "include_annotations": False
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/export", json=export_request)
        print(f"Export response status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Export request successful:")
            print(f"   Filename: {result.get('filename')}")
            print(f"   Format: {result.get('format')}")
            print(f"   Record count: {result.get('record_count')}")
            print(f"   Download URL: {result.get('download_url')}")
            
            # Test download
            if result.get('download_url'):
                download_url = f"{BASE_URL}{result['download_url']}"
                print(f"\n   Testing download from: {download_url}")
                
                download_response = requests.get(download_url)
                if download_response.status_code == 200:
                    print(f"   ✅ Download successful, got {len(download_response.text)} characters")
                    print(f"   Content preview: {download_response.text[:200]}...")
                else:
                    print(f"   ❌ Download failed: {download_response.status_code}")
                    print(f"   Error: {download_response.text}")
        else:
            print(f"❌ Export failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error testing export: {e}")
    
    # Test 2: Test JSONL format
    print("\n2. Testing JSONL export...")
    jsonl_request = {
        "file_id": test_file_id,
        "format": "jsonl",
        "include_annotations": False
    }
    
    try:
        response = requests.post(f"{BASE_URL}/api/export", json=jsonl_request)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ JSONL export successful: {result.get('filename')}")
        else:
            print(f"❌ JSONL export failed: {response.status_code}")
            print(f"   Error: {response.text}")
    except Exception as e:
        print(f"❌ Error testing JSONL export: {e}")
    
    # Test 3: Check if export directory exists
    print("\n3. Checking export directory...")
    export_dir = "/DATA/LLM_Projs/TestArea/DataForge-Reader/dataset_exports"
    if os.path.exists(export_dir):
        files = os.listdir(export_dir)
        print(f"✅ Export directory exists with {len(files)} files:")
        for file in files[:5]:  # Show first 5 files
            print(f"   - {file}")
        if len(files) > 5:
            print(f"   ... and {len(files) - 5} more files")
    else:
        print(f"❌ Export directory not found: {export_dir}")
    
    # Test 4: Test direct GET download
    print("\n4. Testing direct download endpoint...")
    try:
        download_url = f"{BASE_URL}/api/export/{test_file_id}?format=csv&include_annotations=false"
        response = requests.get(download_url)
        print(f"Direct download status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"✅ Direct download successful")
            print(f"   Content-Type: {response.headers.get('content-type')}")
            print(f"   Content-Disposition: {response.headers.get('content-disposition')}")
        else:
            print(f"❌ Direct download failed: {response.text}")
    except Exception as e:
        print(f"❌ Error testing direct download: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Export system test completed!")

if __name__ == "__main__":
    # Wait a moment for server to be ready
    print("Waiting for server to start...")
    time.sleep(2)
    
    test_export_functionality()