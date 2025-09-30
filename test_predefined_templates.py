#!/usr/bin/env python3
"""
Test the predefined dataset templates functionality
"""

import requests
import json

def test_templates():
    print("🧪 Testing Predefined Dataset Templates")
    print("=" * 50)
    
    BASE_URL = "http://localhost:8000"
    
    # Test 1: Get all templates
    print("1. Testing template endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/api/dataset/templates")
        if response.status_code == 200:
            data = response.json()
            templates = data.get('templates', [])
            count = data.get('count', 0)
            
            print(f"✅ Found {count} predefined templates:")
            for template in templates:
                print(f"   - {template['name']} ({template['task_type']})")
                print(f"     Description: {template['description']}")
                print(f"     Fields: {len(template['fields'])} fields")
                print()
                
            if count >= 5:
                print("✅ All 5 expected templates are present")
            else:
                print(f"⚠️ Expected 5 templates, found {count}")
                
        else:
            print(f"❌ Template endpoint failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Error connecting to backend: {e}")
        print("Make sure the backend server is running on port 8000")
    
    # Test 2: Test specific template
    print("\n2. Testing specific template...")
    try:
        response = requests.get(f"{BASE_URL}/api/dataset/templates/sentiment_analysis")
        if response.status_code == 200:
            template = response.json()
            print(f"✅ Retrieved specific template: {template['name']}")
            print(f"   Task type: {template['task_type']}")
            print(f"   Annotation type: {template['annotation_schema']['type']}")
        else:
            print(f"❌ Specific template failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error getting specific template: {e}")
    
    # Test 3: Check frontend accessibility
    print("\n3. Testing frontend accessibility...")
    try:
        response = requests.get("http://localhost:5173")
        if response.status_code == 200:
            print("✅ Frontend server is running on port 5173")
        else:
            print(f"⚠️ Frontend server response: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend server not accessible: {e}")
        print("Make sure to run 'npm run dev' in the frontend directory")
    
    print("\n" + "=" * 50)
    print("Template test completed!")
    print("\nTo access the templates in the web interface:")
    print("1. Open http://localhost:5173 in your browser")
    print("2. Click the 'Templates' button in the header")
    print("3. You should see 5 predefined templates")

if __name__ == "__main__":
    test_templates()