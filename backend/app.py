from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
import datetime
import os
from dotenv import load_dotenv
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

# In-memory storage for demo (replace with database in production)
DATA_STORAGE = {
    "users": [],
    "income": [],
    "expenses": [],
    "budgets": [],
    "savings_goals": [],
    "recurring_transactions": [],
    "notifications": [],
    "transactions": [],
    "reports": [],
    "categories": [
        "Food", "Transportation", "Housing", "Entertainment", 
        "Healthcare", "Shopping", "Utilities", "Education",
        "Personal", "Insurance", "Taxes", "Other"
    ],
    "income_sources": [
        "Salary", "Freelance", "Investment", "Business", "Rental",
        "Side Hustle", "Bonus", "Dividend", "Interest", "Other"
    ]
}

class FinancePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        
    def prepare_data(self, data):
        """Prepare expense data for training"""
        df = pd.DataFrame(data)
        
        # Convert date to datetime and extract features
        df['date'] = pd.to_datetime(df['date'])
        df['month'] = df['date'].dt.month
        df['year'] = df['date'].dt.year
        df['day_of_week'] = df['date'].dt.dayofweek
        df['day_of_month'] = df['date'].dt.day
        
        # Add seasonal features
        df['quarter'] = df['date'].dt.quarter
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # One-hot encode categories
        df = pd.get_dummies(df, columns=['category'], prefix='cat')
        
        return df
    
    def train(self, data):
        """Train the prediction model"""
        try:
            df = self.prepare_data(data)
            
            # Features for training
            feature_columns = [col for col in df.columns if col not in ['amount', 'date', 'description']]
            X = df[feature_columns]
            y = df['amount']
            
            # Split data
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
            
            # Scale features
            X_train_scaled = self.scaler.fit_transform(X_train)
            X_test_scaled = self.scaler.transform(X_test)
            
            # Train model
            self.model.fit(X_train_scaled, y_train)
            
            # Evaluate
            y_pred = self.model.predict(X_test_scaled)
            mae = mean_absolute_error(y_test, y_pred)
            mse = mean_squared_error(y_test, y_pred)
            r2 = r2_score(y_test, y_pred)
            
            self.is_trained = True
            self.feature_columns = feature_columns
            
            return {
                'mae': mae,
                'mse': mse,
                'r2': r2,
                'status': 'success'
            }
            
        except Exception as e:
            return {'error': str(e), 'status': 'error'}
    
    def predict_next_month(self, data, target_month):
        """Predict expenses for next month"""
        try:
            if not self.is_trained:
                # Train the model if not already trained
                result = self.train(data)
                if result['status'] == 'error':
                    return result
            
            # Prepare future data
            df = self.prepare_data(data)
            
            # Get unique categories from training data
            categories = [col for col in df.columns if col.startswith('cat_')]
            
            # Create prediction data for target month
            target_date = datetime.datetime.strptime(target_month, '%Y-%m')
            predictions = []
            
            for category in categories:
                category_name = category.replace('cat_', '')
                future_data = {
                    'month': target_date.month,
                    'year': target_date.year,
                    'day_of_week': target_date.weekday(),
                    'day_of_month': 1,
                    'quarter': (target_date.month - 1) // 3 + 1,
                    'is_weekend': 1 if target_date.weekday() >= 5 else 0,
                    'category': category_name,
                    'amount': 0  # Placeholder
                }
                
                prepared_data = self.prepare_data([future_data])
                
                # Ensure all required columns are present
                for col in self.feature_columns:
                    if col not in prepared_data.columns:
                        prepared_data[col] = 0
                
                X_future = prepared_data[self.feature_columns]
                X_future_scaled = self.scaler.transform(X_future)
                prediction = self.model.predict(X_future_scaled)[0]
                
                if prediction > 0:
                    predictions.append({
                        'category': category_name,
                        'predicted_amount': round(float(prediction), 2),
                        'month': target_month
                    })
            
            total_predicted = sum(p['predicted_amount'] for p in predictions)
            
            return {
                'predictions': predictions,
                'total_predicted': round(total_predicted, 2),
                'month': target_month,
                'status': 'success'
            }
            
        except Exception as e:
            return {'error': str(e), 'status': 'error'}
    
    def generate_insights(self, data):
        """Generate AI-powered financial insights"""
        try:
            df = pd.DataFrame(data)
            
            # Calculate basic statistics
            total_expenses = df['amount'].sum()
            avg_expense = df['amount'].mean()
            
            # Category breakdown
            category_totals = df.groupby('category')['amount'].sum().to_dict()
            
            # Spending trends
            df['date'] = pd.to_datetime(df['date'])
            monthly_totals = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
            
            # Generate insights
            insights = []
            
            # Top spending category
            if category_totals:
                top_category = max(category_totals, key=category_totals.get)
                insights.append(f"Your highest spending category is {top_category} at ${category_totals[top_category]:.2f}")
            
            # Spending trend
            if len(monthly_totals) > 1:
                recent_month = monthly_totals.iloc[-1]
                previous_month = monthly_totals.iloc[-2]
                if recent_month > previous_month:
                    insights.append(f"Your spending increased by ${recent_month - previous_month:.2f} this month")
                else:
                    insights.append(f"Good news! Your spending decreased by ${previous_month - recent_month:.2f} this month")
            
            # Average spending insight
            insights.append(f"Your average expense is ${avg_expense:.2f}")
            
            # Category recommendations
            for category, amount in category_totals.items():
                if amount > total_expenses * 0.3:
                    insights.append(f"Consider reviewing {category} spending - it's {amount/total_expenses*100:.1f}% of your total expenses")
            
            return {
                'insights': insights,
                'total_expenses': round(total_expenses, 2),
                'average_expense': round(avg_expense, 2),
                'category_breakdown': {k: round(v, 2) for k, v in category_totals.items()},
                'status': 'success'
            }
            
        except Exception as e:
            return {'error': str(e), 'status': 'error'}

