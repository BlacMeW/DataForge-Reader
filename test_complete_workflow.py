#!/usr/bin/env python3
"""
Complete workflow test: Upload -> Parse -> Export
"""

import requests
import json
import os
import time

BASE_URL = "http://localhost:8000"

def test_complete_workflow():
    print("🚀 Testing Complete DataForge Reader Workflow")
    print("=" * 60)
    
    # Create a test file
    test_content = """This is a test document.
    
    It contains multiple paragraphs for testing the DataForge Reader export functionality.
    
    This paragraph contains some sample text that can be used for machine learning dataset creation.
    
    The export system should be able to generate both CSV and JSONL formats from this content."""
    
    test_file_path = "/tmp/test_document.txt"
    with open(test_file_path, 'w') as f:
        f.write(test_content)
    
    print(f"✅ Created test file: {test_file_path}")
    
    # Step 1: Upload file
    print("\n1. Testing file upload...")
    try:
        with open(test_file_path, 'rb') as f:
            files = {'file': ('test_document.txt', f, 'text/plain')}
            upload_response = requests.post(f"{BASE_URL}/api/upload/file", files=files)
        
        if upload_response.status_code == 200:
            upload_result = upload_response.json()
            file_id = upload_result['file_id']
            print(f"✅ Upload successful! File ID: {file_id}")
        else:
            print(f"❌ Upload failed: {upload_response.status_code}")
            print(f"   Error: {upload_response.text}")
            return
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return
    
    # Step 2: Parse file
    print(f"\n2. Testing file parsing...")
    try:
        parse_request = {
            "file_id": file_id,
            "use_ocr": False
        }
        parse_response = requests.post(f"{BASE_URL}/api/parse", json=parse_request)
        
        if parse_response.status_code == 200:
            parse_result = parse_response.json()
            paragraphs = parse_result.get('paragraphs', [])
            print(f"✅ Parse successful! Found {len(paragraphs)} paragraphs")
            
            # Show sample paragraph
            if paragraphs:
                sample = paragraphs[0]
                print(f"   Sample paragraph: {sample.get('text', '')[:100]}...")
        else:
            print(f"❌ Parse failed: {parse_response.status_code}")
            print(f"   Error: {parse_response.text}")
            return
    except Exception as e:
        print(f"❌ Parse error: {e}")
        return
    
    # Step 3: Export to CSV
    print(f"\n3. Testing CSV export...")
    try:
        export_request = {
            "file_id": file_id,
            "format": "csv",
            "include_annotations": False
        }
        export_response = requests.post(f"{BASE_URL}/api/export", json=export_request)
        
        if export_response.status_code == 200:
            export_result = export_response.json()
            print(f"✅ CSV export successful!")
            print(f"   Filename: {export_result.get('filename')}")
            print(f"   Record count: {export_result.get('record_count')}")
            
            # Test download
            if export_result.get('download_url'):
                download_url = f"{BASE_URL}{export_result['download_url']}"
                download_response = requests.get(download_url)
                if download_response.status_code == 200:
                    print(f"   ✅ CSV download successful!")
                    print(f"   Content preview (first 200 chars):")
                    print(f"   {download_response.text[:200]}")
                    
                    # Save to file for inspection
                    csv_file = f"/tmp/export_{file_id}.csv"
                    with open(csv_file, 'w') as f:
                        f.write(download_response.text)
                    print(f"   📁 Saved to: {csv_file}")
                else:
                    print(f"   ❌ CSV download failed: {download_response.status_code}")
        else:
            print(f"❌ CSV export failed: {export_response.status_code}")
            print(f"   Error: {export_response.text}")
    except Exception as e:
        print(f"❌ CSV export error: {e}")
    
    # Step 4: Export to JSONL
    print(f"\n4. Testing JSONL export...")
    try:
        export_request = {
            "file_id": file_id,
            "format": "jsonl",
            "include_annotations": False
        }
        export_response = requests.post(f"{BASE_URL}/api/export", json=export_request)
        
        if export_response.status_code == 200:
            export_result = export_response.json()
            print(f"✅ JSONL export successful!")
            print(f"   Filename: {export_result.get('filename')}")
            print(f"   Record count: {export_result.get('record_count')}")
            
            # Test download
            if export_result.get('download_url'):
                download_url = f"{BASE_URL}{export_result['download_url']}"
                download_response = requests.get(download_url)
                if download_response.status_code == 200:
                    print(f"   ✅ JSONL download successful!")
                    print(f"   Content preview (first 200 chars):")
                    print(f"   {download_response.text[:200]}")
                    
                    # Save to file for inspection
                    jsonl_file = f"/tmp/export_{file_id}.jsonl"
                    with open(jsonl_file, 'w') as f:
                        f.write(download_response.text)
                    print(f"   📁 Saved to: {jsonl_file}")
                else:
                    print(f"   ❌ JSONL download failed: {download_response.status_code}")
        else:
            print(f"❌ JSONL export failed: {export_response.status_code}")
            print(f"   Error: {export_response.text}")
    except Exception as e:
        print(f"❌ JSONL export error: {e}")
    
    # Step 5: Check dataset exports directory
    print(f"\n5. Checking dataset exports directory...")
    export_dir = "/DATA/LLM_Projs/TestArea/DataForge-Reader/dataset_exports"
    if os.path.exists(export_dir):
        files = os.listdir(export_dir)
        print(f"✅ Export directory contains {len(files)} files:")
        for file in files:
            file_path = os.path.join(export_dir, file)
            size = os.path.getsize(file_path)
            print(f"   - {file} ({size} bytes)")
    else:
        print(f"❌ Export directory not found: {export_dir}")
    
    print("\n" + "=" * 60)
    print("🎉 Complete workflow test finished!")

if __name__ == "__main__":
    # Wait for server
    print("Waiting for server to be ready...")
    time.sleep(3)
    
    test_complete_workflow()