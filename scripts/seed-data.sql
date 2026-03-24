-- Sample demo data for FinSight AI
-- This script populates the database with sample data for demonstration

-- Note: Replace USER_ID with actual user UUID from auth.users table
-- You can get this after user registration or create a test user

-- Sample Income Data
INSERT INTO income (user_id, amount, source, description, date) VALUES
('USER_ID_HERE', 5000.00, 'Salary', 'Monthly salary', '2024-01-15'),
('USER_ID_HERE', 5000.00, 'Salary', 'Monthly salary', '2024-02-15'),
('USER_ID_HERE', 5000.00, 'Salary', 'Monthly salary', '2024-03-15'),
('USER_ID_HERE', 1200.00, 'Freelance', 'Web design project', '2024-01-20'),
('USER_ID_HERE', 800.00, 'Freelance', 'Logo design', '2024-02-10'),
('USER_ID_HERE', 1500.00, 'Freelance', 'Mobile app UI', '2024-03-05'),
('USER_ID_HERE', 200.00, 'Investment', 'Dividend payment', '2024-01-30'),
('USER_ID_HERE', 250.00, 'Investment', 'Stock dividend', '2024-02-28'),
('USER_ID_HERE', 300.00, 'Investment', 'ETF distribution', '2024-03-31');

-- Sample Expense Data
INSERT INTO expenses (user_id, amount, category, description, date) VALUES
-- Food expenses
('USER_ID_HERE', 85.50, 'Food', 'Grocery shopping', '2024-01-05'),
('USER_ID_HERE', 45.00, 'Food', 'Restaurant dinner', '2024-01-12'),
('USER_ID_HERE', 120.00, 'Food', 'Weekly groceries', '2024-01-19'),
('USER_ID_HERE', 65.00, 'Food', 'Coffee and snacks', '2024-01-25'),
('USER_ID_HERE', 95.00, 'Food', 'Grocery shopping', '2024-02-02'),
('USER_ID_HERE', 55.00, 'Food', 'Lunch with colleagues', '2024-02-09'),
('USER_ID_HERE', 110.00, 'Food', 'Weekly groceries', '2024-02-16'),
('USER_ID_HERE', 40.00, 'Food', 'Coffee shop', '2024-02-23'),
('USER_ID_HERE', 88.00, 'Food', 'Grocery shopping', '2024-03-01'),
('USER_ID_HERE', 75.00, 'Food', 'Restaurant', '2024-03-08'),
('USER_ID_HERE', 125.00, 'Food', 'Weekly groceries', '2024-03-15'),
('USER_ID_HERE', 50.00, 'Food', 'Food delivery', '2024-03-22'),

-- Transport expenses
('USER_ID_HERE', 50.00, 'Transport', 'Gas refill', '2024-01-03'),
('USER_ID_HERE', 25.00, 'Transport', 'Uber ride', '2024-01-10'),
('USER_ID_HERE', 35.00, 'Transport', 'Public transport pass', '2024-01-17'),
('USER_ID_HERE', 45.00, 'Transport', 'Gas refill', '2024-01-24'),
('USER_ID_HERE', 30.00, 'Transport', 'Taxi', '2024-02-01'),
('USER_ID_HERE', 55.00, 'Transport', 'Gas refill', '2024-02-08'),
('USER_ID_HERE', 25.00, 'Transport', 'Uber ride', '2024-02-15'),
('USER_ID_HERE', 40.00, 'Transport', 'Gas refill', '2024-02-22'),
('USER_ID_HERE', 35.00, 'Transport', 'Parking', '2024-03-01'),
('USER_ID_HERE', 60.00, 'Transport', 'Gas refill', '2024-03-07'),
('USER_ID_HERE', 28.00, 'Transport', 'Uber ride', '2024-03-14'),
('USER_ID_HERE', 45.00, 'Transport', 'Gas refill', '2024-03-21'),

-- Entertainment expenses
('USER_ID_HERE', 120.00, 'Entertainment', 'Movie tickets', '2024-01-06'),
('USER_ID_HERE', 60.00, 'Entertainment', 'Concert tickets', '2024-01-13'),
('USER_ID_HERE', 45.00, 'Entertainment', 'Streaming services', '2024-01-20'),
('USER_ID_HERE', 80.00, 'Entertainment', 'Video games', '2024-01-27'),
('USER_ID_HERE', 150.00, 'Entertainment', 'Theater show', '2024-02-03'),
('USER_ID_HERE', 45.00, 'Entertainment', 'Streaming services', '2024-02-10'),
('USER_ID_HERE', 90.00, 'Entertainment', 'Bowling with friends', '2024-02-17'),
('USER_ID_HERE', 55.00, 'Entertainment', 'Movie night', '2024-02-24'),
('USER_ID_HERE', 45.00, 'Entertainment', 'Streaming services', '2024-03-02'),
('USER_ID_HERE', 200.00, 'Entertainment', 'Music festival', '2024-03-09'),
('USER_ID_HERE', 75.00, 'Entertainment', 'Dinner and show', '2024-03-16'),
('USER_ID_HERE', 45.00, 'Entertainment', 'Streaming services', '2024-03-23'),

