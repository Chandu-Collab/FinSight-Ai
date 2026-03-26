'use client'


import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  AlertCircle,
  Calendar,
  Target,
  CreditCard
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { IncomeChart } from '@/components/dashboard/IncomeChart'
import { ExpenseChart } from '@/components/dashboard/ExpenseChart'
import { BudgetProgress } from '@/components/dashboard/BudgetProgress'
import { RecentTransactions } from '@/components/dashboard/RecentTransactions'
import { SavingsGoals } from '@/components/dashboard/SavingsGoals'
import { AIPredictions } from '@/components/dashboard/AIPredictions'

interface DashboardStats {
  totalIncome: number
  totalExpenses: number
  currentSavings: number
  monthlyBudget: number
  budgetUsed: number
  recentTransactions: any[]
  savingsGoals: any[]
  predictions: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  console.log('🔍 Dashboard rendering with user:', user)
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    currentSavings: 0,
    monthlyBudget: 0,
    budgetUsed: 0,
    recentTransactions: [],
    savingsGoals: [],
    predictions: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      // Mock data for now - replace with actual API calls
      const mockStats: DashboardStats = {
        totalIncome: 8500,
        totalExpenses: 5200,
        currentSavings: 3300,
        monthlyBudget: 6000,
        budgetUsed: 5200,
        recentTransactions: [
          { id: 1, type: 'expense', amount: 250, category: 'Food', date: '2024-03-25', description: 'Grocery shopping' },
          { id: 2, type: 'income', amount: 3500, source: 'Salary', date: '2024-03-24', description: 'Monthly salary' },
          { id: 3, type: 'expense', amount: 120, category: 'Transport', date: '2024-03-23', description: 'Gas refill' },
          { id: 4, type: 'expense', amount: 80, category: 'Entertainment', date: '2024-03-22', description: 'Movie tickets' },
        ],
        savingsGoals: [
          { id: 1, title: 'Emergency Fund', target: 10000, current: 6500, deadline: '2024-12-31' },
          { id: 2, title: 'Vacation', target: 3000, current: 1200, deadline: '2024-08-15' },
        ],
        predictions: [
          { month: 'April 2024', predicted: 5500, confidence: 85 },
          { month: 'May 2024', predicted: 5800, confidence: 75 },
        ]
      }
      setStats(mockStats)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  const budgetPercentage = (stats.budgetUsed / stats.monthlyBudget) * 100
  const isOverBudget = budgetPercentage > 100

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="pb-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Welcome back, {user?.name || user?.email}!
          </h1>
          <p className="text-muted-foreground">Here's your financial overview for this month</p>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="text-sm text-green-600 font-medium">Income</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                ${stats.totalIncome.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </Card>
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <TrendingDown className="h-6 w-6 text-red-600" />
                <span className="text-sm text-red-600 font-medium">Expenses</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                ${stats.totalExpenses.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </Card>
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Net</span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${stats.totalIncome - stats.totalExpenses >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                ${Math.abs(stats.totalIncome - stats.totalExpenses).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Cash flow</p>
            </div>
          </Card>
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Target className="h-6 w-6 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Savings</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">{stats.savingsGoals.length}</div>
              <p className="text-sm text-muted-foreground">Active goals</p>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Income Trend</h3>
                <IncomeChart />
              </div>
              <div className="bg-card p-6 rounded-lg border border-border">
                <h3 className="text-lg font-semibold text-foreground mb-4">Expenses by Category</h3>
                <ExpenseChart />
              </div>
            </div>

            {/* Budget Progress */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Budget Progress</h3>
              <BudgetProgress 
                budgetUsed={stats.budgetUsed} 
                budgetLimit={stats.monthlyBudget} 
              />
            </div>

            {/* Recent Transactions */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Transactions</h3>
              <RecentTransactions transactions={stats.recentTransactions} />
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Savings Goals */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">Savings Goals</h3>
              <SavingsGoals goals={stats.savingsGoals} />
            </div>

            {/* AI Predictions */}
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-semibold text-foreground mb-4">AI Predictions</h3>
              <AIPredictions predictions={stats.predictions} />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
