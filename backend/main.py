
import os
import smtplib
import random
import string
import datetime
import decimal
from datetime import datetime as dt, timezone as tz
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import psycopg2
import jwt
from functools import wraps
from flask import Flask, request, jsonify, g
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from dotenv import load_dotenv
import json
import requests
import pickle
from werkzeug.exceptions import HTTPException

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, '.env'))

# Enhanced predictor class for expense prediction
class ExpensePredictor:
    def __init__(self):
        self.model = LinearRegression()
        self.scaler = StandardScaler()
        self.is_trained = False
        self.feature_columns = []
        
    def prepare_data(self, data):
        """Prepare expense data for training with enhanced features"""
        try:
            if isinstance(data, list):
                df = pd.DataFrame(data)
            else:
                # Convert database results to DataFrame
                df = pd.DataFrame(data) if data else pd.DataFrame()
            
            if df.empty:
                return df
            
            # Convert date to datetime and extract features
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                df['month'] = df['date'].dt.month
                df['year'] = df['date'].dt.year
                df['day_of_week'] = df['date'].dt.dayofweek
                df['day_of_month'] = df['date'].dt.day
                
                # Add seasonal features
                df['quarter'] = df['date'].dt.quarter
                df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
                
                # Add cyclical features
                df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12)
                df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12)
                
                # One-hot encode categories if present
                if 'category' in df.columns:
                    df = pd.get_dummies(df, columns=['category'], prefix='cat')
            
            return df
        except Exception as e:
            print(f"Error preparing data: {e}")
            return pd.DataFrame()
    
    def train(self, expenses):
        """Train the prediction model with enhanced features"""
        try:
            if not expenses:
                return {'status': 'error', 'error': 'No expense data provided for training'}
            
            df = self.prepare_data(expenses)
            
            if df.empty:
                return {'status': 'error', 'error': 'Failed to prepare training data'}
            
            # Features for training (exclude non-feature columns)
            exclude_columns = ['amount', 'date', 'description', 'created_at', 'updated_at']
            feature_columns = [col for col in df.columns if col not in exclude_columns]
            
            if not feature_columns:
                return {'status': 'error', 'error': 'No valid features found for training'}
            
            X = df[feature_columns]
            y = df['amount']
            
            # Split data
            if len(X) < 2:
                return {'status': 'error', 'error': 'Not enough data points for training'}
            
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
                'status': 'success',
                'mae': mae,
                'mse': mse,
                'r2': r2,
                'message': 'Model trained successfully',
                'features_used': feature_columns,
                'training_samples': len(X_train)
            }
            
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def predict_next_month(self, expenses, target_month):
        """Predict expenses for next month with category breakdown"""
        try:
            if not self.is_trained:
                # Train the model if not already trained
                result = self.train(expenses)
                if result['status'] == 'error':
                    return result
            
            # Prepare historical data
            df = self.prepare_data(expenses)
            
            if df.empty:
                return {'status': 'error', 'error': 'No valid expense data for prediction'}
            
            # Get unique categories from training data
            category_columns = [col for col in df.columns if col.startswith('cat_')]
            
            # Create prediction data for target month
            target_date = datetime.datetime.strptime(target_month, '%Y-%m')
            predictions = []
            
            if category_columns:
                # Category-based predictions
                for cat_col in category_columns:
                    category_name = cat_col.replace('cat_', '')
                    
                    # Create future data for this category
                    future_data = {
                        'month': target_date.month,
                        'year': target_date.year,
                        'day_of_week': target_date.weekday(),
                        'day_of_month': 1,
                        'quarter': (target_date.month - 1) // 3 + 1,
                        'is_weekend': 1 if target_date.weekday() >= 5 else 0,
                        'month_sin': np.sin(2 * np.pi * target_date.month / 12),
                        'month_cos': np.cos(2 * np.pi * target_date.month / 12),
                        cat_col: 1  # This category is active
                    }
                    
                    # Set other category columns to 0
                    for other_cat in category_columns:
                        if other_cat != cat_col:
                            future_data[other_cat] = 0
                    
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
                    'status': 'success',
                    'predictions': predictions,
                    'total_predicted': round(total_predicted, 2),
                    'month': target_month,
                    'prediction_type': 'category_based'
                }
            
            else:
                # Fallback to simple time-based prediction
                year, month_num = map(int, target_month.split('-'))
                time_index = (year - 2024) * 12 + (month_num - 1)
                month_sin = np.sin(2 * np.pi * month_num / 12)
                month_cos = np.cos(2 * np.pi * month_num / 12)
                
                feature_values = [[time_index, month_sin, month_cos]]
                
                # Add other required features with default values
                feature_dict = {
                    'time_index': time_index,
                    'month_sin': month_sin,
                    'month_cos': month_cos,
                    'month': month_num,
                    'year': year,
                    'day_of_week': target_date.weekday(),
                    'day_of_month': 1,
                    'quarter': (month_num - 1) // 3 + 1,
                    'is_weekend': 1 if target_date.weekday() >= 5 else 0
                }
                
                # Ensure all feature columns are present
                for col in self.feature_columns:
                    if col not in feature_dict:
                        feature_dict[col] = 0
                
                X_future = np.array([[feature_dict.get(col, 0) for col in self.feature_columns]])
                X_future_scaled = self.scaler.transform(X_future)
                prediction = self.model.predict(X_future_scaled)[0]
                
                return {
                    'status': 'success',
                    'prediction': round(float(prediction), 2),
                    'month': target_month,
                    'prediction_type': 'time_based',
                    'confidence_score': 0.75
                }
                
        except Exception as e:
            return {'status': 'error', 'error': str(e)}
    
    def generate_insights(self, expenses):
        """Generate AI-powered financial insights with enhanced analysis"""
        try:
            if not expenses:
                return {'status': 'error', 'error': 'No expense data provided'}
            
            df = pd.DataFrame(expenses) if isinstance(expenses, list) else pd.DataFrame([expenses])
            
            if df.empty or 'amount' not in df.columns:
                return {'status': 'error', 'error': 'Invalid expense data format'}
            
            # Calculate basic statistics
            total_expenses = df['amount'].sum()
            avg_expense = df['amount'].mean()
            
            # Category breakdown
            category_totals = {}
            if 'category' in df.columns:
                category_totals = df.groupby('category')['amount'].sum().to_dict()
            
            # Spending trends
            if 'date' in df.columns:
                df['date'] = pd.to_datetime(df['date'])
                monthly_totals = df.groupby(df['date'].dt.to_period('M'))['amount'].sum()
            else:
                monthly_totals = pd.Series([total_expenses])
            
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
            
            # Spending frequency insight
            if len(df) > 0:
                if 'date' in df.columns:
                    date_range = (df['date'].max() - df['date'].min()).days
                    if date_range > 0:
                        daily_avg = total_expenses / date_range
                        insights.append(f"You spend approximately ${daily_avg:.2f} per day on average")
            
            return {
                'status': 'success',
                'insights': insights,
                'total_expenses': round(total_expenses, 2),
                'average_expense': round(avg_expense, 2),
                'category_breakdown': {k: round(v, 2) for k, v in category_totals.items()},
                'transaction_count': len(df),
                'monthly_trend': {str(k): v for k, v in monthly_totals.items()} if not monthly_totals.empty else {}
            }
            
        except Exception as e:
            return {'status': 'error', 'error': str(e)}

# Initialize predictor
predictor = ExpensePredictor()

app = Flask(__name__)
CORS_ORIGINS = [origin.strip() for origin in os.environ.get('CORS_ORIGINS', '').split(',') if origin.strip()]
CORS(app, origins=CORS_ORIGINS, supports_credentials=True)


@app.errorhandler(psycopg2.OperationalError)
def handle_database_error(error):
    message = str(error)
    if 'no password supplied' in message.lower():
        message = (
            'Database connection failed. Set DATABASE_URL to include a username and password, '
            'for example: postgresql://user:password@localhost:5432/finsight_ai'
        )
    return jsonify({'error': message, 'status': 'error'}), 503


@app.errorhandler(HTTPException)
def handle_http_exception(error):
    response = jsonify({'error': error.description, 'status': 'error'})
    response.status_code = error.code or 500
    return response


@app.errorhandler(Exception)
def handle_unexpected_exception(error):
    app.logger.exception('Unhandled backend error')
    return jsonify({'error': 'Internal server error', 'status': 'error'}), 500

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Missing or invalid Authorization header'}), 401
        token = auth_header.split(' ')[1]
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            g.user_id = payload['user_id']
            g.email = payload['email']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated
# ==================== ML PREDICTION ENDPOINTS ====================