-- Utilities expenses
('USER_ID_HERE', 150.00, 'Utilities', 'Electricity bill', '2024-01-05'),
('USER_ID_HERE', 80.00, 'Utilities', 'Internet bill', '2024-01-05'),
('USER_ID_HERE', 60.00, 'Utilities', 'Water bill', '2024-01-05'),
('USER_ID_HERE', 140.00, 'Utilities', 'Electricity bill', '2024-02-05'),
('USER_ID_HERE', 80.00, 'Utilities', 'Internet bill', '2024-02-05'),
('USER_ID_HERE', 55.00, 'Utilities', 'Water bill', '2024-02-05'),
('USER_ID_HERE', 160.00, 'Utilities', 'Electricity bill', '2024-03-05'),
('USER_ID_HERE', 80.00, 'Utilities', 'Internet bill', '2024-03-05'),
('USER_ID_HERE', 65.00, 'Utilities', 'Water bill', '2024-03-05'),

-- Shopping expenses
('USER_ID_HERE', 250.00, 'Shopping', 'Clothing', '2024-01-08'),
('USER_ID_HERE', 120.00, 'Shopping', 'Electronics', '2024-01-15'),
('USER_ID_HERE', 80.00, 'Shopping', 'Home supplies', '2024-01-22'),
('USER_ID_HERE', 180.00, 'Shopping', 'Clothing', '2024-01-29'),
('USER_ID_HERE', 300.00, 'Shopping', 'Electronics', '2024-02-05'),
('USER_ID_HERE', 150.00, 'Shopping', 'Clothing', '2024-02-12'),
('USER_ID_HERE', 90.00, 'Shopping', 'Books', '2024-02-19'),
('USER_ID_HERE', 200.00, 'Shopping', 'Home supplies', '2024-02-26'),
('USER_ID_HERE', 220.00, 'Shopping', 'Clothing', '2024-03-04'),
('USER_ID_HERE', 450.00, 'Shopping', 'Electronics', '2024-03-11'),
('USER_ID_HERE', 130.00, 'Shopping', 'Clothing', '2024-03-18'),
('USER_ID_HERE', 75.00, 'Shopping', 'Home supplies', '2024-03-25'),

-- Other expenses
('USER_ID_HERE', 100.00, 'Other', 'Medical checkup', '2024-01-10'),
('USER_ID_HERE', 50.00, 'Other', 'Pharmacy', '2024-01-18'),
('USER_ID_HERE', 200.00, 'Other', 'Car maintenance', '2024-01-25'),
('USER_ID_HERE', 80.00, 'Other', 'Gift', '2024-02-02'),
('USER_ID_HERE', 120.00, 'Other', 'Medical', '2024-02-14'),
('USER_ID_HERE', 300.00, 'Other', 'Car repair', '2024-02-20'),
('USER_ID_HERE', 60.00, 'Other', 'Pharmacy', '2024-02-28'),
('USER_ID_HERE', 150.00, 'Other', 'Insurance', '2024-03-06'),
('USER_ID_HERE', 90.00, 'Other', 'Medical', '2024-03-13'),
('USER_ID_HERE', 180.00, 'Other', 'Home repair', '2024-03-20');

-- Sample Budget Data
INSERT INTO budgets (user_id, category, limit, spent, month) VALUES
('USER_ID_HERE', 'Food', 1000.00, 850.00, '2024-01'),
('USER_ID_HERE', 'Transport', 400.00, 200.00, '2024-01'),
('USER_ID_HERE', 'Entertainment', 300.00, 450.00, '2024-01'),
('USER_ID_HERE', 'Utilities', 350.00, 290.00, '2024-01'),
('USER_ID_HERE', 'Shopping', 600.00, 630.00, '2024-01'),
('USER_ID_HERE', 'Other', 500.00, 350.00, '2024-01'),

('USER_ID_HERE', 'Food', 1000.00, 920.00, '2024-02'),
('USER_ID_HERE', 'Transport', 400.00, 250.00, '2024-02'),
('USER_ID_HERE', 'Entertainment', 300.00, 440.00, '2024-02'),
('USER_ID_HERE', 'Utilities', 350.00, 275.00, '2024-02'),
('USER_ID_HERE', 'Shopping', 600.00, 820.00, '2024-02'),
('USER_ID_HERE', 'Other', 500.00, 550.00, '2024-02'),

('USER_ID_HERE', 'Food', 1000.00, 880.00, '2024-03'),
('USER_ID_HERE', 'Transport', 400.00, 248.00, '2024-03'),
('USER_ID_HERE', 'Entertainment', 300.00, 565.00, '2024-03'),
('USER_ID_HERE', 'Utilities', 350.00, 305.00, '2024-03'),
('USER_ID_HERE', 'Shopping', 600.00, 875.00, '2024-03'),
('USER_ID_HERE', 'Other', 500.00, 480.00, '2024-03');

-- Sample Goals Data
INSERT INTO goals (user_id, title, target_amount, current_amount, deadline) VALUES
('USER_ID_HERE', 'Emergency Fund', 10000.00, 6500.00, '2024-12-31'),
('USER_ID_HERE', 'New Laptop', 2000.00, 1200.00, '2024-06-30'),
('USER_ID_HERE', 'Vacation Fund', 5000.00, 3200.00, '2024-08-15'),
('USER_ID_HERE', 'Investment Portfolio', 15000.00, 8500.00, '2025-01-31'),
('USER_ID_HERE', 'Home Renovation', 25000.00, 8000.00, '2025-06-30');

-- Sample Predictions Data (these would normally be generated by the ML service)
INSERT INTO predictions (user_id, predicted_amount, month, confidence_score) VALUES
('USER_ID_HERE', 3400.00, '2024-04', 0.82),
('USER_ID_HERE', 3500.00, '2024-05', 0.78),
('USER_ID_HERE', 3300.00, '2024-06', 0.75);
