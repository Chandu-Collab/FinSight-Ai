-- Supabase PostgreSQL schema for Personal Finance Manager

-- Income table
CREATE TABLE IF NOT EXISTS income (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(12,2) NOT NULL,
    source VARCHAR(100),
    date DATE NOT NULL
);

-- Expenses table
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    amount NUMERIC(12,2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    date DATE NOT NULL
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    category VARCHAR(50) NOT NULL,
    budget_limit NUMERIC(12,2) NOT NULL
);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    target_amount NUMERIC(12,2) NOT NULL,
    progress NUMERIC(12,2) DEFAULT 0
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    predicted_value NUMERIC(12,2) NOT NULL,
    month VARCHAR(7) NOT NULL -- e.g., '2024-03'
);
