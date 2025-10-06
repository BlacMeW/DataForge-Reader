#!/usr/bin/env python3
"""
Simple script to upload a CSV dataset to the backend's indexing endpoint.
Adjust the BACKEND_URL and file path as needed for local testing.
"""
import requests
import os
import sys
import time
import json

BACKEND_URL = os.environ.get('DATAFORGE_BACKEND', 'http://localhost:8000')
UPLOAD_ENDPOINT = '/api/upload'
INDEX_ENDPOINT = '/api/rag/index-dataset-file'

CSV_PATH = os.path.join(os.path.dirname(__file__), '..', 'dataset_exports', 'sample_dataset_small.csv')
CSV_PATH = os.path.abspath(CSV_PATH)

if not os.path.exists(CSV_PATH):
    print('CSV file not found:', CSV_PATH)
    sys.exit(1)

upload_url = BACKEND_URL.rstrip('/') + UPLOAD_ENDPOINT
index_url = BACKEND_URL.rstrip('/') + INDEX_ENDPOINT
print('Uploading', CSV_PATH, 'to', upload_url)

with open(CSV_PATH, 'rb') as f:
    files = {'file': ('sample_dataset_small.csv', f, 'text/csv')}
    try:
        uresp = requests.post(upload_url, files=files, timeout=60)
        uresp.raise_for_status()
        print('Upload success:', uresp.status_code)
        upload_body = uresp.json()
        file_id = upload_body.get('file_id')
        print('Received file_id:', file_id)
        if not file_id:
            print('Upload did not return file_id; aborting')
            sys.exit(2)

        # Call RAG index endpoint with the returned file_id
        iresp = requests.post(index_url, json={'file_id': file_id, 'dataset_name': 'Sample Dataset'}, timeout=60)
        if not iresp.ok:
            print('Index request failed:', iresp.status_code, iresp.text)
            sys.exit(2)
        print('Index request accepted:')
        try:
            print(iresp.json())
        except Exception:
            print(iresp.text)

    except requests.RequestException as e:
        print('Upload request failed:', e)
        sys.exit(2)


print('\nPolling /api/rag/stats for indexed documents (timeout 60s)...')
stats_url = BACKEND_URL.rstrip('/') + '/api/rag/stats'
deadline = time.time() + 60
docs_found = False
while time.time() < deadline:
    try:
        sresp = requests.get(stats_url, timeout=10)
        if sresp.ok:
            obj = sresp.json()
            stats = obj.get('stats') or obj
            total = stats.get('total_documents') if isinstance(stats, dict) else None
            print('stats:', stats)
            if total and total > 0:
                docs_found = True
                break
    except Exception as e:
        print('stats check failed:', e)
    time.sleep(2)

if not docs_found:
    print('Timed out waiting for indexing. If backend queues indexing, wait a bit and re-run checks.')
    sys.exit(0)

print('\nRunning sample search and context requests...')
search_url = BACKEND_URL.rstrip('/') + '/api/rag/search'
context_url = BACKEND_URL.rstrip('/') + '/api/rag/context'

sample_query = 'quick brown fox'
try:
    sresp = requests.post(search_url, json={'query': sample_query, 'topK': 5, 'threshold': 0.1, 'searchIn': 'fullText'}, timeout=30)
    if sresp.ok:
        print('\nSearch response:')
        print(json.dumps(sresp.json(), indent=2))
    else:
        print('Search failed:', sresp.status_code, sresp.text)
except Exception as e:
    print('Search request error:', e)

try:
    creq = {'query': sample_query, 'topK': 5, 'threshold': 0.1, 'searchIn': 'fullText'}
    cresp = requests.post(context_url, json=creq, timeout=30)
    if cresp.ok:
        print('\nContext response:')
        print(json.dumps(cresp.json(), indent=2))
    else:
        print('Context failed:', cresp.status_code, cresp.text)
except Exception as e:
    print('Context request error:', e)
