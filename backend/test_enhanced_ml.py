import requests
import json
import datetime

def test_enhanced_ml_features():
    """Test the enhanced ML features"""
    
    base_url = "http://localhost:8000"
    
    print("🧪 Testing Enhanced ML Features")
    print("=" * 50)
    
    # Note: These tests require a valid JWT token
    # For demonstration, showing the API calls structure
    
    test_cases = [
        {
            "name": "Train Model",
            "endpoint": "/api/train-model",
            "method": "POST",
            "data": {},
            "description": "Trains ML model with user's expense data from database"
        },
        {
            "name": "Predict Expenses",
            "endpoint": "/api/predict",
            "method": "POST",
            "data": {
                "target_month": "2024-04",
                "notes": "Test prediction with enhanced ML"
            },
            "description": "Predicts expenses using enhanced ML with real data"
        },
        {
            "name": "Generate Insights",
            "endpoint": "/api/insights",
            "method": "POST",
            "data": {},
            "description": "Generates financial insights using real expense data"
        }
    ]
    
    print("📋 Test Cases:")
    for i, test in enumerate(test_cases, 1):
        print(f"\n{i}. {test['name']}")
        print(f"   Method: {test['method']} {test['endpoint']}")
        print(f"   Data: {json.dumps(test['data'], indent=6)}")
        print(f"   Description: {test['description']}")
    
    print("\n" + "=" * 50)
    print("🔧 To run these tests:")
    print("1. Start the backend server: python main.py")
    print("2. Get a JWT token by logging in")
    print("3. Add the token to Authorization header: 'Bearer <token>'")
    print("4. Run the API calls")
    
    print("\n📊 Expected Enhancements:")
    print("✅ Category-based predictions")
    print("✅ Enhanced feature engineering")
    print("✅ Real database data integration")
    print("✅ Better insights and analytics")
    print("✅ Improved model performance metrics")

def test_direct_predictor():
    """Test the enhanced predictor directly"""
    print("\n🔬 Direct Predictor Test")
    print("=" * 30)
    
    try:
        # Import the predictor
        import sys
        import os
        sys.path.append(os.path.dirname(__file__))
        from main import ExpensePredictor
        
        predictor = ExpensePredictor()
        
        # Sample expense data
        sample_expenses = [
            {'amount': 150.0, 'category': 'Food', 'date': '2024-01-15', 'description': 'Groceries'},
            {'amount': 50.0, 'category': 'Transport', 'date': '2024-01-20', 'description': 'Gas'},
            {'amount': 200.0, 'category': 'Food', 'date': '2024-02-10', 'description': 'Restaurant'},
            {'amount': 75.0, 'category': 'Entertainment', 'date': '2024-02-15', 'description': 'Movies'},
            {'amount': 180.0, 'category': 'Food', 'date': '2024-03-05', 'description': 'Groceries'},
            {'amount': 60.0, 'category': 'Transport', 'date': '2024-03-12', 'description': 'Uber'},
        ]
        
        print("📈 Testing training...")
        train_result = predictor.train(sample_expenses)
        print(f"Training result: {train_result}")
        
        if train_result['status'] == 'success':
            print("\n🔮 Testing prediction...")
            pred_result = predictor.predict_next_month(sample_expenses, '2024-04')
            print(f"Prediction result: {json.dumps(pred_result, indent=2)}")
            
            print("\n💡 Testing insights...")
            insights_result = predictor.generate_insights(sample_expenses)
            print(f"Insights result: {json.dumps(insights_result, indent=2)}")
        
        print("\n✅ Direct predictor test completed!")
        
    except Exception as e:
        print(f"❌ Error in direct test: {e}")

if __name__ == "__main__":
    test_enhanced_ml_features()
    test_direct_predictor()
