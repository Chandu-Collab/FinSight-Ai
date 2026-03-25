import os
import smtplib
import random
import string
import datetime
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
load_dotenv()

app = Flask(__name__)
CORS(app)



######################## JWT REQUIRED DECORATOR (MOVED UP) ########################
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

# --- CONFIG ---
GMAIL_USER = os.environ.get('GMAIL_USER')
GMAIL_APP_PASSWORD = os.environ.get('GMAIL_APP_PASSWORD')
EMAIL_FROM = os.environ.get('EMAIL_FROM')
DB_URL = os.environ.get('DATABASE_URL')
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_here')

# --- DB CONNECTION ---
def get_db_conn():
    return psycopg2.connect(DB_URL)

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
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
    return token

# --- JWT REQUIRED DECORATOR ---
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
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
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
    if datetime.datetime.utcnow() > otp_expires_at:
        cur.close()
        conn.close()
        return jsonify({'error': 'OTP expired'}), 400
    # Insert into users
    cur.execute('INSERT INTO users (email, password_hash, name, phone_number, date_of_birth, gender, email_verified) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id',
                (email, password_hash, name, phone_number, date_of_birth, gender, True))
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
    password_hash = data['password_hash']
    conn = get_db_conn()
    cur = conn.cursor()
    cur.execute('SELECT id, email_verified FROM users WHERE email=%s AND password_hash=%s', (email, password_hash))
    row = cur.fetchone()
    if not row:
        cur.close()
        conn.close()
        return jsonify({'error': 'Invalid credentials'}), 401
    user_id, email_verified = row
    if not email_verified:
        cur.close()
        conn.close()
        return jsonify({'error': 'Email not verified'}), 403
    # Generate OTP and store in login_otps
    otp = generate_otp()
    expires_at = datetime.datetime.utcnow() + datetime.timedelta(minutes=10)
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
    if datetime.datetime.utcnow() > expires_at:
        cur.close()
        conn.close()
        return jsonify({'error': 'OTP expired'}), 400
    # OTP valid, delete it and issue JWT
    cur.execute('DELETE FROM login_otps WHERE user_id=%s', (user_id,))
    token = generate_jwt(user_id, email)
    cur.close()
    conn.close()
    return jsonify({'message': 'Login successful', 'token': token})

# --- EXAMPLE PROTECTED ENDPOINT ---
@app.route('/api/protected', methods=['GET'])
@jwt_required
def protected():
    return jsonify({'message': f'Hello, user {g.user_id} with email {g.email}! This is a protected endpoint.'})



