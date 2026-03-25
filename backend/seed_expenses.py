import psycopg2
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta
import random

load_dotenv()

def seed_sample_expenses():
    """Seed sample expense data for testing predictions"""
    
    # Sample expense categories and amounts
    expense_categories = {
        'Food': [50, 120, 85, 200, 65, 150, 90, 180, 75, 110],
        'Transport': [30, 45, 60, 25, 80, 40, 55, 35, 70, 50],
        'Entertainment': [40, 75, 30, 120, 60, 90, 45, 100, 55, 80],
        'Utilities': [150, 180, 160, 200, 140, 170, 190, 155, 175, 165],
        'Healthcare': [80, 120, 60, 200, 90, 150, 70, 180, 100, 130],
        'Shopping': [100, 250, 80, 300, 150, 200, 120, 280, 90, 220]
    }
    
    descriptions = {
        'Food': ['Groceries', 'Restaurant', 'Coffee shop', 'Fast food', 'Takeout'],
        'Transport': ['Gas', 'Uber', 'Bus pass', 'Parking', 'Car maintenance'],
        'Entertainment': ['Movies', 'Concert', 'Streaming service', 'Games', 'Books'],
        'Utilities': ['Electric bill', 'Water bill', 'Internet', 'Phone bill', 'Gas bill'],
        'Healthcare': ['Doctor visit', 'Pharmacy', 'Dental', 'Eye exam', 'Insurance'],
        'Shopping': ['Clothes', 'Electronics', 'Home goods', 'Books', 'Sports equipment']
    }
    
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        cur = conn.cursor()
        
        # Get a sample user (or create one)
        cur.execute('SELECT id FROM users LIMIT 1')
        user = cur.fetchone()
        
        if not user:
            print("No users found. Please create a user first.")
            return
        
        user_id = user[0]
        print(f"Seeding expenses for user: {user_id}")
        
        # Generate expenses for the last 6 months
        expenses = []
        base_date = datetime.now() - timedelta(days=180)
        
        for month_offset in range(6):
            for category, amounts in expense_categories.items():
                # Generate 2-4 expenses per category per month
                num_expenses = random.randint(2, 4)
                
                for i in range(num_expenses):
                    amount = random.choice(amounts) * random.uniform(0.8, 1.2)  # Add some variation
                    description = random.choice(descriptions[category])
                    
                    # Random date within the month
                    day = random.randint(1, 28)
                    expense_date = base_date + timedelta(days=month_offset * 30 + day)
                    
                    expenses.append((
                        user_id,
                        round(amount, 2),
                        category,
                        description,
                        expense_date.date()
                    ))
        
        # Insert expenses
        insert_query = '''
            INSERT INTO expenses (user_id, amount, category, description, date)
            VALUES (%s, %s, %s, %s, %s)
        '''
        
        cur.executemany(insert_query, expenses)
        conn.commit()
        
        print(f"✅ Successfully seeded {len(expenses)} expense records!")
        
        # Show summary
        cur.execute('''
            SELECT category, COUNT(*) as count, SUM(amount) as total
            FROM expenses 
            WHERE user_id = %s
            GROUP BY category
            ORDER BY total DESC
        ''', (user_id,))
        
        print("\n📊 Expense Summary by Category:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} transactions, ${row[2]:.2f} total")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error seeding expenses: {e}")

if __name__ == "__main__":
    seed_sample_expenses()
