#!/usr/bin/env python3
"""
Test script for DataForge Reader template system
"""

import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_templates():
    print("🧪 Testing DataForge Reader Template System")
    print("=" * 50)
    
    # Test 1: Get predefined templates
    print("\n1. Testing predefined templates...")
    try:
        response = requests.get(f"{BASE_URL}/api/dataset/templates")
        if response.status_code == 200:
            templates = response.json()
            print(f"✅ Found {templates['count']} predefined templates:")
            for template in templates['templates']:
                print(f"   - {template['name']} ({template['task_type']})")
        else:
            print(f"❌ Failed to get templates: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    
    # Test 2: Get specific template
    print("\n2. Testing specific template retrieval...")
    try:
        response = requests.get(f"{BASE_URL}/api/dataset/templates/sentiment_analysis")
        if response.status_code == 200:
            template = response.json()
            print(f"✅ Retrieved template: {template['name']}")
            print(f"   Fields: {len(template['fields'])}")
            print(f"   Annotation type: {template['annotation_schema']['type']}")
        else:
            print(f"❌ Failed to get specific template: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 3: Create custom template
    print("\n3. Testing custom template creation...")
    custom_template = {
        "name": "Test Custom Template",
        "description": "A test template for validation",
        "fields": [
            {
                "name": "text",
                "type": "string",
                "description": "Input text",
                "optional": False
            },
            {
                "name": "category",
                "type": "categorical",
                "description": "Category label",
                "options": ["A", "B", "C"],
                "optional": False
            }
        ],
        "annotation_schema": {
            "type": "single_choice",
            "options": ["A", "B", "C"],
            "instructions": "Select the appropriate category"
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/dataset/templates/custom",
            json=custom_template
        )
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Created custom template: {result['template']['name']}")
            print(f"   ID: {result['template']['id']}")
        elif response.status_code == 422:
            print(f"❌ Validation error: {response.json()}")
        else:
            print(f"❌ Failed to create custom template: {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    # Test 4: Get export sample
    print("\n4. Testing export sample...")
    try:
        response = requests.get(f"{BASE_URL}/api/dataset/templates/sentiment_analysis/export-sample")
        if response.status_code == 200:
            sample = response.json()
            print(f"✅ Retrieved export sample:")
            print(f"   Sample data: {sample['sample_data']}")
            print(f"   Format: {sample['format']}")
        else:
            print(f"❌ Failed to get export sample: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {e}")
    
    print("\n" + "=" * 50)
    print("✅ Template system test completed!")
    return True

if __name__ == "__main__":
    # Wait a moment for server to be ready
    print("Waiting for server to start...")
    time.sleep(2)
    
    test_templates()