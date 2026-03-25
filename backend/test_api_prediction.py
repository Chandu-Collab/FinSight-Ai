import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

def get_jwt_token():
    """Get a JWT token by logging in"""
    
    # First, let's try to register/login with a test user
    base_url = "http://localhost:8000"
    
    # Try to login with existing user credentials
    login_data = {
        "email": "test@example.com",
        "password_hash": "test123"
    }
    
    try:
        # You'll need to replace this with actual login flow
        # For now, this is a placeholder for the JWT token
        print("🔐 Note: You'll need to get a real JWT token by:")
        print("1. Registering a user via /api/register")
        print("2. Logging in via /api/login")
        print("3. Getting the token from /api/login/verify-otp")
        print("\nFor testing, you can use Postman or curl with the actual token.")
        
        return None
        
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

def test_prediction_endpoint():
    """Test the prediction endpoint"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Prediction Endpoint")
    print("=" * 40)
    
    # Test data (you'll need to replace with actual JWT token)
    headers = {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
    
    test_cases = [
        {
            "name": "Basic Prediction",
            "data": {
                "target_month": "2024-04",
                "notes": "Test prediction"
            }
        },
        {
            "name": "Next Month Prediction", 
            "data": {
                "target_month": "2024-05",
                "notes": "Next month expense prediction"
            }
        }
    ]
    
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. {test['name']}")
        print(f"   URL: POST {base_url}/api/predict")
        print(f"   Data: {json.dumps(test['data'], indent=6)}")
        print(f"   Headers: {headers}")
        
        # Uncomment below to make actual API call with real token
        """
        try:
            response = requests.post(
                f"{base_url}/api/predict",
                headers=headers,
                json=test['data']
            )
            
            print(f"   Status: {response.status_code}")
            if response.status_code == 200:
                print(f"   Response: {json.dumps(response.json(), indent=4)}")
            else:
                print(f"   Error: {response.text}")
                
        except Exception as e:
            print(f"   Request failed: {e}")
        """
    
    print("\n" + "=" * 40)
    print("📋 Manual Testing Instructions:")
    print("1. Start server: python main.py")
    print("2. Get JWT token (register/login flow)")
    print("3. Use curl or Postman:")
    print("   curl -X POST http://localhost:8000/api/predict \\")
    print("        -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("        -H 'Content-Type: application/json' \\")
    print("        -d '{\"target_month\":\"2024-04\"}'")

def test_training_endpoint():
    """Test the training endpoint"""
    
    base_url = "http://localhost:8000"
    
    print("\n🏋️ Testing Training Endpoint")
    print("=" * 40)
    
    headers = {
        'Authorization': 'Bearer YOUR_JWT_TOKEN_HERE',
        'Content-Type': 'application/json'
    }
    
    print("URL: POST {}/api/train-model".format(base_url))
    print("Headers:", headers)
    print("Data: {} (empty - uses database data)")
    
    print("\nManual test:")
    print("curl -X POST http://localhost:8000/api/train-model \\")
    print("     -H 'Authorization: Bearer YOUR_TOKEN' \\")
    print("     -H 'Content-Type: application/json'")

if __name__ == "__main__":
    test_prediction_endpoint()
    test_training_endpoint()