# Enhanced Training Endpoint
@app.route('/api/train-model', methods=['POST'])
@jwt_required
def train_ml_model():
    """Train the ML model with user's expense data"""
    try:
        user_id = g.user_id if hasattr(g, 'user_id') else None
        
        # Fetch user's expense data from database
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT amount, category, date, description
            FROM expenses 
            WHERE user_id = %s 
            AND date >= NOW() - INTERVAL '12 months'
            ORDER BY date ASC
        ''', (user_id,))
        
        expense_data = []
        for row in cur.fetchall():
            expense_data.append({
                'amount': float(row[0]),
                'category': row[1],
                'date': row[2].strftime('%Y-%m-%d'),
                'description': row[3]
            })
        
        cur.close()
        conn.close()
        
        if not expense_data:
            return jsonify({'error': 'No expense data found for training. Add some expenses first.'}), 400
        
        # Train the model
        result = predictor.train(expense_data)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify({
            'status': 'success',
            'message': 'Model trained successfully',
            'training_results': result,
            'data_points_used': len(expense_data)
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Linear Regression Prediction Endpoint (scikit-learn)
@app.route('/api/predict/linear', methods=['POST'])
@jwt_required
def predict_linear():
    """Predict using local scikit-learn linear regression model and store in DB"""
    try:
        data = request.get_json()
        user_id = g.user_id if hasattr(g, 'user_id') else None
        features = np.array(data.get('features')).reshape(1, -1)
        prediction_type = data.get('prediction_type', 'linear_regression')
        input_features = data.get('features')
        category = data.get('category')
        target_date = data.get('target_date')
        month = data.get('month')
        model_version = data.get('model_version', '1.0')
        notes = data.get('notes')
        # Load model and predict
        try:
            with open('linear_model.pkl', 'rb') as f:
                model_data = pickle.load(f)
            
            model = model_data['model']
            scaler = model_data['scaler']
            features_list = model_data['features']
            
            # For time-based prediction, create features from target month
            if month:
                year, month_num = map(int, month.split('-')) if '-' in month else (2024, int(month))
                time_index = (year - 2024) * 12 + (month_num - 1)
                month_sin = np.sin(2 * np.pi * month_num / 12)
                month_cos = np.cos(2 * np.pi * month_num / 12)
                
                # Create feature array in the correct order
                feature_values = [[time_index, month_sin, month_cos]]
                
                # Scale features
                features_scaled = scaler.transform(feature_values)
                
                # Make prediction
                prediction = model.predict(features_scaled)
                predicted_value = float(prediction[0])
                
                # Calculate confidence based on model performance
                confidence_score = 0.75  # Default confidence
            else:
                # Fallback to simple prediction if no month provided
                predicted_value = model_data['training_data_stats']['mean_expense']
                confidence_score = 0.5
                
        except FileNotFoundError:
            return jsonify({'error': 'Model not found. Please train the model first.'}), 500
        except Exception as e:
            return jsonify({'error': f'Prediction error: {str(e)}'}), 500
        status = 'completed'
        error_message = None
        # Insert into DB
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO predictions (
                user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s
            ) RETURNING id, user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
        ''', (
            user_id,
            predicted_value,
            month,
            prediction_type,
            json.dumps(input_features),
            confidence_score,
            status,
            error_message,
            model_version,
            notes,
            category,
            target_date
        ))
        new_pred = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'predicted_value', 'month', 'prediction_type', 'input_features', 'confidence_score', 'status', 'error_message', 'created_at', 'updated_at', 'model_version', 'notes', 'category', 'target_date']
        result = dict(zip(columns, new_pred))
        return jsonify({'prediction': result, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Gemini Insights Endpoint
@app.route('/api/insights/gemini', methods=['POST'])
@jwt_required
def gemini_insights():
    """Get advanced insights from Gemini API"""
    try:
        data = request.get_json()
        gemini_api_key = os.getenv('GEMINI_KEY')
        if not gemini_api_key:
            return jsonify({'error': 'Gemini API key not set', 'status': 'error'}), 500
        # Example Gemini API call (replace URL and payload as needed)
        response = requests.post(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'Bearer {gemini_api_key}'
            },
            json=data
        )
        if response.status_code == 200:
            return jsonify({'insights': response.json(), 'status': 'success'})
        else:
            return jsonify({'error': response.text, 'status': 'error'}), response.status_code
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Utility to convert Decimal to float recursively
def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, decimal.Decimal):
        return float(obj)
    elif isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    else:
        return obj

# ==================== REPORTS ====================
@app.route('/api/reports/<report_id>', methods=['GET'])
@jwt_required
def get_report_by_id(report_id):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, report_type, date_range, format, generated_at, data, status, file_url, error_message, requested_at, completed_at, name, description, is_public, template_id, tags, created_at
            FROM reports WHERE id = %s
        ''', (report_id,))
        row = cur.fetchone()
        if not row:
            cur.close()
            conn.close()
            return jsonify({'error': 'Report not found', 'status': 'error'}), 404
        columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'status', 'file_url', 'error_message', 'requested_at', 'completed_at', 'name', 'description', 'is_public', 'template_id', 'tags', 'created_at']
        report_dict = dict(zip(columns, row))
        # Convert Decimal and date types for JSON serialization
        report_dict = convert_decimal(report_dict)
        cur.close()
        conn.close()
        return jsonify({'data': report_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500
import decimal
import datetime

# Utility to convert Decimal to float recursively
def convert_decimal(obj):
    if isinstance(obj, list):
        return [convert_decimal(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: convert_decimal(v) for k, v in obj.items()}
    elif isinstance(obj, decimal.Decimal):
        return float(obj)
    elif isinstance(obj, (datetime.date, datetime.datetime)):
        return obj.isoformat()
    else:
        return obj

# JWT_SECRET and other configuration should be defined after the first app instance

# --- CONFIG ---
GMAIL_USER = os.environ.get('GMAIL_USER')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
EMAIL_FROM = os.environ.get('EMAIL_FROM')
DB_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET')

# --- DB CONNECTION ---
def get_db_conn():
    if not DB_URL:
        raise psycopg2.OperationalError('DATABASE_URL is not set')

    db_url = DB_URL
    if 'sslmode=' not in db_url:
        separator = '&' if '?' in db_url else '?'
        db_url = f'{db_url}{separator}sslmode=require'

    return psycopg2.connect(db_url)



# ==================== SAVINGS GOALS ENDPOINTS (PostgreSQL) ====================
@app.route('/api/savings-goals', methods=['GET'])
@jwt_required
def get_savings_goals():
    """Get all savings goals for a user"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, category, target_amount, current_amount, target_date, description, status, priority, progress_percentage, image_url, notes, recurring_contribution, last_contribution_date, is_public, completion_date, motivation, created_at, updated_at
            FROM savings_goals WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'status', 'priority', 'progress_percentage', 'image_url', 'notes', 'recurring_contribution', 'last_contribution_date', 'is_public', 'completion_date', 'motivation', 'created_at', 'updated_at']
        user_goals = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_goals, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals', methods=['POST'])
@jwt_required
def create_savings_goal():
    """Create new savings goal"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO savings_goals (
                user_id, name, category, target_amount, current_amount, target_date, description, status, priority, progress_percentage, image_url, notes, recurring_contribution, last_contribution_date, is_public, completion_date, motivation, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, user_id, name, category, target_amount, current_amount, target_date, description, status, priority, progress_percentage, image_url, notes, recurring_contribution, last_contribution_date, is_public, completion_date, motivation, created_at, updated_at
        ''', (
            data.get('user_id', 'demo-user-001'),
            data['name'],
            data['category'],
            float(data['target_amount']),
            float(data.get('current_amount', 0)),
            data.get('target_date'),
            data.get('description', ''),
            data.get('status', 'active'),
            data.get('priority', 'medium'),
            float(data.get('progress_percentage', 0)),
            data.get('image_url'),
            data.get('notes'),
            float(data.get('recurring_contribution', 0)),
            data.get('last_contribution_date'),
            data.get('is_public', False),
            data.get('completion_date'),
            data.get('motivation'),
            now,
            now
        ))
        row = cur.fetchone()
        columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'status', 'priority', 'progress_percentage', 'image_url', 'notes', 'recurring_contribution', 'last_contribution_date', 'is_public', 'completion_date', 'motivation', 'created_at', 'updated_at']
        new_goal = dict(zip(columns, row))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'data': new_goal, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals/<goal_id>', methods=['GET'])
@jwt_required
def get_savings_goal_by_id(goal_id):
    """Get savings goal by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, category, target_amount, current_amount, target_date, description, status, priority, progress_percentage, image_url, notes, recurring_contribution, last_contribution_date, is_public, completion_date, motivation, created_at, updated_at
            FROM savings_goals WHERE id = %s
        ''', (goal_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'status', 'priority', 'progress_percentage', 'image_url', 'notes', 'recurring_contribution', 'last_contribution_date', 'is_public', 'completion_date', 'motivation', 'created_at', 'updated_at']
            goal = dict(zip(columns, row))
            return jsonify({'data': goal, 'status': 'success'})
        return jsonify({'error': 'Savings goal not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals/<goal_id>', methods=['PUT'])
@jwt_required
def update_savings_goal(goal_id):
    """Update savings goal"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'status', 'priority', 'progress_percentage', 'image_url', 'notes', 'recurring_contribution', 'last_contribution_date', 'is_public', 'completion_date', 'motivation']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(goal_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE savings_goals SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, name, category, target_amount, current_amount, target_date, description, status, priority, progress_percentage, image_url, notes, recurring_contribution, last_contribution_date, is_public, completion_date, motivation, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'status', 'priority', 'progress_percentage', 'image_url', 'notes', 'recurring_contribution', 'last_contribution_date', 'is_public', 'completion_date', 'motivation', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Savings goal not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/savings-goals/<goal_id>', methods=['DELETE'])
