-- Pending Users table for pre-verification registration
CREATE TABLE IF NOT EXISTS pending_users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    phone_number VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    otp VARCHAR(10) NOT NULL,
    otp_expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(12,2) NOT NULL,
    source VARCHAR(100),
    description TEXT,
    frequency VARCHAR(50),
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    month VARCHAR(7),
    alert_threshold NUMERIC(5,2) DEFAULT 80,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(100),
    category VARCHAR(50),
    target_amount NUMERIC(12,2) NOT NULL,
    current_amount NUMERIC(12,2) DEFAULT 0,
    target_date DATE,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    predicted_value NUMERIC(12,2) NOT NULL,
    month VARCHAR(7) NOT NULL -- e.g., '2024-03'
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    profile_picture VARCHAR(255),
    phone_number VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    role VARCHAR(50) DEFAULT 'user',
    preferences JSONB,
    last_login TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    bio TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recurring Transactions table
CREATE TABLE IF NOT EXISTS recurring_transactions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name VARCHAR(100),
    type VARCHAR(50),
    amount NUMERIC(12,2) NOT NULL,
    frequency VARCHAR(50),
    category VARCHAR(50),
    source VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    next_date DATE,
    start_date DATE,
    end_date DATE,
    occurrence_count INTEGER,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    report_type VARCHAR(50),
    date_range JSONB,
    format VARCHAR(20),
    generated_at TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User OTPs table for email verification
CREATE TABLE IF NOT EXISTS user_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Login OTPs table for login verification
CREATE TABLE IF NOT EXISTS login_otps (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    otp VARCHAR(10) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
