# FinSight AI - Personal Finance Manager with AI-Based Prediction

## 🚀 Project Overview

FinSight AI is a comprehensive personal finance management application that helps users track income and expenses, set budgets, visualize financial data, and predict future spending using machine learning. Built as a BCA mini project exhibition with strong AI/ML demonstration capabilities.

## ✨ Key Features

### Core Features
- 🔐 **User Authentication** - Secure login/register with Supabase Auth
- 💰 **Income Tracking** - Add, edit, and manage income sources
- 💳 **Expense Tracking** - Comprehensive expense management with categorization
- 📊 **Budget Management** - Set monthly/category limits with real-time tracking
- 🚨 **Overspending Alerts** - Smart notifications when budgets are exceeded
- 📈 **Data Visualization** - Interactive charts and graphs
- 🎯 **Savings & Goals** - Track progress towards financial goals
- 📄 **Monthly Reports** - Export financial data as PDF/CSV
- 🔄 **Recurring Transactions** - Automated salary, rent, subscription tracking
- 🔍 **Search & Filters** - Find transactions by date, category, amount

### AI/ML Features
- 🤖 **Expense Prediction** - Linear Regression model for future spending
- 📉 **Pattern Detection** - Identify overspending trends
- 💡 **Smart Insights** - AI-generated financial recommendations
- 🎯 **Budget Optimization** - ML-powered saving suggestions

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS + ShadCN UI
- **Charts**: Recharts
- **Icons**: Lucide React
- **State Management**: React Hooks + Context API

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime Subscriptions
- **File Storage**: Supabase Storage

### ML Service
- **Language**: Python
- **Framework**: Flask
- **ML Library**: Scikit-learn
- **Data Processing**: Pandas, NumPy
- **Model**: Linear Regression with feature engineering

### Deployment
- **Frontend**: Vercel
- **ML API**: Render/Railway
- **Database**: Supabase Cloud

## 📁 Project Structure

```
FinSight-Ai/
├── frontend/                    # Next.js frontend application
│   ├── src/
│   │   ├── app/                # Next.js app router
│   │   │   ├── globals.css     # Global styles
│   │   │   ├── layout.tsx      # Root layout
│   │   │   └── page.tsx        # Home page
│   │   ├── components/         # React components
│   │   │   ├── ui/            # ShadCN UI components
│   │   │   └── dashboard/     # Dashboard components
│   │   ├── lib/               # Utility libraries
│   │   │   ├── supabase/      # Supabase client
│   │   │   └── utils.ts       # Helper functions
│   │   └── types/             # TypeScript definitions
│   ├── package.json           # Frontend dependencies
│   ├── next.config.js         # Next.js configuration
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   ├── tsconfig.json          # TypeScript configuration
│   └── postcss.config.js      # PostCSS configuration
├── ml-service/                # Python Flask ML API
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   └── .env.example          # Environment variables
├── supabase/
│   └── schema.sql             # Database schema
├── scripts/
│   └── seed-data.sql          # Sample demo data
├── docs/
│   ├── IMPLEMENTATION_PLAN.md # Day-wise implementation guide
│   └── README.md             # This file
└── backend/                   # Additional backend services (if needed)
```

## 🗄 Database Schema

### Core Tables
- **income** - User income records
- **expenses** - User expense records  
- **budgets** - Monthly budget limits
- **goals** - Savings goals tracking
- **predictions** - ML-generated predictions

### Security Features
- Row Level Security (RLS) policies
- User data isolation
- Secure authentication flows
- API key protection

## 🤖 Machine Learning Model

### Model Architecture
- **Algorithm**: Linear Regression
- **Features**: Month, year, day of week, seasonality, category encoding
- **Target**: Expense amount prediction
- **Training**: Historical user spending data

### API Endpoints
```python
POST /predict     # Generate expense predictions
POST /insights    # Get AI-powered insights
POST /train       # Train/update model
GET  /health      # Service health check
```

### Model Features
- **Time-based Features**: Month, year, day of week, quarter
- **Seasonal Patterns**: Holiday effects, monthly cycles
- **Category Analysis**: One-hot encoded spending categories
- **Trend Detection**: Moving averages, growth rates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- Python 3.9+
- Supabase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/FinSight-Ai.git
cd FinSight-Ai
```

2. **Set up frontend**
```bash
cd frontend
npm install
cp .env.local.example .env.local
# Configure Supabase credentials in .env.local
```

3. **Set up ML service**
```bash
cd ml-service
pip install -r requirements.txt
cp .env.example .env
# Configure environment variables
```

4. **Set up Supabase**
```sql
-- Run the schema.sql file in Supabase SQL editor
-- Configure RLS policies and authentication
```

5. **Run the application**
```bash
# Frontend
npm run dev