@jwt_required
def delete_savings_goal(goal_id):
    """Delete savings goal"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM savings_goals WHERE id = %s RETURNING id', (goal_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Savings goal not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== BUDGETS ENDPOINTS ====================
@app.route('/api/budgets', methods=['GET'])
def get_budgets():
    """Get all budgets for a user (optionally filter by month)"""
    user_id = request.args.get('user_id', 'demo-user-001')
    month = request.args.get('month')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        if month:
            cur.execute('''
                SELECT id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
                FROM budgets WHERE user_id = %s AND month = %s
            ''', (user_id, month))
        else:
            cur.execute('''
                SELECT id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
                FROM budgets WHERE user_id = %s
            ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent', 'created_at', 'updated_at']
        user_budgets = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_budgets, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets', methods=['POST'])
def create_budget():
    """Create new budget"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        insert_query = '''
            INSERT INTO budgets (
                user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
        '''
        values = (
            data.get('user_id'),
            data.get('name'),
            data.get('category'),
            float(data['amount']),
            data.get('month'),
            float(data.get('alert_threshold', 80)),
            data.get('description'),
            data.get('is_active', True),
            data.get('rollover', False),
            float(data.get('spent', 0)),
            now,
            now
        )
        cur.execute(insert_query, values)
        new_budget = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent', 'created_at', 'updated_at']
        budget_dict = dict(zip(columns, new_budget))
        return jsonify({'data': budget_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets/<budget_id>', methods=['GET'])
def get_budget_by_id(budget_id):
    """Get budget by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
            FROM budgets WHERE id = %s
        ''', (budget_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, row)), 'status': 'success'})
        else:
            return jsonify({'error': 'Budget not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets/<budget_id>', methods=['PUT'])
def update_budget(budget_id):
    """Update budget"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(budget_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE budgets SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Budget not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/budgets/<budget_id>', methods=['DELETE'])
def delete_budget(budget_id):
    """Delete budget"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM budgets WHERE id = %s RETURNING id', (budget_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Budget not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# --- OTP GENERATION ---
def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

# --- SEND EMAIL ---
def send_otp_email(to_email, otp):
    subject = 'Your Email Verification OTP'
    body = f'Your OTP for email verification is: {otp}\nThis OTP is valid for 10 minutes.'
    msg = MIMEMultipart()
    msg['From'] = EMAIL_FROM or GMAIL_USER
    msg['To'] = to_email
    msg['Subject'] = subject
    msg.attach(MIMEText(body, 'plain'))
    with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
        server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
        server.sendmail(EMAIL_FROM or GMAIL_USER, to_email, msg.as_string())

# --- JWT GENERATION ---
def generate_jwt(user_id, email):
    payload = {
        'user_id': str(user_id),
        'email': email,
        'exp': dt.now(tz.utc) + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token

# --- DEDICATED REGISTER ENDPOINT (pending_users) ---
@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data['email']
    password_hash = data['password_hash']
    name = data.get('name', '')
    phone_number = data.get('phone_number')
    date_of_birth = data.get('date_of_birth')
    gender = data.get('gender')
    conn = get_db_conn()
    cur = conn.cursor()
    # Check if already registered or pending
    cur.execute('SELECT id FROM users WHERE email=%s', (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'error': 'Email already registered'}), 400
    cur.execute('SELECT id FROM pending_users WHERE email=%s', (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        return jsonify({'error': 'Registration already pending. Please verify OTP.'}), 400
    otp = generate_otp()
    expires_at = dt.now(tz.utc) + datetime.timedelta(minutes=10)
    cur.execute('INSERT INTO pending_users (email, password_hash, name, phone_number, date_of_birth, gender, otp, otp_expires_at) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)',
                (email, password_hash, name, phone_number, date_of_birth, gender, otp, expires_at))
    conn.commit()
    cur.close()
    conn.close()
    send_otp_email(email, otp)
    return jsonify({'message': 'Registration started. Please verify your email with the OTP sent.'})


# --- VERIFY OTP ENDPOINT (move from pending_users to users) ---
@app.route('/api/users/verify-email', methods=['POST'])
def verify_email():
    data = request.get_json()
    email = data['email']
    otp = data['otp']
    conn = get_db_conn()
    cur = conn.cursor()
    # Get pending user
    cur.execute('SELECT id, password_hash, name, phone_number, date_of_birth, gender, otp, otp_expires_at FROM pending_users WHERE email=%s', (email,))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return jsonify({'error': 'No pending registration found'}), 404
    (pending_id, password_hash, name, phone_number, date_of_birth, gender, db_otp, otp_expires_at) = row
    if db_otp != otp:
        cur.close()
        conn.close()
        return jsonify({'error': 'Invalid OTP'}), 400
    
    # Handle timezone comparison - if otp_expires_at is naive, assume it's UTC
    if otp_expires_at.tzinfo is None:
        otp_expires_at = otp_expires_at.replace(tzinfo=tz.utc)
    
    if dt.now(tz.utc) > otp_expires_at:
        cur.close()
        conn.close()
        return jsonify({'error': 'OTP expired'}), 400
    # Insert into users with proper password hashing
    plain_password = password_hash  # This is actually plain password now
    try:
        import bcrypt
        # Hash the password before storing
        hashed_password = bcrypt.hashpw(plain_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    except Exception as e:
        # Fallback to base64 encoding for backward compatibility
        try:
            import base64
            hashed_password = base64.b64encode(plain_password.encode('utf-8')).decode('utf-8')
        except:
            # Last resort - store as plain text (not recommended)
            hashed_password = plain_password
            print(f"Warning: Could not hash password, storing as plain text: {e}")
    
    cur.execute('INSERT INTO users (email, password_hash, name, phone_number, date_of_birth, gender, email_verified) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id',
                (email, hashed_password, name, phone_number, date_of_birth, gender, True))
    user_id = cur.fetchone()[0]
    # Remove from pending_users
    cur.execute('DELETE FROM pending_users WHERE id=%s', (pending_id,))
    conn.commit()
    cur.close()
    conn.close()
    return jsonify({'message': 'Email verified and registration complete'})


# --- LOGIN INITIATE ENDPOINT (send OTP) ---
@app.route('/api/login', methods=['POST'])
def login_initiate():
    data = request.get_json()
    email = data['email']
    plain_password = data['password_hash']  # This is actually plain password now
    
    conn = get_db_conn()
    cur = conn.cursor()
    
    # Try to find user and verify password
    cur.execute('SELECT id, email_verified, password_hash FROM users WHERE email=%s', (email,))
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    
    user_id, email_verified, stored_hash = row
    
    # Verify password
    password_valid = False
    
    # Try bcrypt verification first (for properly hashed passwords)
    try:
        import bcrypt
        if bcrypt.checkpw(plain_password.encode('utf-8'), stored_hash.encode('utf-8')):
            password_valid = True
        else:
            # Try legacy methods for backward compatibility
            try:
                import base64
                # Check if stored password is base64 encoded
                decoded_stored = base64.b64decode(stored_hash).decode()
                if plain_password == decoded_stored:
                    password_valid = True
                elif plain_password == stored_hash:  # Plain text comparison
                    password_valid = True
            except:
                # Plain text comparison as last resort
                if plain_password == stored_hash:
                    password_valid = True
    except Exception as e:
        # If bcrypt fails, try legacy methods
        try:
            import base64
            decoded_stored = base64.b64decode(stored_hash).decode()
            if plain_password == decoded_stored:
                password_valid = True
            elif plain_password == stored_hash:  # Plain text comparison
                password_valid = True
        except:
            if plain_password == stored_hash:
                password_valid = True
    
    if not password_valid:
        cur.close()
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
        
    if not email_verified:
        cur.close()
        conn.close()
        return jsonify({'error': 'Email not verified'}), 403
        
    # Generate OTP and store in login_otps
    otp = generate_otp()
    expires_at = dt.now(tz.utc) + datetime.timedelta(minutes=10)
    # Remove any previous OTPs for this user
    cur.execute('DELETE FROM login_otps WHERE user_id=%s', (user_id,))
    cur.execute('INSERT INTO login_otps (user_id, otp, expires_at) VALUES (%s, %s, %s)', (user_id, otp, expires_at))
    conn.commit()
    
    # Send OTP email
    send_otp_email(email, otp)
    cur.close()
    conn.close()
    
    return jsonify({'message': 'OTP sent to your email. Please verify to complete login.'})

# --- LOGIN OTP VERIFICATION ENDPOINT ---
@app.route('/api/login/verify-otp', methods=['POST'])
def login_verify_otp():
    data = request.get_json()
    email = data['email']
    otp = data['otp']
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('SELECT id FROM users WHERE email=%s', (email,))
    user_row = cur.fetchone()
    if not user_row:
        cur.close()
        conn.close()
        return jsonify({'error': 'User not found'}), 404
    user_id = user_row[0]
    cur.execute('SELECT otp, expires_at FROM login_otps WHERE user_id=%s', (user_id,))
    otp_row = cur.fetchone()
    if not otp_row:
        cur.close()
        conn.close()
        return jsonify({'error': 'No OTP found. Please initiate login again.'}), 400
    db_otp, expires_at = otp_row
    if db_otp != otp:
        cur.close()
        conn.close()
        return jsonify({'error': 'Invalid OTP'}), 400
    
    # Convert expires_at to timezone-aware if it's naive
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=tz.utc)
    
    if dt.now(tz.utc) > expires_at:
        cur.close()
        conn.close()
        return jsonify({'error': 'OTP expired'}), 400
    # OTP valid, delete it and issue JWT
    cur.execute('DELETE FROM login_otps WHERE user_id=%s', (user_id,))
    
    # Fetch user data to return with token
    cur.execute('''
        SELECT id, email, name, profile_picture, phone_number, address, date_of_birth, gender, status, role, preferences, last_login, email_verified, two_factor_enabled, bio, created_at, updated_at
        FROM users 
        WHERE id = %s
    ''', (user_id,))
    user_data_row = cur.fetchone()
    
    # Update last login time
    cur.execute('UPDATE users SET last_login = NOW() WHERE id = %s', (user_id,))
    
    token = generate_jwt(user_id, email)
    conn.commit()
    cur.close()
    conn.close()
    
    if user_data_row:
        columns = ['id', 'email', 'name', 'profile_picture', 'phone_number', 'address', 'date_of_birth', 'gender', 'status', 'role', 'preferences', 'last_login', 'email_verified', 'two_factor_enabled', 'bio', 'created_at', 'updated_at']
        user_dict = dict(zip(columns, user_data_row))
        
        # Parse JSON fields for proper output
        if user_dict.get('preferences'):
            try:
                import json
                user_dict['preferences'] = json.loads(user_dict['preferences']) if isinstance(user_dict['preferences'], str) else user_dict['preferences']
            except (json.JSONDecodeError, TypeError):
                user_dict['preferences'] = {}
        
        return jsonify({
            'message': 'Login successful', 
            'token': token, 
            'user': user_dict
        })
    else:
        return jsonify({'message': 'Login successful', 'token': token})

# --- EXAMPLE PROTECTED ENDPOINT ---
@app.route('/api/protected', methods=['GET'])
@jwt_required
def protected():
    return jsonify({'message': f'Hello, user {g.user_id} with email {g.email}! This is a protected endpoint.'})

# --- FORGOT PASSWORD ENDPOINT ---
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    """Generate and send password reset token for user"""
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({'error': 'Email is required', 'status': 'error'}), 400
        
        # Check if user exists
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('SELECT id, email FROM users WHERE email = %s', (email,))
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return jsonify({'error': 'User with this email does not exist', 'status': 'error'}), 404
        
        # Generate reset token
        reset_token = ''.join(random.choices(string.ascii_letters + string.digits + '-', k=43))
        
        # Store token in password_reset_otps table
        cur.execute('''
            INSERT INTO password_reset_otps (user_id, otp, expires_at)
            VALUES (%s, %s, NOW() + INTERVAL '1 hour')
        ''', (user[0], reset_token))
        
        conn.commit()
        cur.close()
        conn.close()
        
        # Send email with reset token (implement email sending logic)
        try:
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = EMAIL_FROM
            msg['To'] = email
            msg['Subject'] = 'Password Reset Request - FinSight AI'
            
            body = f'''
            Hello,
            
            You requested a password reset for your FinSight AI account.
            
            Your password reset token is: {reset_token}
            
            This token will expire in 1 hour.
            
            Please use this token along with your new password to reset your password.
            
            If you didn't request this password reset, please ignore this email.
            
            Best regards,
            FinSight AI Team
            '''
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP('smtp.gmail.com', 587)
            server.starttls()
            server.login(GMAIL_USER, GMAIL_APP_PASSWORD)
            server.send_message(msg)
            server.quit()
            
        except Exception as email_error:
            print(f"Error sending email: {email_error}")
            # Still return success even if email fails (for development)
        
        return jsonify({
            'message': 'Password reset token sent to your email',
            'status': 'success',
            'email': email
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# --- RESET PASSWORD ENDPOINT ---
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    """Reset user password using token and new password"""
    try:
        data = request.get_json()
        email = data.get('email')
        token = data.get('token')
        new_password_hash = data.get('new_password_hash')
        
        if not all([email, token, new_password_hash]):
            return jsonify({
                'error': 'Email, token, and new_password_hash are required',
                'status': 'error'
            }), 400
        
        # Verify token and check if it's still valid
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT u.id, u.email, pro.otp, pro.expires_at 
            FROM users u
            JOIN password_reset_otps pro ON u.id = pro.user_id
            WHERE u.email = %s AND pro.otp = %s AND pro.expires_at > NOW()
        ''', (email, token))
        
        user = cur.fetchone()
        
        if not user:
            cur.close()
            conn.close()
            return jsonify({
                'error': 'Invalid or expired reset token',
                'status': 'error'
            }), 400
        
        # Update password in users table
        cur.execute('''
            UPDATE users 
            SET password_hash = %s
            WHERE id = %s
        ''', (new_password_hash, user[0]))
        
        # Remove used token from password_reset_otps table
        cur.execute('''
            DELETE FROM password_reset_otps 
            WHERE user_id = %s AND otp = %s
        ''', (user[0], token))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': 'Password reset successful',
            'status': 'success'
        })
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500


# ==================== USERS CRUD ENDPOINTS (PostgreSQL) ====================
@app.route('/api/users', methods=['GET'])
@jwt_required
def get_all_users():
    """Get all users (admin only endpoint)"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, email, name, profile_picture, phone_number, address, date_of_birth, gender, status, role, preferences, last_login, email_verified, two_factor_enabled, bio, created_at, updated_at
            FROM users 
            ORDER BY created_at DESC
        ''')
        rows = cur.fetchall()
        columns = ['id', 'email', 'name', 'profile_picture', 'phone_number', 'address', 'date_of_birth', 'gender', 'status', 'role', 'preferences', 'last_login', 'email_verified', 'two_factor_enabled', 'bio', 'created_at', 'updated_at']
        users = [dict(zip(columns, row)) for row in rows]
        
        # Parse JSON fields for proper output
        for user in users:
            if user.get('preferences'):
                try:
                    import json
                    user['preferences'] = json.loads(user['preferences']) if isinstance(user['preferences'], str) else user['preferences']
                except (json.JSONDecodeError, TypeError):
                    user['preferences'] = {}
        cur.close()
        conn.close()
        return jsonify({'data': users, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/users/<user_id>', methods=['GET'])
@jwt_required
def get_user_by_id(user_id):
    """Get user by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, email, name, profile_picture, phone_number, address, date_of_birth, gender, status, role, preferences, last_login, email_verified, two_factor_enabled, bio, created_at, updated_at
            FROM users 
            WHERE id = %s
        ''', (user_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if not row:
            return jsonify({'error': 'User not found', 'status': 'error'}), 404
            
        columns = ['id', 'email', 'name', 'profile_picture', 'phone_number', 'address', 'date_of_birth', 'gender', 'status', 'role', 'preferences', 'last_login', 'email_verified', 'two_factor_enabled', 'bio', 'created_at', 'updated_at']
        user = dict(zip(columns, row))
        
        # Parse JSON fields for proper output
        if user.get('preferences'):
            try:
                import json
                user['preferences'] = json.loads(user['preferences']) if isinstance(user['preferences'], str) else user['preferences']
            except (json.JSONDecodeError, TypeError):
                user['preferences'] = {}
        return jsonify({'data': user, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/users/<user_id>', methods=['PUT'])
@jwt_required
def update_user(user_id):
    """Update user by ID"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'error': 'User not found', 'status': 'error'}), 404
        
        # Build dynamic update query
        allowed_fields = ['name', 'profile_picture', 'phone_number', 'address', 'date_of_birth', 'gender', 'status', 'role', 'preferences', 'last_login', 'email_verified', 'two_factor_enabled', 'bio']
        update_clauses = []
        values = []
        
        for field in allowed_fields:
            if field in data:
                update_clauses.append(f"{field} = %s")
                # Handle JSONB field for preferences
                if field == 'preferences':
                    if isinstance(data[field], str):
                        # If it's a string, try to parse it as JSON
                        try:
                            import json
                            json.loads(data[field])  # Validate JSON
                            values.append(data[field])
                        except json.JSONDecodeError:
                            # If not valid JSON, convert string to JSON string
                            values.append(json.dumps(data[field]))
                    else:
                        # If it's already a dict/object, convert to JSON string
                        import json
                        values.append(json.dumps(data[field]))
                else:
                    values.append(data[field])
        
        if not update_clauses:
            cur.close()
            conn.close()
            return jsonify({'error': 'No valid fields to update', 'status': 'error'}), 400
        
        update_clauses.append("updated_at = %s")
        values.append(now)
        values.append(user_id)
        
        update_query = f'''
            UPDATE users 
            SET {', '.join(update_clauses)} 
            WHERE id = %s 
            RETURNING id, email, name, profile_picture, phone_number, address, date_of_birth, gender, status, role, preferences, last_login, email_verified, two_factor_enabled, bio, created_at, updated_at
        '''
        
        cur.execute(update_query, values)
        updated_row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        columns = ['id', 'email', 'name', 'profile_picture', 'phone_number', 'address', 'date_of_birth', 'gender', 'status', 'role', 'preferences', 'last_login', 'email_verified', 'two_factor_enabled', 'bio', 'created_at', 'updated_at']
        updated_user = dict(zip(columns, updated_row))
        
        # Parse JSON fields for proper output
        if updated_user.get('preferences'):
            try:
                import json
                updated_user['preferences'] = json.loads(updated_user['preferences']) if isinstance(updated_user['preferences'], str) else updated_user['preferences']
            except (json.JSONDecodeError, TypeError):
                updated_user['preferences'] = {}
        return jsonify({'data': updated_user, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/users/<user_id>', methods=['DELETE'])
@jwt_required
def delete_user(user_id):
    """Delete user by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Check if user exists
        cur.execute('SELECT id FROM users WHERE id = %s', (user_id,))
        if not cur.fetchone():
            cur.close()
            conn.close()
            return jsonify({'error': 'User not found', 'status': 'error'}), 404
        
        # Delete user (cascade delete will handle related records)
        cur.execute('DELETE FROM users WHERE id = %s RETURNING id', (user_id,))
        deleted_id = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({
            'message': f'User {deleted_id[0]} deleted successfully',
            'status': 'success'
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500


# ==================== RECURRING TRANSACTIONS ENDPOINTS (PostgreSQL) ====================
@app.route('/api/recurring-transactions', methods=['GET'])
@jwt_required
def get_recurring_transactions():
    """Get all recurring transactions for a user"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, description, last_run_date, run_count, max_occurrences, skip_count, failure_count, last_status, notes, timezone, parent_transaction_id, created_at, updated_at
            FROM recurring_transactions WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'description', 'last_run_date', 'run_count', 'max_occurrences', 'skip_count', 'failure_count', 'last_status', 'notes', 'timezone', 'parent_transaction_id', 'created_at', 'updated_at']
        user_recurring = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_recurring, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions', methods=['POST'])
@jwt_required
def create_recurring_transaction():
    """Create new recurring transaction"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        insert_query = '''
            INSERT INTO recurring_transactions (
                user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, description, last_run_date, run_count, max_occurrences, skip_count, failure_count, last_status, notes, timezone, parent_transaction_id, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, description, last_run_date, run_count, max_occurrences, skip_count, failure_count, last_status, notes, timezone, parent_transaction_id, created_at, updated_at
        '''
        values = (
            data.get('user_id'),
            data.get('name'),
            data.get('type'),
            float(data['amount']),
            data.get('frequency'),
            data.get('category'),
            data.get('source'),
            data.get('is_active', True),
            data.get('next_date'),
            data.get('start_date'),
            data.get('end_date'),
            data.get('occurrence_count'),
            data.get('description'),
            data.get('last_run_date'),
            data.get('run_count', 0),
            data.get('max_occurrences'),
            data.get('skip_count', 0),
            data.get('failure_count', 0),
            data.get('last_status'),
            data.get('notes'),
            data.get('timezone'),
            data.get('parent_transaction_id'),
            now,
            now
        )
        cur.execute(insert_query, values)
        new_rec = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'description', 'last_run_date', 'run_count', 'max_occurrences', 'skip_count', 'failure_count', 'last_status', 'notes', 'timezone', 'parent_transaction_id', 'created_at', 'updated_at']
        rec_dict = dict(zip(columns, new_rec))
        return jsonify({'data': rec_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['GET'])
@jwt_required
def get_recurring_transaction_by_id(recurring_id):
    """Get recurring transaction by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, description, last_run_date, run_count, max_occurrences, skip_count, failure_count, last_status, notes, timezone, parent_transaction_id, created_at, updated_at
            FROM recurring_transactions WHERE id = %s
        ''', (recurring_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'description', 'last_run_date', 'run_count', 'max_occurrences', 'skip_count', 'failure_count', 'last_status', 'notes', 'timezone', 'parent_transaction_id', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, row)), 'status': 'success'})
        else:
            return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['PUT'])
@jwt_required
def update_recurring_transaction(recurring_id):
    """Update recurring transaction"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'description', 'last_run_date', 'run_count', 'max_occurrences', 'skip_count', 'failure_count', 'last_status', 'notes', 'timezone', 'parent_transaction_id']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(recurring_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE recurring_transactions SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, description, last_run_date, run_count, max_occurrences, skip_count, failure_count, last_status, notes, timezone, parent_transaction_id, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'description', 'last_run_date', 'run_count', 'max_occurrences', 'skip_count', 'failure_count', 'last_status', 'notes', 'timezone', 'parent_transaction_id', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['DELETE'])
@jwt_required
def delete_recurring_transaction(recurring_id):
    """Delete recurring transaction"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM recurring_transactions WHERE id = %s RETURNING id', (recurring_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== NOTIFICATIONS ====================
@app.route('/api/notifications', methods=['GET'])
@jwt_required
def get_notifications():
    """Get all notifications"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id, created_at, updated_at
            FROM notifications WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'action_url', 'priority', 'expires_at', 'icon', 'channel', 'related_entity_id', 'scheduled_at', 'delivered_at', 'sender_id', 'group_id', 'created_at', 'updated_at']
        user_notifications = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_notifications, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications', methods=['POST'])
@jwt_required
def create_notification():
    """Create new notification"""
    try:
        data = request.get_json()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO notifications (
                user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id, created_at, updated_at
        ''', (
            data.get('user_id', 'demo-user-001'),
            data['title'],
            data['message'],
            data.get('type', 'info'),
            data.get('is_read', False),
            data.get('is_acknowledged', False),
            data.get('action_url'),
            data.get('priority'),
            data.get('expires_at'),
            data.get('icon'),
            data.get('channel'),
            data.get('related_entity_id'),
            data.get('scheduled_at'),
            data.get('delivered_at'),
            data.get('sender_id'),
            data.get('group_id')
        ))
        row = cur.fetchone()
        columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'action_url', 'priority', 'expires_at', 'icon', 'channel', 'related_entity_id', 'scheduled_at', 'delivered_at', 'sender_id', 'group_id', 'created_at', 'updated_at']
        new_notification = dict(zip(columns, row))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'data': new_notification, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['GET'])
@jwt_required
def get_notification_by_id(notification_id):
    """Get notification by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id, created_at, updated_at
            FROM notifications WHERE id = %s
        ''', (notification_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'action_url', 'priority', 'expires_at', 'icon', 'channel', 'related_entity_id', 'scheduled_at', 'delivered_at', 'sender_id', 'group_id', 'created_at', 'updated_at']
            notification = dict(zip(columns, row))
            return jsonify({'data': notification, 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['PUT'])
@jwt_required
def update_notification(notification_id):
    """Update notification (mark as read/unread)"""
    try:
        data = request.get_json()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            UPDATE notifications
            SET title = COALESCE(%s, title),
                message = COALESCE(%s, message),
                type = COALESCE(%s, type),
                is_read = COALESCE(%s, is_read),
                is_acknowledged = COALESCE(%s, is_acknowledged),
                action_url = COALESCE(%s, action_url),
                priority = COALESCE(%s, priority),
                expires_at = COALESCE(%s, expires_at),
                icon = COALESCE(%s, icon),
                channel = COALESCE(%s, channel),
                related_entity_id = COALESCE(%s, related_entity_id),
                scheduled_at = COALESCE(%s, scheduled_at),
                delivered_at = COALESCE(%s, delivered_at),
                sender_id = COALESCE(%s, sender_id),
                group_id = COALESCE(%s, group_id),
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id, created_at, updated_at
        ''', (
            data.get('title'),
            data.get('message'),
            data.get('type'),
            data.get('is_read'),
            data.get('is_acknowledged'),
            data.get('action_url'),
            data.get('priority'),
            data.get('expires_at'),
            data.get('icon'),
            data.get('channel'),
            data.get('related_entity_id'),
            data.get('scheduled_at'),
            data.get('delivered_at'),
            data.get('sender_id'),
            data.get('group_id'),
            notification_id
        ))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'action_url', 'priority', 'expires_at', 'icon', 'channel', 'related_entity_id', 'scheduled_at', 'delivered_at', 'sender_id', 'group_id', 'created_at', 'updated_at']
            notification = dict(zip(columns, row))
            return jsonify({'data': notification, 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['DELETE'])
@jwt_required
def delete_notification(notification_id):
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM notifications WHERE id = %s RETURNING id', (notification_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# PATCH endpoint to mark notification as seen
@app.route('/api/notifications/<notification_id>/seen', methods=['PATCH'])
@jwt_required
def mark_notification_seen(notification_id):
    """Mark notification as seen (is_read=true)"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            UPDATE notifications
            SET is_read = TRUE, updated_at = NOW()
            WHERE id = %s
            RETURNING id, user_id, title, message, type, is_read, is_acknowledged, action_url, priority, expires_at, icon, channel, related_entity_id, scheduled_at, delivered_at, sender_id, group_id, created_at, updated_at
        ''', (notification_id,))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'action_url', 'priority', 'expires_at', 'icon', 'channel', 'related_entity_id', 'scheduled_at', 'delivered_at', 'sender_id', 'group_id', 'created_at', 'updated_at']
            notification = dict(zip(columns, row))
            return jsonify({'data': notification, 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500
    """Delete notification"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM notifications WHERE id = %s RETURNING id', (notification_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== TRANSACTIONS ====================
@app.route('/api/transactions', methods=['GET'])
def get_transactions():
    """Get all transactions (income + expenses)"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        # Fetch income
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE user_id = %s
        ''', (user_id,))
        income_rows = cur.fetchall()
        income_columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        user_income = [dict(zip(income_columns, row)) for row in income_rows]
        # Fetch expenses from DB
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, created_at, updated_at
            FROM expenses WHERE user_id = %s
        ''', (user_id,))
        expense_rows = cur.fetchall()
        expense_columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'created_at', 'updated_at']
        user_expenses = [dict(zip(expense_columns, row)) for row in expense_rows]
        # Combine and sort by date
        all_transactions = []
        for inc in user_income:
            all_transactions.append({**inc, 'type': 'income'})
        for exp in user_expenses:
            all_transactions.append({**exp, 'type': 'expense'})
        all_transactions.sort(key=lambda x: x['date'], reverse=True)
        cur.close()
        conn.close()
        return jsonify({'data': all_transactions, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

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

# ==================== EXPENSES ENDPOINTS ====================
@app.route('/api/expenses', methods=['POST'])
@jwt_required
def create_expense():
    """Create new expense record"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        insert_query = '''
            INSERT INTO expenses (
                user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
        '''
        values = (
            data.get('user_id'),
            float(data['amount']),
            data.get('category'),
            data.get('description'),
            data.get('date'),
            data.get('payment_method'),
            data.get('merchant'),
            data.get('receipt_url'),
            data.get('recurring', False),
            data.get('tags'),
            data.get('status'),
            data.get('notes'),
            now,
            now
        )
        cur.execute(insert_query, values)
        new_expense = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes', 'created_at', 'updated_at']
        expense_dict = dict(zip(columns, new_expense))
        return jsonify({'data': expense_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses', methods=['GET'])
@jwt_required
def get_expenses():
    """Get all expenses for a user"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
            FROM expenses WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes', 'created_at', 'updated_at']
        user_expenses = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_expenses, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses/<expense_id>', methods=['GET'])
@jwt_required
def get_expense(expense_id):
    """Get a single expense by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
            FROM expenses WHERE id = %s
        ''', (expense_id,))
        row = cur.fetchone()
        columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes', 'created_at', 'updated_at']
        cur.close()
        conn.close()
        if row:
            return jsonify({'data': dict(zip(columns, row)), 'status': 'success'})
        else:
            return jsonify({'error': 'Expense not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses/<expense_id>', methods=['PUT'])
@jwt_required
def update_expense(expense_id):
    """Update expense record"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(expense_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE expenses SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Expense not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500
def update_expense(expense_id):
    """Update expense record"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(expense_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE expenses SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, amount, category, description, date, payment_method, merchant, receipt_url, recurring, tags, status, notes, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'payment_method', 'merchant', 'receipt_url', 'recurring', 'tags', 'status', 'notes', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Expense not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/expenses/<expense_id>', methods=['DELETE'])
@jwt_required
def delete_expense(expense_id):
    """Delete expense record"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM expenses WHERE id = %s RETURNING id', (expense_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Expense not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== INCOME ENDPOINTS ====================
@app.route('/api/income', methods=['POST'])
@jwt_required
def create_income():
    """Create new income record"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        insert_query = '''
            INSERT INTO income (
                user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
        '''
        values = (
            data.get('user_id'),
            float(data['amount']),
            data.get('source'),
            data.get('description'),
            data.get('frequency'),
            data.get('date'),
            data.get('currency', 'USD'),
            data.get('status', 'confirmed'),
            data.get('category'),
            data.get('recurring_id'),
            float(data['tax_deducted']) if data.get('tax_deducted') is not None else None,
            data.get('attachment_url'),
            now,
            now
        )
        cur.execute(insert_query, values)
        new_income = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        # Convert result to dict with column names
        columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        income_dict = dict(zip(columns, new_income))
        return jsonify({'data': income_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income', methods=['GET'])
@jwt_required
def get_income():
    """Get all income records"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        user_income = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()

        return jsonify({'data': user_income, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# Get a single income record by ID
@app.route('/api/income/<income_id>', methods=['GET'])
@jwt_required
def get_income_by_id(income_id):
    """Get a single income record by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE id = %s
        ''', (income_id,))
        row = cur.fetchone()
        columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        cur.close()
        conn.close()
        if row:
            return jsonify({'data': dict(zip(columns, row)), 'status': 'success'})
        else:
            return jsonify({'error': 'Income not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income/<income_id>', methods=['PUT'])
@jwt_required
def update_income(income_id):
    """Update income record"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        # Build dynamic SET clause
        fields = ['amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url']
        set_clauses = []
        values = []
        for field in fields:
            if field in data:
                set_clauses.append(f"{field} = %s")
                values.append(data[field])
        set_clauses.append("updated_at = %s")
        values.append(now)
        values.append(income_id)
        if not set_clauses:
            return jsonify({'error': 'No fields to update', 'status': 'error'}), 400
        update_query = f"""
            UPDATE income SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Income not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income/<income_id>', methods=['DELETE'])
@jwt_required
def delete_income(income_id):
    """Delete income record"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('DELETE FROM income WHERE id = %s RETURNING id', (income_id,))
        deleted = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if deleted:
            return jsonify({'status': 'success'})
        else:
            return jsonify({'error': 'Income not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== REPORTS ====================
@app.route('/api/reports', methods=['GET'])
@jwt_required
def get_reports():
    """Get all reports for authenticated user"""
    user_id = g.user_id
    print(f"🔍 Backend: GET /api/reports called for user_id: {user_id}")
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, report_type, date_range, format, generated_at, data, status, file_url, error_message, requested_at, completed_at, name, description, is_public, template_id, tags, created_at
            FROM reports WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'status', 'file_url', 'error_message', 'requested_at', 'completed_at', 'name', 'description', 'is_public', 'template_id', 'tags', 'created_at']
        user_reports = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        print(f"🔍 Backend: Found {len(user_reports)} reports for user {user_id}")
        return jsonify({'data': user_reports, 'status': 'success'})
    except Exception as e:
        print(f"❌ Backend: Error in get_reports: {str(e)}")
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/reports', methods=['POST'])
@jwt_required
def generate_report():
    """Generate new report"""
    try:
        data = request.get_json()
        user_id = g.user_id
        report_type = data.get('report_type', 'summary')
        date_range = data.get('date_range', {'start': '2024-03-01', 'end': '2024-03-31'})
        format_type = data.get('format', 'pdf')
        generated_at = datetime.datetime.now()
        requested_at = generated_at
        status = 'processing'
        # Get user data
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE user_id = %s
        ''', (user_id,))
        income_rows = cur.fetchall()
        income_columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        user_income = [dict(zip(income_columns, row)) for row in income_rows]
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, created_at, updated_at
            FROM expenses WHERE user_id = %s
        ''', (user_id,))
        expense_rows = cur.fetchall()
        expense_columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'created_at', 'updated_at']
        user_expenses = [dict(zip(expense_columns, row)) for row in expense_rows]
        cur.execute('''
            SELECT id, user_id, name, category, amount, month, alert_threshold, description, is_active, rollover, spent, created_at, updated_at
            FROM budgets WHERE user_id = %s
        ''', (user_id,))
        budget_rows = cur.fetchall()
        budget_columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'description', 'is_active', 'rollover', 'spent', 'created_at', 'updated_at']
        user_budgets = [dict(zip(budget_columns, row)) for row in budget_rows]
        cur.execute('''
            SELECT id, user_id, name, category, target_amount, current_amount, target_date, description, created_at, updated_at
            FROM savings_goals WHERE user_id = %s
        ''', (user_id,))
        goal_rows = cur.fetchall()
        goal_columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'created_at', 'updated_at']
        user_goals = [dict(zip(goal_columns, row)) for row in goal_rows]
        # Generate report data
        report_data = {
            'income': user_income,
            'expenses': user_expenses,
            'budgets': user_budgets,
            'savings_goals': user_goals,
            'total_income': sum(float(inc['amount']) for inc in user_income),
            'total_expenses': sum(float(exp['amount']) for exp in user_expenses),
            'net_income': sum(float(inc['amount']) for inc in user_income) - sum(float(exp['amount']) for exp in user_expenses),
            'budget_count': len(user_budgets),
            'savings_count': len(user_goals)
        }
        report_data = convert_decimal(report_data)
        cur.execute('''
            INSERT INTO reports (
                user_id, report_type, date_range, format, generated_at, data, status, file_url, error_message, requested_at, completed_at, name, description, is_public, template_id, tags, created_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, user_id, report_type, date_range, format, generated_at, data, status, file_url, error_message, requested_at, completed_at, name, description, is_public, template_id, tags, created_at
        ''', (
            user_id,
            report_type,
            json.dumps(date_range),
            format_type,
            generated_at,
            json.dumps(report_data),
            data.get('status'),
            data.get('file_url'),
            data.get('error_message'),
            data.get('requested_at', generated_at),
            data.get('completed_at'),
            data.get('name'),
            data.get('description'),
            data.get('is_public', False),
            data.get('template_id'),
            data.get('tags'),
            generated_at
        ))
        new_report = cur.fetchone()
        columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'status', 'file_url', 'error_message', 'requested_at', 'completed_at', 'name', 'description', 'is_public', 'template_id', 'tags', 'created_at']
        report_dict = dict(zip(columns, new_report))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'data': report_dict, 'status': 'success'})
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
        # Fetch income from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE user_id = %s
        ''', (user_id,))
        income_rows = cur.fetchall()
        income_columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        user_income = [dict(zip(income_columns, row)) for row in income_rows]
        cur.close()
        # Fetch expenses from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, created_at, updated_at
            FROM expenses WHERE user_id = %s AND to_char(date, 'YYYY-MM') = %s
        ''', (user_id, month))
        expense_rows = cur.fetchall()
        expense_columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'created_at', 'updated_at']
        user_expenses = [dict(zip(expense_columns, row)) for row in expense_rows]
        cur.close()
        # Fetch budgets from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, name, category, amount, month, alert_threshold, created_at, updated_at
            FROM budgets WHERE user_id = %s AND month = %s
        ''', (user_id, month))
        budget_rows = cur.fetchall()
        budget_columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'created_at', 'updated_at']
        user_budgets = [dict(zip(budget_columns, row)) for row in budget_rows]
        cur.close()
        # Fetch savings goals from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, name, category, target_amount, current_amount, target_date, description, created_at, updated_at
            FROM savings_goals WHERE user_id = %s
        ''', (user_id,))
        goal_rows = cur.fetchall()
        goal_columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'created_at', 'updated_at']
        user_goals = [dict(zip(goal_columns, row)) for row in goal_rows]
        cur.close()
        
        # Fetch recurring transactions from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
            FROM recurring_transactions WHERE user_id = %s AND is_active = true
        ''', (user_id,))
        recurring_rows = cur.fetchall()
        recurring_columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
        user_recurring = [dict(zip(recurring_columns, row)) for row in recurring_rows]
        cur.close()
        
        # Fetch notifications from DB
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
            FROM notifications WHERE user_id = %s AND is_read = false
        ''', (user_id,))
        notification_rows = cur.fetchall()
        notification_columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
        user_notifications = [dict(zip(notification_columns, row)) for row in notification_rows]
        cur.close()
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
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
            FROM income WHERE user_id = %s AND date >= %s AND date <= %s
        ''', (user_id, start_date, end_date))
        income_rows = cur.fetchall()
        income_columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
        user_income = [dict(zip(income_columns, row)) for row in income_rows]
        cur.close()
        conn.close()
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, amount, category, description, date, created_at, updated_at
            FROM expenses WHERE user_id = %s AND date >= %s AND date <= %s
        ''', (user_id, start_date, end_date))
        expense_rows = cur.fetchall()
        expense_columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'created_at', 'updated_at']
        user_expenses = [dict(zip(expense_columns, row)) for row in expense_rows]
        cur.close()
        # Fetch budgets from DB for analytics
        cur = get_db_conn().cursor()
        cur.execute('''
            SELECT id, user_id, name, category, amount, month, alert_threshold, created_at, updated_at
            FROM budgets WHERE user_id = %s AND date_part('year', to_date(month, 'YYYY-MM')) = date_part('year', %s::date)
        ''', (user_id, start_date))
        budget_rows = cur.fetchall()
        budget_columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'created_at', 'updated_at']
        user_budgets = [dict(zip(budget_columns, row)) for row in budget_rows]
        cur.close()
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
        # Budget breakdown
        budget_totals = {}
        for bud in user_budgets:
            budget_totals[bud['category']] = budget_totals.get(bud['category'], 0) + bud['amount']
        return jsonify({
            'data': {
                'monthly_income': monthly_income,
                'monthly_expenses': monthly_expenses,
                'category_breakdown': category_totals,
                'source_breakdown': source_totals,
                'budget_breakdown': budget_totals,
                'total_income': sum(inc['amount'] for inc in user_income),
                'total_expenses': sum(exp['amount'] for exp in user_expenses),
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
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Get counts from all tables
        cur.execute("SELECT COUNT(*) FROM users")
        users_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM income")
        income_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM expenses")
        expenses_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM budgets")
        budgets_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM savings_goals")
        savings_goals_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM recurring_transactions")
        recurring_transactions_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM notifications")
        notifications_count = cur.fetchone()[0]
        
        cur.execute("SELECT COUNT(*) FROM reports")
        reports_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'healthy', 
            'service': 'FinSight AI Backend API', 
            'version': '2.0',
            'data_counts': {
                'users': users_count,
                'income': income_count,
                'expenses': expenses_count,
                'budgets': budgets_count,
                'savings_goals': savings_goals_count,
                'recurring_transactions': recurring_transactions_count,
                'notifications': notifications_count,
                'transactions': income_count + expenses_count,  # Combined transactions
                'reports': reports_count
            }
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy', 
            'service': 'FinSight AI Backend API', 
            'version': '2.0',
            'error': str(e)
        }), 500

@app.route('/api/predict', methods=['POST'])
@jwt_required
def predict_expenses():
    """Enhanced expense prediction using real database data"""
    try:
        data = request.get_json()
        user_id = g.user_id if hasattr(g, 'user_id') else None
        
        # Get target month from request
        target_month = data.get('target_month')
        if not target_month:
            target_month = datetime.datetime.now().strftime('%Y-%m')
        
        # Fetch user's expense data from database
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT amount, category, date, description
            FROM expenses 
            WHERE user_id = %s 
            AND date >= NOW() - INTERVAL '12 months'
            ORDER BY date ASC
        ''', (user_id,))
        
        expense_data = []
        for row in cur.fetchall():
            expense_data.append({
                'amount': float(row[0]),
                'category': row[1],
                'date': row[2].strftime('%Y-%m-%d'),
                'description': row[3]
            })
        
        cur.close()
        conn.close()
        
        if not expense_data:
            return jsonify({'error': 'No expense data found for prediction. Add some expenses first.'}), 400
        
        # Make prediction using enhanced predictor
        result = predictor.predict_next_month(expense_data, target_month)
        
        if result['status'] == 'error':
            # Store failed prediction
            conn = get_db_conn()
            cur = conn.cursor()
            cur.execute('''
                INSERT INTO predictions (
                    user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
                ) VALUES (
                    %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s
                ) RETURNING id, user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
            ''', (
                user_id,
                None,
                target_month,
                result.get('prediction_type', 'enhanced_ml'),
                json.dumps(expense_data[:10]),  # Store sample of input data
                None,
                'failed',
                result.get('error'),
                '2.0',  # Enhanced model version
                'Enhanced ML prediction using real data',
                None,
                target_month + '-01'  # First day of month
            ))
            new_pred = cur.fetchone()
            conn.commit()
            cur.close()
            conn.close()
            columns = ['id', 'user_id', 'predicted_value', 'month', 'prediction_type', 'input_features', 'confidence_score', 'status', 'error_message', 'created_at', 'updated_at', 'model_version', 'notes', 'category', 'target_date']
            result_db = dict(zip(columns, new_pred))
            return jsonify({'prediction': result_db, 'status': 'error'}), 500
        
        # Store successful prediction
        if 'total_predicted' in result:
            predicted_value = result['total_predicted']
        else:
            predicted_value = result.get('prediction', 0)
        
        confidence_score = result.get('confidence_score', 0.85)
        status = 'completed'
        error_message = None
        
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO predictions (
                user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW(), %s, %s, %s, %s
            ) RETURNING id, user_id, predicted_value, month, prediction_type, input_features, confidence_score, status, error_message, created_at, updated_at, model_version, notes, category, target_date
        ''', (
            user_id,
            predicted_value,
            target_month,
            result.get('prediction_type', 'enhanced_ml'),
            json.dumps(expense_data[:10]),  # Store sample of input data
            confidence_score,
            status,
            error_message,
            '2.0',  # Enhanced model version
            'Enhanced ML prediction using real data',
            None,
            target_month + '-01'  # First day of month
        ))
        new_pred = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'predicted_value', 'month', 'prediction_type', 'input_features', 'confidence_score', 'status', 'error_message', 'created_at', 'updated_at', 'model_version', 'notes', 'category', 'target_date']
        result_db = dict(zip(columns, new_pred))
        
        # Combine prediction result with database record
        response_data = {
            'prediction': result_db,
            'enhanced_prediction': result,
            'status': 'success'
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/insights', methods=['POST'])
@jwt_required
def generate_insights():
    """Generate AI-powered financial insights using real database data"""
    try:
        user_id = g.user_id if hasattr(g, 'user_id') else None
        
        # Fetch user's expense data from database
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT amount, category, date, description
            FROM expenses 
            WHERE user_id = %s 
            AND date >= NOW() - INTERVAL '12 months'
            ORDER BY date DESC
        ''', (user_id,))
        
        expense_data = []
        for row in cur.fetchall():
            expense_data.append({
                'amount': float(row[0]),
                'category': row[1],
                'date': row[2].strftime('%Y-%m-%d'),
                'description': row[3]
            })
        
        cur.close()
        conn.close()
        
        if not expense_data:
            return jsonify({'error': 'No expense data found for insights. Add some expenses first.'}), 400
        
        # Generate insights using enhanced predictor
        result = predictor.generate_insights(expense_data)
        
        if result['status'] == 'error':
            return jsonify(result), 500
        
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

# ==================== UTILITY ENDPOINTS ====================
@app.route('/api/data-status', methods=['GET'])
def get_data_status():
    """Get current data status"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        
        # Fetch income
        cur.execute('SELECT COUNT(*) FROM income WHERE user_id = %s', (user_id,))
        income_count = cur.fetchone()[0]
        
        # Fetch expenses
        cur.execute('SELECT COUNT(*) FROM expenses WHERE user_id = %s', (user_id,))
        expenses_count = cur.fetchone()[0]
        
        # Fetch budgets
        cur.execute('SELECT COUNT(*) FROM budgets WHERE user_id = %s', (user_id,))
        budgets_count = cur.fetchone()[0]
        
        # Fetch savings goals
        cur.execute('SELECT COUNT(*) FROM savings_goals WHERE user_id = %s', (user_id,))
        savings_goals_count = cur.fetchone()[0]
        
        # Fetch recurring transactions
        cur.execute('SELECT COUNT(*) FROM recurring_transactions WHERE user_id = %s', (user_id,))
        recurring_transactions_count = cur.fetchone()[0]
        
        # Fetch notifications
        cur.execute('SELECT COUNT(*) FROM notifications WHERE user_id = %s', (user_id,))
        notifications_count = cur.fetchone()[0]
        
        # Fetch reports
        cur.execute('SELECT COUNT(*) FROM reports WHERE user_id = %s', (user_id,))
        reports_count = cur.fetchone()[0]
        
        cur.close()
        conn.close()
        
        return jsonify({
            'status': 'success',
            'data_counts': {
                'income': income_count,
                'expenses': expenses_count,
                'budgets': budgets_count,
                'savings_goals': savings_goals_count,
                'recurring_transactions': recurring_transactions_count,
                'notifications': notifications_count,
                'transactions': income_count + expenses_count,  # Combined transactions
                'reports': reports_count
            },
            'user_id': user_id
        })
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/clear-data', methods=['DELETE'])
def clear_all_data():
    """Clear all data (for testing) - Not implemented for PostgreSQL"""
    return jsonify({
        'error': 'Clear data endpoint not implemented for PostgreSQL. Use database migrations or direct SQL commands.',
        'status': 'error'
    }), 501


# ==================== CATEGORIES ENDPOINT (PostgreSQL) ====================
@app.route('/api/categories', methods=['GET'])
def get_categories():
    """Get available categories from PostgreSQL"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''SELECT id, name, type FROM categories ORDER BY name ASC''')
        rows = cur.fetchall()
        columns = ['id', 'name', 'type']
        categories = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': categories, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/income-sources', methods=['GET'])
def get_income_sources():
    """Get available income sources from PostgreSQL"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''SELECT id, name FROM income_sources ORDER BY name ASC''')
        rows = cur.fetchall()
        columns = ['id', 'name']
        sources = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': sources, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/export/data', methods=['GET'])
def export_data():
    """Export all data as JSON"""
    user_id = request.args.get('user_id', 'demo-user-001')
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('''
        SELECT id, user_id, amount, source, description, frequency, date, currency, status, category, recurring_id, tax_deducted, attachment_url, created_at, updated_at
        FROM income WHERE user_id = %s
    ''', (user_id,))
    income_rows = cur.fetchall()
    income_columns = ['id', 'user_id', 'amount', 'source', 'description', 'frequency', 'date', 'currency', 'status', 'category', 'recurring_id', 'tax_deducted', 'attachment_url', 'created_at', 'updated_at']
    user_income = [dict(zip(income_columns, row)) for row in income_rows]
    cur.close()
    conn.close()
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, amount, category, description, date, created_at, updated_at
        FROM expenses WHERE user_id = %s
    ''', (user_id,))
    expense_rows = cur.fetchall()
    expense_columns = ['id', 'user_id', 'amount', 'category', 'description', 'date', 'created_at', 'updated_at']
    user_expenses = [dict(zip(expense_columns, row)) for row in expense_rows]
    cur.close()
    # Fetch budgets from DB
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, name, category, amount, month, alert_threshold, created_at, updated_at
        FROM budgets WHERE user_id = %s
    ''', (user_id,))
    budget_rows = cur.fetchall()
    budget_columns = ['id', 'user_id', 'name', 'category', 'amount', 'month', 'alert_threshold', 'created_at', 'updated_at']
    user_budgets = [dict(zip(budget_columns, row)) for row in budget_rows]
    cur.close()
    # Fetch savings goals from DB
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, name, category, target_amount, current_amount, target_date, description, created_at, updated_at
        FROM savings_goals WHERE user_id = %s
    ''', (user_id,))
    goal_rows = cur.fetchall()
    goal_columns = ['id', 'user_id', 'name', 'category', 'target_amount', 'current_amount', 'target_date', 'description', 'created_at', 'updated_at']
    user_goals = [dict(zip(goal_columns, row)) for row in goal_rows]
    cur.close()
    
    # Fetch recurring transactions from DB
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
        FROM recurring_transactions WHERE user_id = %s
    ''', (user_id,))
    recurring_rows = cur.fetchall()
    recurring_columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
    user_recurring = [dict(zip(recurring_columns, row)) for row in recurring_rows]
    cur.close()
    
    # Fetch notifications from DB
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
        FROM notifications WHERE user_id = %s
    ''', (user_id,))
    notification_rows = cur.fetchall()
    notification_columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
    user_notifications = [dict(zip(notification_columns, row)) for row in notification_rows]
    cur.close()
    
    # Fetch reports from DB
    cur = get_db_conn().cursor()
    cur.execute('''
        SELECT id, user_id, report_type, date_range, format, generated_at, data, created_at
        FROM reports WHERE user_id = %s
    ''', (user_id,))
    report_rows = cur.fetchall()
    report_columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'created_at']
    user_reports = [dict(zip(report_columns, row)) for row in report_rows]
    cur.close()
    
    # Combine income and expenses for transactions
    all_transactions = []
    for inc in user_income:
        all_transactions.append({**inc, 'type': 'income'})
    for exp in user_expenses:
        all_transactions.append({**exp, 'type': 'expense'})
    
    user_data = {
        'income': user_income,
        'expenses': user_expenses,
        'budgets': user_budgets,
        'savings_goals': user_goals,
        'recurring_transactions': user_recurring,
        'notifications': user_notifications,
        'transactions': all_transactions,
        'reports': user_reports
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
            'auth': {
                'register': '/api/register',
                'login': '/api/login',
                'login-verify': '/api/login/verify-otp',
                'verify-email': '/api/users/verify-email',
                'forgot-password': '/api/forgot-password',
                'reset-password': '/api/reset-password'
            },
            'users': {
                'get_all': '/api/users',
                'get_by_id': '/api/users/<user_id>',
                'update': '/api/users/<user_id>',
                'delete': '/api/users/<user_id>'
            },
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
    port_value = os.environ.get('PORT')
    if not port_value:
        raise RuntimeError('PORT is not set')

    port = int(port_value)
    print(f"🚀 FinSight AI Backend API starting on port {port}")
    print(f"📊 Health check: http://localhost:{port}/api/health")
    print(f"📈 Data status: http://localhost:{port}/api-data-status")
    print(f"🧹 Clear data: DELETE http://localhost:{port}/api/clear-data")
    print(f"📚️ Root endpoint: http://localhost:{port}/")
    print(f"🎯 Ready for frontend integration!")
    app.run(host='0.0.0.0', port=port, debug=True)
