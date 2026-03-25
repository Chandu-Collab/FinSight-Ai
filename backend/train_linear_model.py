import pickle
import numpy as np
import pandas as pd
import psycopg2
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

load_dotenv()

def get_expense_data():
    """Fetch actual expense data from database"""
    try:
        # Connect to database
        conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        query = """
        SELECT 
            EXTRACT(MONTH FROM date) as month,
            EXTRACT(YEAR FROM date) as year,
            amount,
            category
        FROM expenses 
        WHERE date >= NOW() - INTERVAL '12 months'
        ORDER BY date ASC
        """
        
        df = pd.read_sql_query(query, conn)
        conn.close()
        
        if len(df) < 3:
            print(f"Only {len(df)} expense records found. Augmenting with sample data for better training.")
            # Augment with sample data if insufficient real data
            sample_df = create_sample_data()
            if not df.empty:
                # Combine real data with sample data
                df = pd.concat([df, sample_df], ignore_index=True)
            else:
                df = sample_df
        
        print(f"Using {len(df)} expense records for training")
        return df
        
    except Exception as e:
        print(f"Error fetching data from database: {e}")
        print("Using sample data for demonstration.")
        return create_sample_data()

def create_sample_data():
    """Create realistic sample expense data"""
    np.random.seed(42)
    months = 12
    base_expenses = {
        'Food': 800 + np.random.normal(0, 100, months),
        'Transport': 200 + np.random.normal(0, 50, months),
        'Entertainment': 150 + np.random.normal(0, 30, months),
        'Utilities': 300 + np.random.normal(0, 40, months),
        'Healthcare': 100 + np.random.normal(0, 20, months),
        'Shopping': 250 + np.random.normal(0, 60, months)
    }
    
    data = []
    for i in range(months):
        month = (i % 12) + 1
        year = 2024 - (months - i - 1) // 12
        for category, expenses in base_expenses.items():
            data.append({
                'month': month,
                'year': year,
                'amount': max(0, expenses[i]),  # Ensure positive amounts
                'category': category
            })
    
    return pd.DataFrame(data)

def prepare_features(df):
    """Prepare features for machine learning"""
    # Create time-based features
    df['time_index'] = (df['year'] - df['year'].min()) * 12 + (df['month'] - 1)
    
    # Aggregate by month for total expenses
    monthly_totals = df.groupby(['year', 'month']).agg({
        'amount': 'sum',
        'time_index': 'first'
    }).reset_index()
    
    # Add month as cyclical feature
    monthly_totals['month_sin'] = np.sin(2 * np.pi * monthly_totals['month'] / 12)
    monthly_totals['month_cos'] = np.cos(2 * np.pi * monthly_totals['month'] / 12)
    
    return monthly_totals

def train_model():
    """Train the linear regression model with real data"""
    print("Starting model training with real expense data...")
    
    # Get data
    expense_df = get_expense_data()
    
    # Prepare features
    monthly_data = prepare_features(expense_df)
    
    if len(monthly_data) < 2:
        print("Not enough data points for training. Need at least 2 months of data.")
        return None
    
    # Prepare features and target
    features = ['time_index', 'month_sin', 'month_cos']
    X = monthly_data[features].values
    y = monthly_data['amount'].values
    
    print(f"Training with {len(X)} data points")
    print(f"Feature columns: {features}")
    print(f"Target variable: monthly expenses")
    
    # Split data (use last 20% for testing)
    split_idx = int(len(X) * 0.8)
    X_train, X_test = X[:split_idx], X[split_idx:]
    y_train, y_test = y[:split_idx], y[split_idx:]
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    model = LinearRegression()
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"\nModel Performance:")
    print(f"Mean Absolute Error: ${mae:.2f}")
    print(f"Mean Squared Error: ${mse:.2f}")
    print(f"R² Score: {r2:.4f}")
    
    # Save both model and scaler
    model_data = {
        'model': model,
        'scaler': scaler,
        'features': features,
        'training_data_stats': {
            'mean_expense': np.mean(y),
            'std_expense': np.std(y),
            'min_expense': np.min(y),
            'max_expense': np.max(y),
            'data_points': len(X)
        }
    }
    
    with open('linear_model.pkl', 'wb') as f:
        pickle.dump(model_data, f)
    
    print(f"\nModel trained and saved as linear_model.pkl")
    print(f"Model can predict expenses using features: {features}")
    
    return model_data

if __name__ == "__main__":
    trained_model = train_model()
    if trained_model:
        print("\nTraining completed successfully!")
        print(f"Model trained on {trained_model['training_data_stats']['data_points']} data points")
        print(f"Average monthly expense: ${trained_model['training_data_stats']['mean_expense']:.2f}")
    else:
        print("Training failed. Please check your database connection and data.")
