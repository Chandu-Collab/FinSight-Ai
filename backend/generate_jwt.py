import jwt
import datetime
import os

# Load secret from .env or set directly
JWT_SECRET = os.environ.get('JWT_SECRET', 'your_super_secret_jwt_key_here')

# User info (replace with your actual values)
payload = {
    'user_id': 'demo-user-001',
    'email': 'demo@finsight-ai.com',
    'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
}

token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
print(token)