# ML Service (in separate terminal)
cd ml-service
python app.py
```

## 📊 Features Demonstration

### Dashboard Overview
- **Summary Cards**: Total income, expenses, savings, budget usage
- **Expense Charts**: Monthly trends and category breakdown
- **Recent Transactions**: Latest income/expense activities
- **Budget Alerts**: Real-time overspending warnings
- **AI Predictions**: Next month expense forecasts

### Transaction Management
- **Add Income**: Salary, freelance, investment income
- **Add Expenses**: Categorized spending with descriptions
- **Edit/Delete**: Full CRUD operations
- **Search/Filter**: By date, category, amount range

### Budget & Goals
- **Set Budgets**: Monthly limits by category
- **Track Progress**: Real-time spending vs budget
- **Savings Goals**: Target amounts with deadlines
- **Visual Progress**: Charts and progress bars

### AI Insights
- **Spending Patterns**: Category trends and anomalies
- **Budget Recommendations**: Optimization suggestions
- **Future Predictions**: ML-based expense forecasting
- **Smart Alerts**: Proactive financial advice

## 🎯 Exhibition Demo

### Demo Scenario
1. **User Registration** - Quick signup with email verification
2. **Data Entry** - Add sample income and expenses
3. **Dashboard Tour** - Explore all features and visualizations
4. **AI Prediction** - Demonstrate ML capabilities with live data
5. **Budget Management** - Create and track budget limits
6. **Goals Setting** - Set savings goals and monitor progress
7. **Reports Export** - Generate PDF/CSV financial reports

### Key Talking Points
- **Problem**: Manual financial tracking is inefficient and error-prone
- **Solution**: AI-powered automation with intelligent insights
- **Technology**: Modern full-stack with real-time capabilities
- **Innovation**: Machine learning for predictive financial planning
- **Impact**: Better financial decisions through data-driven insights

## 🔧 Configuration

### Environment Variables

#### Frontend (.env.local)
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
ML_API_URL=http://localhost:8000
```

#### ML Service (.env)
```env
FLASK_ENV=development
PORT=8000
CORS_ORIGINS=http://localhost:3000
```

### Supabase Setup
1. Create new project in Supabase Dashboard
2. Run `schema.sql` in SQL Editor
3. Configure Authentication providers
4. Set up RLS policies
5. Generate API keys

## 🧪 Testing

### Running Tests
```bash
# Frontend tests
npm test

# ML Service tests
cd ml-service
python -m pytest
```

### Test Coverage
- Component unit tests
- API integration tests
- ML model accuracy tests
- End-to-end user flows

## 📈 Performance

### Optimization Features
- Lazy loading components
- Image optimization
- API response caching
- Database indexing
- Bundle size optimization

### Metrics
- Page load time < 3 seconds
- ML prediction accuracy > 80%
- API response time < 500ms
- Mobile responsiveness 100%

## 🔒 Security

### Security Features
- Row Level Security (RLS)
- JWT token authentication
- API key protection
- HTTPS enforcement
- Input validation and sanitization
- CORS configuration

### Best Practices
- Environment variable protection
- SQL injection prevention
- XSS protection
- Secure password handling
- Regular security audits

## 🚀 Deployment

### Frontend (Vercel)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### ML Service (Render)
```bash
# Connect GitHub repository
# Configure build command: pip install -r requirements.txt
# Set start command: python app.py
# Configure environment variables
```

### Database (Supabase)
- Production schema applied
- RLS policies verified
- Backups configured
- Performance monitoring enabled

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Supabase for the amazing backend-as-a-service platform
- Vercel for seamless frontend deployment
- Scikit-learn for machine learning capabilities
- Tailwind CSS for beautiful UI components
- ShadCN UI for accessible component library

## 📞 Contact

**Project Team**: BCA Mini Project Team  
**Email**: your.email@college.edu  
**GitHub**: https://github.com/yourusername/FinSight-Ai

---

## 🔮 Future Scope

### Planned Enhancements
1. **Mobile Application** - React Native iOS/Android app
2. **Bank API Integration** - Direct transaction imports
3. **Advanced ML Models** - LSTM, Random Forest ensembles
4. **AI Chatbot** - Conversational financial advice
5. **Multi-Currency Support** - International finance tracking
6. **Investment Portfolio** - Stock and crypto tracking
7. **Bill Reminders** - Automated payment notifications
8. **Financial Health Score** - Overall financial wellness metric

### Business Opportunities
- Subscription premium features
- Financial advisor partnerships
- Bank integration services
- Corporate employee wellness programs
- Educational institution partnerships

---

**Built with ❤️ for BCA Mini Project Exhibition 2024**