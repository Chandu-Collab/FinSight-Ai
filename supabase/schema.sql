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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL,
    source VARCHAR(100),
    description TEXT,
    frequency VARCHAR(50),
    date DATE NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(20) DEFAULT 'confirmed',
    category VARCHAR(50),
    recurring_id UUID,
    tax_deducted NUMERIC(12,2),
    attachment_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    payment_method VARCHAR(30),
    merchant VARCHAR(100),
    receipt_url TEXT,
    recurring BOOLEAN DEFAULT FALSE,
    tags TEXT,
    status VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    month VARCHAR(7),
    alert_threshold NUMERIC(5,2) DEFAULT 80,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    rollover BOOLEAN DEFAULT FALSE,
    spent NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);


-- Savings Goals table
CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    name VARCHAR(100),
    category VARCHAR(50),
    target_amount NUMERIC(12,2) NOT NULL,
    current_amount NUMERIC(12,2) DEFAULT 0,
    target_date DATE,
    description TEXT,
    status VARCHAR(20) DEFAULT 'active',
    priority VARCHAR(10) DEFAULT 'medium',
    progress_percentage NUMERIC(5,2) DEFAULT 0,
    image_url TEXT,
    notes TEXT,
    recurring_contribution NUMERIC(12,2) DEFAULT 0,
    last_contribution_date DATE,
    is_public BOOLEAN DEFAULT FALSE,
    completion_date DATE,
    motivation TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    predicted_value NUMERIC(12,2) NOT NULL,
    month VARCHAR(7) NOT NULL, -- e.g., '2024-03'
    prediction_type VARCHAR(50),
    input_features JSONB,
    confidence_score NUMERIC(5,4),
    status VARCHAR(20) DEFAULT 'completed',
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    model_version VARCHAR(50),
    notes TEXT,
    category VARCHAR(50),
    target_date DATE
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
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
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
    description TEXT,
    last_run_date DATE,
    run_count INTEGER DEFAULT 0,
    max_occurrences INTEGER,
    skip_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    last_status VARCHAR(20),
    notes TEXT,
    timezone VARCHAR(50),
    parent_transaction_id UUID REFERENCES recurring_transactions(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(255),
    message TEXT,
    type VARCHAR(50),
    is_read BOOLEAN DEFAULT FALSE,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    priority VARCHAR(20),
    expires_at TIMESTAMP,
    icon TEXT,
    channel VARCHAR(50),
    related_entity_id UUID,
    scheduled_at TIMESTAMP,
    delivered_at TIMESTAMP,
    sender_id UUID,
    group_id UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    report_type VARCHAR(50),
    date_range JSONB,
    format VARCHAR(20),
    generated_at TIMESTAMP,
    data JSONB,
    status VARCHAR(20),
    file_url TEXT,
    error_message TEXT,
    requested_at TIMESTAMP,
    completed_at TIMESTAMP,
    name VARCHAR(100),
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    template_id UUID,
    tags TEXT,
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

-- Migration: Add description column to budgets table (if it doesn't exist)
-- Run this if you're updating an existing database
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='budgets' AND column_name='description'
    ) THEN
        ALTER TABLE budgets ADD COLUMN description TEXT;
        RAISE NOTICE 'Added description column to budgets table';
    ELSE

        RAISE NOTICE 'Description column already exists in budgets table';
    END IF;
END $$;

-- Migration: Add is_active column to budgets table (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='budgets' AND column_name='is_active'
    ) THEN
        ALTER TABLE budgets ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE 'Added is_active column to budgets table';
    ELSE
        RAISE NOTICE 'is_active column already exists in budgets table';
    END IF;
END $$;