# Initialize predictor
predictor = FinancePredictor()

# ==================== USER MANAGEMENT ====================

@app.route('/api/users', methods=['GET'])
def get_users():
    """Get all users"""
    return jsonify({'data': DATA_STORAGE['users'], 'status': 'success'})

@app.route('/api/users', methods=['POST'])
def create_user():
    """Create new user"""
    try:
        data = request.get_json()
        new_user = {
            'id': f"user-{len(DATA_STORAGE['users']) + 1:03d}",
            'email': data['email'],
            'name': data.get('name', ''),
            'password_hash': data['password_hash'],  # In production, hash this
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['users'].append(new_user)
        return jsonify({'data': new_user, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/users/<user_id>', methods=['GET'])
def get_user(user_id):
    """Get user by ID"""
    user = next((u for u in DATA_STORAGE['users'] if u['id'] == user_id), None)
    if user:
        return jsonify({'data': user, 'status': 'success'})
    return jsonify({'error': 'User not found', 'status': 'error'}), 404

@app.route('/api/users/<user_id>', methods=['PUT'])
def update_user(user_id):
    """Update user"""
    try:
        data = request.get_json()
        for i, user in enumerate(DATA_STORAGE['users']):
            if user['id'] == user_id:
                DATA_STORAGE['users'][i].update(data)
                DATA_STORAGE['users'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['users'][i], 'status': 'success'})
        return jsonify({'error': 'User not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
def delete_user(user_id):
    """Delete user"""
    try:
        DATA_STORAGE['users'] = [u for u in DATA_STORAGE['users'] if u['id'] != user_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== INCOME MANAGEMENT ====================

@app.route('/api/income', methods=['GET'])
def get_income():
    """Get all income records"""
    user_id = request.args.get('user_id', 'demo-user-001')
    user_income = [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id]
    return jsonify({'data': user_income, 'status': 'success'})

@app.route('/api/income', methods=['POST'])
def create_income():
    """Create new income record"""
    try:
        data = request.get_json()
        new_income = {
            'id': f"inc-{len(DATA_STORAGE['income']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'amount': float(data['amount']),
            'source': data['source'],
            'description': data.get('description', ''),
            'date': data['date'],
            'frequency': data.get('frequency', 'one-time'),
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['income'].append(new_income)
        return jsonify({'data': new_income, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income/<income_id>', methods=['GET'])
def get_income_by_id(income_id):
    """Get income by ID"""
    income = next((inc for inc in DATA_STORAGE['income'] if inc['id'] == income_id), None)
    if income:
        return jsonify({'data': income, 'status': 'success'})
    return jsonify({'error': 'Income not found', 'status': 'error'}), 404

@app.route('/api/income/<income_id>', methods=['PUT'])
def update_income(income_id):
    """Update income record"""
    try:
        data = request.get_json()
        for i, inc in enumerate(DATA_STORAGE['income']):
            if inc['id'] == income_id:
                DATA_STORAGE['income'][i].update(data)
                DATA_STORAGE['income'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['income'][i], 'status': 'success'})
        return jsonify({'error': 'Income not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income/<income_id>', methods=['DELETE'])
def delete_income(income_id):
    """Delete income record"""
    try:
        DATA_STORAGE['income'] = [inc for inc in DATA_STORAGE['income'] if inc['id'] != income_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== EXPENSE MANAGEMENT ====================

@app.route('/api/expenses', methods=['GET'])
def get_expenses():
    """Get all expense records"""
    user_id = request.args.get('user_id', 'demo-user-001')
    user_expenses = [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id]
    return jsonify({'data': user_expenses, 'status': 'success'})

@app.route('/api/expenses', methods=['POST'])
def create_expense():
    """Create new expense record"""
    try:
        data = request.get_json()
        new_expense = {
            'id': f"exp-{len(DATA_STORAGE['expenses']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'amount': float(data['amount']),
            'category': data['category'],
            'description': data.get('description', ''),
            'date': data['date'],
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['expenses'].append(new_expense)
        return jsonify({'data': new_expense, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses/<expense_id>', methods=['GET'])
def get_expense_by_id(expense_id):
    """Get expense by ID"""
    expense = next((exp for exp in DATA_STORAGE['expenses'] if exp['id'] == expense_id), None)
    if expense:
        return jsonify({'data': expense, 'status': 'success'})
    return jsonify({'error': 'Expense not found', 'status': 'error'}), 404

@app.route('/api/expenses/<expense_id>', methods=['PUT'])
def update_expense(expense_id):
    """Update expense record"""
    try:
        data = request.get_json()
        for i, exp in enumerate(DATA_STORAGE['expenses']):
            if exp['id'] == expense_id:
                DATA_STORAGE['expenses'][i].update(data)
                DATA_STORAGE['expenses'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['expenses'][i], 'status': 'success'})
        return jsonify({'error': 'Expense not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
def delete_expense(expense_id):
    """Delete expense record"""
    try:
        DATA_STORAGE['expenses'] = [exp for exp in DATA_STORAGE['expenses'] if exp['id'] != expense_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== BUDGET MANAGEMENT ====================

@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets"""
    user_id = request.args.get('user_id', 'demo-user-001')
    month = request.args.get('month', '2024-03')
    user_budgets = [bud for bud in DATA_STORAGE['budgets'] if bud['user_id'] == user_id and bud['month'] == month]
    return jsonify({'data': user_budgets, 'status': 'success'})

@app.route('/api/budgets', methods=['POST'])
def create_budget():
    """Create new budget"""
    try:
        data = request.get_json()
        new_budget = {
            'id': f"bud-{len(DATA_STORAGE['budgets']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'name': data['name'],
            'category': data['category'],
            'amount': float(data['amount']),
            'month': data['month'],
            'alert_threshold': float(data.get('alert_threshold', 80)),
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['budgets'].append(new_budget)
        return jsonify({'data': new_budget, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets/<budget_id>', methods=['GET'])
def get_budget_by_id(budget_id):
    """Get budget by ID"""
    budget = next((bud for bud in DATA_STORAGE['budgets'] if bud['id'] == budget_id), None)
    if budget:
        return jsonify({'data': budget, 'status': 'success'})
    return jsonify({'error': 'Budget not found', 'status': 'error'}), 404

@app.route('/api/budgets/<budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update budget"""
    try:
        data = request.get_json()
        for i, bud in enumerate(DATA_STORAGE['budgets']):
            if bud['id'] == budget_id:
                DATA_STORAGE['budgets'][i].update(data)
                DATA_STORAGE['budgets'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['budgets'][i], 'status': 'success'})
        return jsonify({'error': 'Budget not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete budget"""
    try:
        DATA_STORAGE['budgets'] = [bud for bud in DATA_STORAGE['budgets'] if bud['id'] != budget_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== SAVINGS GOALS ====================

@app.route('/api/savings-goals', methods=['GET'])
def get_savings_goals():
    """Get all savings goals"""
    user_id = request.args.get('user_id', 'demo-user-001')
    user_goals = [goal for goal in DATA_STORAGE['savings_goals'] if goal['user_id'] == user_id]
    return jsonify({'data': user_goals, 'status': 'success'})

@app.route('/api/savings-goals', methods=['POST'])
def create_savings_goal():
    """Create new savings goal"""
    try:
        data = request.get_json()
        new_goal = {
            'id': f"sav-{len(DATA_STORAGE['savings_goals']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'name': data['name'],
            'category': data['category'],
            'target_amount': float(data['target_amount']),
            'current_amount': float(data.get('current_amount', 0)),
            'target_date': data['target_date'],
            'description': data.get('description', ''),
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['savings_goals'].append(new_goal)
        return jsonify({'data': new_goal, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals/<goal_id>', methods=['GET'])
def get_savings_goal_by_id(goal_id):
    """Get savings goal by ID"""
    goal = next((goal for goal in DATA_STORAGE['savings_goals'] if goal['id'] == goal_id), None)
    if goal:
        return jsonify({'data': goal, 'status': 'success'})
    return jsonify({'error': 'Savings goal not found', 'status': 'error'}), 404

@app.route('/api/savings-goals/<goal_id>', methods=['PUT'])
def update_savings_goal(goal_id):
    """Update savings goal"""
    try:
        data = request.get_json()
        for i, goal in enumerate(DATA_STORAGE['savings_goals']):
            if goal['id'] == goal_id:
                DATA_STORAGE['savings_goals'][i].update(data)
                DATA_STORAGE['savings_goals'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['savings_goals'][i], 'status': 'success'})
        return jsonify({'error': 'Savings goal not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals/<goal_id>', methods=['DELETE'])
def delete_savings_goal(goal_id):
    """Delete savings goal"""
    try:
        DATA_STORAGE['savings_goals'] = [goal for goal in DATA_STORAGE['savings_goals'] if goal['id'] != goal_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== RECURRING TRANSACTIONS ====================

@app.route('/api/recurring-transactions', methods=['GET'])
def get_recurring_transactions():
    """Get all recurring transactions"""
    user_id = request.args.get('user_id', 'demo-user-001')
    user_recurring = [rec for rec in DATA_STORAGE['recurring_transactions'] if rec['user_id'] == user_id]
    return jsonify({'data': user_recurring, 'status': 'success'})

@app.route('/api/recurring-transactions', methods=['POST'])
def create_recurring_transaction():
    """Create new recurring transaction"""
    try:
        data = request.get_json()
        new_recurring = {
            'id': f"rec-{len(DATA_STORAGE['recurring_transactions']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'name': data['name'],
            'type': data['type'],
            'amount': float(data['amount']),
            'frequency': data['frequency'],
            'category': data.get('category', ''),
            'source': data.get('source', ''),
            'is_active': data.get('is_active', True),
            'next_date': data.get('next_date', ''),
            'start_date': data.get('start_date', ''),
            'end_date': data.get('end_date', ''),
            'occurrence_count': data.get('occurrence_count'),
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['recurring_transactions'].append(new_recurring)
        return jsonify({'data': new_recurring, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['GET'])
def get_recurring_transaction_by_id(recurring_id):
    """Get recurring transaction by ID"""
    recurring = next((rec for rec in DATA_STORAGE['recurring_transactions'] if rec['id'] == recurring_id), None)
    if recurring:
        return jsonify({'data': recurring, 'status': 'success'})
    return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404

@app.route('/api/recurring-transactions/<recurring_id>', methods=['PUT'])
def update_recurring_transaction(recurring_id):
    """Update recurring transaction"""
    try:
        data = request.get_json()
        for i, rec in enumerate(DATA_STORAGE['recurring_transactions']):
            if rec['id'] == recurring_id:
                DATA_STORAGE['recurring_transactions'][i].update(data)
                DATA_STORAGE['recurring_transactions'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['recurring_transactions'][i], 'status': 'success'})
        return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['DELETE'])
def delete_recurring_transaction(recurring_id):
    """Delete recurring transaction"""
    try:
        DATA_STORAGE['recurring_transactions'] = [rec for rec in DATA_STORAGE['recurring_transactions'] if rec['id'] != recurring_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== NOTIFICATIONS ====================

@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    """Get all notifications"""
    user_id = request.args.get('user_id', 'demo-user-001')
    user_notifications = [notif for notif in DATA_STORAGE['notifications'] if notif['user_id'] == user_id]
    return jsonify({'data': user_notifications, 'status': 'success'})

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    """Create new notification"""
    try:
        data = request.get_json()
        new_notification = {
            'id': f"not-{len(DATA_STORAGE['notifications']) + 1:03d}",
            'user_id': data.get('user_id', 'demo-user-001'),
            'title': data['title'],
            'message': data['message'],
            'type': data.get('type', 'info'),
            'is_read': data.get('is_read', False),
            'is_acknowledged': data.get('is_acknowledged', False),
            'created_at': datetime.datetime.now().isoformat(),
            'updated_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['notifications'].append(new_notification)
        return jsonify({'data': new_notification, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['GET'])
def get_notification_by_id(notification_id):
    """Get notification by ID"""
    notification = next((notif for notif in DATA_STORAGE['notifications'] if notif['id'] == notification_id), None)
    if notification:
        return jsonify({'data': notification, 'status': 'success'})
    return jsonify({'error': 'notification not found', 'status': 'error'}), 404

@app.route('/api/notifications/<notification_id>', methods=['PUT'])
def update_notification(notification_id):
    """Update notification (mark as read/unread)"""
    try:
        data = request.get_json()
        for i, notif in enumerate(DATA_STORAGE['notifications']):
            if notif['id'] == notification_id:
                DATA_STORAGE['notifications'][i].update(data)
                DATA_STORAGE['notifications'][i]['updated_at'] = datetime.datetime.now().isoformat()
                return jsonify({'data': DATA_STORAGE['notifications'][i], 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
    """Delete notification"""
    try:
        DATA_STORAGE['notifications'] = [notif for notif in DATA_STORAGE['notifications'] if notif['id'] != notification_id]
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== TRANSACTIONS ====================

@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions (income + expenses)"""
    user_id = request.get('user_id', 'demo-user-001')
    user_income = [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id]
    user_expenses = [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id]
    
    # Combine and sort by date
    all_transactions = []
    for inc in user_income:
        all_transactions.append({**inc, 'type': 'income'})
    for exp in user_expenses:
        all_transactions.append({**exp, 'type': 'expense'})
    
    all_transactions.sort(key=lambda x: x['date'], reverse=True)
    return jsonify({'data': all_transactions, 'status': 'success'})

@app.route('/api/transactions', methods=['POST'])
def create_transaction():
    """Create new transaction (auto-detect type)"""
    try:
        data = request.get_json()
        transaction_type = data.get('type', 'expense')  # Default to expense
        
        if transaction_type == 'income':
            # Create income transaction
            return create_income()
        else:
            # Create expense transaction
            return create_expense()
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== REPORTS ====================

@app.route('/api/reports', methods=['GET'])
def get_reports():
    """Get all reports"""
    user_id = request.get('user_id', 'demo-user-001')
    user_reports = [report for report in DATA_STORAGE['reports'] if report['user_id'] == user_id]
    return jsonify({'data': user_reports, 'status': 'success'})

@app.route('/api/reports', methods=['POST'])
def generate_report():
    """Generate new report"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'demo-user-001')
        report_type = data.get('report_type', 'summary')
        date_range = data.get('date_range', {'start': '2024-03-01', 'end': '2024-03-31'})
        format_type = data.get('format', 'pdf')
        
        # Get user data
        user_income = [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id]
        user_expenses = [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id]
        user_budgets = [bud for bud in DATA_STORAGE['budgets'] if bud['user_id'] == user_id]
        user_goals = [goal for goal in DATA_STORAGE['savings_goals'] if goal['user_id'] == user_id]
        
        # Generate report data
        report_data = {
            'user_id': user_id,
            'report_type': report_type,
            'date_range': date_range,
            'format': format_type,
            'generated_at': datetime.datetime.now().isoformat(),
            'data': {
                'income': user_income,
                'expenses': user_expenses,
                'budgets': user_budgets,
                'savings_goals': user_goals,
                'total_income': sum(inc['amount'] for inc in user_income),
                'total_expenses': sum(exp['amount'] for exp in user_expenses),
                'net_income': sum(inc['amount'] for inc in user_income) - sum(exp['amount'] for exp in user_expenses),
                'budget_count': len(user_budgets),
                'savings_count': len(user_goals)
            }
        }
        
        # Save report
        new_report = {
            'id': f"report-{len(DATA_STORAGE['reports']) + 1:03d}",
            **report_data,
            'created_at': datetime.datetime.now().isoformat()
        }
        DATA_STORAGE['reports'].append(new_report)
        
        return jsonify({'data': new_report, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== DASHBOARD ====================

@app.route('/api/dashboard', methods=['GET'])
def get_dashboard():
    """Get dashboard summary data"""
    try:
        user_id = request.args.get('user_id', 'demo-user-001')
        month = request.args.get('month', '2024-03')
        
        # Get user's data
        user_income = [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id]
        user_expenses = [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id and exp['date'].startswith(month)]
        user_budgets = [bud for bud in DATA_STORAGE['budgets'] if bud['user_id'] == user_id and bud['month'] == month]
        user_goals = [goal for goal in DATA_STORAGE['savings_goals'] if goal['user_id'] == user_id]
        user_recurring = [rec for rec in DATA_STORAGE['recurring_transactions'] if rec['user_id'] == user_id and rec['is_active']]
        user_notifications = [notif for notif in DATA_STORAGE['notifications'] if notif['user_id'] == user_id and not notif['is_read']]
        
        # Calculate totals
        total_income = sum(inc['amount'] for inc in user_income)
        total_expenses = sum(exp['amount'] for exp in user_expenses)
        total_budget = sum(bud['amount'] for bud in user_budgets)
        total_savings = sum(goal['current_amount'] for goal in user_goals)
        
        # Get recent transactions
        all_transactions = []
        for inc in user_income:
            all_transactions.append({**inc, 'type': 'income'})
        for exp in user_expenses:
            all_transactions.append({**exp, 'type': 'expense'})
        recent_transactions = sorted(all_transactions, key=lambda x: x['created_at'], reverse=True)[:5]
        
        # Get budget alerts
        budget_alerts = []
        for budget in user_budgets:
            spent = sum(exp['amount'] for exp in user_expenses if exp['category'] == budget['category'])
            utilization = (spent / budget['amount']) * 100 if budget['amount'] > 0 else 0
            if utilization > budget['alert_threshold']:
                budget_alerts.append({
                    'budget_name': budget['name'],
                    'category': budget['category'],
                    'spent': spent,
                    'budget': budget['amount'],
                    'utilization': utilization,
                    'alert_threshold': budget['alert_threshold']
                })
        
        # Calculate savings progress
        savings_progress = []
        for goal in user_goals:
            progress = (goal['current_amount'] / goal['target_amount']) * 100 if goal['target_amount'] > 0 else 0
            savings_progress.append({
                'goal_name': goal['name'],
                'target_amount': goal['target_amount'],
                'current_amount': goal['current_amount'],
                'progress': progress,
                'days_remaining': (datetime.datetime.strptime(goal['target_date'], '%Y-%m-%d') - datetime.datetime.now()).days
            })
        
        return jsonify({
            'data': {
                'total_income': total_income,
                'total_expenses': total_expenses,
                'net_income': total_income - total_expenses,
                'total_savings': total_savings,
                'total_budget': total_budget,
                'recent_transactions': recent_transactions,
                'budget_alerts': budget_alerts,
                'savings_progress': savings_progress,
                'income_count': len(user_income),
                'expense_count': len(user_expenses),
                'budget_count': len(user_budgets),
                'savings_goals_count': len(user_goals),
                'recurring_count': len(user_recurring),
                'unread_notifications': len(user_notifications),
                'user_id': user_id,
                'month': month
            },
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== ANALYTICS ====================

@app.route('/api/analytics/summary', methods=['GET'])
def get_analytics_summary():
    """Get analytics summary"""
    try:
        user_id = request.args.get('user_id', 'demo-user-001')
        start_date = request.args.get('start_date', '2024-01-01')
        end_date = request.args.get('end_date', '2024-12-31')
        
        # Get user's data for date range
        user_income = [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id and inc['date'] >= start_date and inc['date'] <= end_date]
        user_expenses = [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id and exp['date'] >= start_date and exp['date'] <= end_date]
        
        # Monthly trends
        monthly_income = {}
        monthly_expenses = {}
        for inc in user_income:
            month_key = inc['date'][:7]  # YYYY-MM
            monthly_income[month_key] = monthly_income.get(month_key, 0) + inc['amount']
        
        for exp in user_expenses:
            month_key = exp['date'][:7]  # YYYY-MM
            monthly_expenses[month_key] = monthly_expenses.get(month_key, 0) + exp['amount']
        
        # Category breakdown
        category_totals = {}
        for exp in user_expenses:
            category_totals[exp['category']] = category_totals.get(exp['category'], 0) + exp['amount']
        
        # Source breakdown
        source_totals = {}
        for inc in user_income:
            source_totals[inc['source']] = source_totals.get(inc['source'], 0) + inc['amount']
        
        return jsonify({
            'data': {
                'monthly_income': monthly_income,
                'monthly_expenses': monthly_expenses,
                'category_breakdown': category_totals,
                'source_breakdown': source_totals,
                'total_income': sum(user_income),
                'total_expenses': sum(user_expenses),
                'transaction_count': len(user_income) + len(user_expenses)
            },
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== ML ENDPOINTS ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy', 
        'service': 'FinSight AI Backend API', 
        'version': '2.0',
        'data_counts': {
            'users': len(DATA_STORAGE['users']),
            'income': len(DATA_STORAGE['income']),
            'expenses': len(DATA_STORAGE['expenses']),
            'budgets': len(DATA_STORAGE['budgets']),
            'savings_goals': len(DATA_STORAGE['savings_goals']),
            'recurring_transactions': len(DATA_STORAGE['recurring_transactions']),
            'notifications': len(DATA_STORAGE['notifications']),
            'transactions': len(DATA_STORAGE['transactions']),
            'reports': len(DATA_STORAGE['reports'])
        }
    })

@app.route('/api/predict', methods=['POST'])
def predict_expenses():
    """Predict expenses for next month"""
    try:
        data = request.get_json()
        
        if not data or 'expenses' not in data or 'target_month' not in data:
            return jsonify({'error': 'Missing required fields: expenses, target_month'}), 400
        
        expenses = data['expenses']
        target_month = data['target_month']
        
        if not expenses:
            return jsonify({'error': 'No expense data provided'}), 400
        
        result = predictor.predict_next_month(expenses, target_month)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/insights', methods=['POST'])
def generate_insights():
    """Generate AI-powered financial insights"""
    try:
        data = request.get_json()
        
        if not data or 'expenses' not in data:
            return jsonify({'error': 'Missing required field: expenses'}), 400
        
        expenses = data['expenses']
        
        if not expenses:
            return jsonify({'error': 'No expense data provided'}), 400
        
        result = predictor.generate_insights(expenses)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/train', methods=['POST'])
def train_model():
    """Train the ML model"""
    try:
        data = request.get_json()
        
        if not data or 'expenses' not in data:
            return jsonify({'error': 'Missing required field: expenses'}), 400
        
        expenses = data['expenses']
        
        if not expenses:
            return jsonify({'error': 'No expense data provided'}), 400
        
        result = predictor.train(expenses)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== UTILITY ENDPOINTS ====================

@app.route('/api/data-status', methods=['GET'])
def get_data_status():
    """Get current data status"""
    user_id = request.args.get('user_id', 'demo-user-001')
    
    user_data = {
        'income': [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id],
        'expenses': [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id],
        'budgets': [bud for bud in DATA_STORAGE['budgets'] if bud['user_id'] == user_id],
        'savings_goals': [goal for goal in DATA_STORAGE['savings_goals'] if goal['user_id'] == user_id],
        'recurring_transactions': [rec for rec in DATA_STORAGE['recurring_transactions'] if rec['user_id'] == user_id],
        'notifications': [notif for notif in DATA_STORAGE['notifications'] if notif['user_id'] == user_id],
        'transactions': [trans for trans in DATA_STORAGE['transactions'] if trans['user_id'] == user_id],
        'reports': [report for report in DATA_STORAGE['reports'] if report['user_id'] == user_id]
    }
    
    return jsonify({
        'status': 'success',
        'data_counts': {k: len(v) for k, v in user_data.items()},
        'user_id': user_id
    })

@app.route('/api/clear-data', methods=['DELETE'])
def clear_all_data():
    """Clear all data (for testing)"""
    global DATA_STORAGE
    DATA_STORAGE = {
        "users": [],
        "income": [],
        "expenses": [],
        "budgets": [],
        "savings_goals": [],
        "recurring_transactions": [],
        "notifications": [],
        "transactions": [],
        "reports": []
    }
    return jsonify({'status': 'success', 'message': 'All data cleared'})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get available categories"""
    return jsonify({'data': DATA_STORAGE['categories'], 'status': 'success'})

@app.route('/api/income-sources', methods=['GET'])
def get_income_sources():
    """Get available income sources"""
    return jsonify({'data': DATA_STORAGE['income_sources'], 'status': 'success'})

@app.route('/api/export/data', methods=['GET'])
def export_data():
    """Export all data as JSON"""
    user_id = request.args.get('user_id', 'demo-user-001')
    
    user_data = {
        'income': [inc for inc in DATA_STORAGE['income'] if inc['user_id'] == user_id],
        'expenses': [exp for exp in DATA_STORAGE['expenses'] if exp['user_id'] == user_id],
        'budgets': [bud for bud in DATA_STORAGE['budgets'] if bud['user_id'] == user_id],
        'savings_goals': [goal for goal in DATA_STORAGE['savings_goals'] if goal['user_id'] == user_id],
        'recurring_transactions': [rec for rec in DATA_STORAGE['recurring_transactions'] if rec['user_id'] == user_id],
        'notifications': [notif for notif in DATA_STORAGE['notifications'] if notif['user_id'] == user_id],
        'transactions': [trans for trans in DATA_STORAGE['transactions'] if trans['user_id'] == user_id],
        'reports': [report for report in DATA_STORAGE['reports'] if report['user_id'] == user_id]
    }
    
    return jsonify({
        'data': user_data,
        'exported_at': datetime.datetime.now().isoformat(),
        'status': 'success'
    })

# ==================== ROOT ENDPOINT ====================

@app.route('/')
def root():
    """Root endpoint"""
    return jsonify({
        'message': 'FinSight AI Backend API',
        'version': '2.0',
        'endpoints': {
            'users': '/api/users',
            'income': '/api/income',
            'expenses': '/api/expenses',
            'budgets': '/api/budgets',
            'savings-goals': '/api/savings-goals',
            'recurring-transactions': '/api/recurring-transactions',
            'notifications': '/api/notifications',
            'transactions': '/api/transactions',
            'reports': '/api/reports',
            'dashboard': '/api/dashboard',
            'analytics': '/api/analytics/summary',
            'ml': {
                'health': '/api/health',
                'predict': '/api/predict',
                'insights': '/api/insights',
                'train': '/api/train'
            },
            'utility': {
                'data-status': '/api/data-status',
                'clear-data': '/api/clear-data',
                'categories': '/api/categories',
                'income-sources': '/api/income-sources',
                'export-data': '/api/export/data'
            }
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    print(f"🚀 FinSight AI Backend API starting on port {port}")
    print(f"📊 Health check: http://localhost:{port}/api/health")
    print(f"📈 Data status: http://localhost:{port}/api/data-status")
    print(f"🧹 Clear data: DELETE http://localhost:{port}/api/clear-data")
    print(f"📚️ Root endpoint: http://localhost:{port}/")
    print(f"🎯 Ready for frontend integration!")

    # --- Database connection check ---
    try:
        from sqlalchemy import create_engine, text
        db_url = os.environ.get('DATABASE_URL')
        if db_url:
            engine = create_engine(db_url)
            with engine.connect() as conn:
                conn.execute(text("SELECT 1;"))
            print("✅ Database connection successful!")
        else:
            print("⚠️  DATABASE_URL not set. Skipping DB connection check.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")

    app.run(host='0.0.0.0', port=port, debug=True)