# ==================== RECURRING TRANSACTIONS ENDPOINTS (PostgreSQL) ====================
@app.route('/api/recurring-transactions', methods=['GET'])
def get_recurring_transactions():
    """Get all recurring transactions for a user"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
            FROM recurring_transactions WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
        user_recurring = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_recurring, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions', methods=['POST'])
def create_recurring_transaction():
    """Create new recurring transaction"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        insert_query = '''
            INSERT INTO recurring_transactions (
                user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
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
            now,
            now
        )
        cur.execute(insert_query, values)
        new_rec = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
        rec_dict = dict(zip(columns, new_rec))
        return jsonify({'data': rec_dict, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['GET'])
def get_recurring_transaction_by_id(recurring_id):
    """Get recurring transaction by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
            FROM recurring_transactions WHERE id = %s
        ''', (recurring_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, row)), 'status': 'success'})
        else:
            return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['PUT'])
def update_recurring_transaction(recurring_id):
    """Update recurring transaction"""
    try:
        data = request.get_json()
        now = datetime.datetime.now()
        conn = get_db_conn()
        cur = conn.cursor()
        fields = ['name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count']
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
            UPDATE recurring_transactions SET {', '.join(set_clauses)} WHERE id = %s RETURNING id, user_id, name, type, amount, frequency, category, source, is_active, next_date, start_date, end_date, occurrence_count, created_at, updated_at
        """
        cur.execute(update_query, values)
        updated = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if updated:
            columns = ['id', 'user_id', 'name', 'type', 'amount', 'frequency', 'category', 'source', 'is_active', 'next_date', 'start_date', 'end_date', 'occurrence_count', 'created_at', 'updated_at']
            return jsonify({'data': dict(zip(columns, updated)), 'status': 'success'})
        else:
            return jsonify({'error': 'Recurring transaction not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/recurring-transactions/<recurring_id>', methods=['DELETE'])
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
def get_notifications():
    """Get all notifications"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
            FROM notifications WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
        user_notifications = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_notifications, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications', methods=['POST'])
def create_notification():
    """Create new notification"""
    try:
        data = request.get_json()
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            INSERT INTO notifications (user_id, title, message, type, is_read, is_acknowledged)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
        ''', (
            data.get('user_id', 'demo-user-001'),
            data['title'],
            data['message'],
            data.get('type', 'info'),
            data.get('is_read', False),
            data.get('is_acknowledged', False)
        ))
        row = cur.fetchone()
        columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
        new_notification = dict(zip(columns, row))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({'data': new_notification, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['GET'])
def get_notification_by_id(notification_id):
    """Get notification by ID"""
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
            FROM notifications WHERE id = %s
        ''', (notification_id,))
        row = cur.fetchone()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
            notification = dict(zip(columns, row))
            return jsonify({'data': notification, 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['PUT'])
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
                updated_at = NOW()
            WHERE id = %s
            RETURNING id, user_id, title, message, type, is_read, is_acknowledged, created_at, updated_at
        ''', (
            data.get('title'),
            data.get('message'),
            data.get('type'),
            data.get('is_read'),
            data.get('is_acknowledged'),
            notification_id
        ))
        row = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        if row:
            columns = ['id', 'user_id', 'title', 'message', 'type', 'is_read', 'is_acknowledged', 'created_at', 'updated_at']
            notification = dict(zip(columns, row))
            return jsonify({'data': notification, 'status': 'success'})
        return jsonify({'error': 'notification not found', 'status': 'error'}), 404
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/notifications/<notification_id>', methods=['DELETE'])
def delete_notification(notification_id):
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
def get_reports():
    """Get all reports"""
    user_id = request.args.get('user_id', 'demo-user-001')
    try:
        conn = get_db_conn()
        cur = conn.cursor()
        cur.execute('''
            SELECT id, user_id, report_type, date_range, format, generated_at, data, created_at
            FROM reports WHERE user_id = %s
        ''', (user_id,))
        rows = cur.fetchall()
        columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'created_at']
        user_reports = [dict(zip(columns, row)) for row in rows]
        cur.close()
        conn.close()
        return jsonify({'data': user_reports, 'status': 'success'})
    except Exception as e:
        return jsonify({'error': str(e), 'status': 'error'}), 500

@app.route('/api/reports', methods=['POST'])
def generate_report():
    """Generate new report"""
    try:
        data = request.get_json()
        user_id = data.get('user_id', 'demo-user-001')
        report_type = data.get('report_type', 'summary')
        date_range = data.get('date_range', {'start': '2024-03-01', 'end': '2024-03-31'})
        format_type = data.get('format', 'pdf')
        generated_at = datetime.datetime.now()
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
            'total_income': sum(inc['amount'] for inc in user_income),
            'total_expenses': sum(exp['amount'] for exp in user_expenses),
            'net_income': sum(inc['amount'] for inc in user_income) - sum(exp['amount'] for exp in user_expenses),
            'budget_count': len(user_budgets),
            'savings_count': len(user_goals)
        }
        cur.execute('''
            INSERT INTO reports (user_id, report_type, date_range, format, generated_at, data, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, user_id, report_type, date_range, format, generated_at, data, created_at
        ''', (
            user_id,
            report_type,
            json.dumps(date_range),
            format_type,
            generated_at,
            json.dumps(report_data),
            generated_at
        ))
        new_report = cur.fetchone()
        columns = ['id', 'user_id', 'report_type', 'date_range', 'format', 'generated_at', 'data', 'created_at']
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
        return jsonify({'error': str(e)}, 500)

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
    print(f"📈 Data status: http://localhost:{port}/api-data-status")
    print(f"🧹 Clear data: DELETE http://localhost:{port}/api/clear-data")
    print(f"📚️ Root endpoint: http://localhost:{port}/")
    print(f"🎯 Ready for frontend integration!")
    app.run(host='0.0.0.0', port=port, debug=True)
