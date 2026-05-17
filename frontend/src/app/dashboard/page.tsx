'use client'


import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import { AppLayout } from '@/components/layout/AppLayout'
import { incomeApi, expenseApi, savingsApi, budgetApi, transactionApi } from '@/lib/api/production'
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  PiggyBank,
  AlertCircle,
  Calendar,
  Target,
  CreditCard,
  RefreshCw
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
  budgets: any[]
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalIncome: 0,
    totalExpenses: 0,
    currentSavings: 0,
    monthlyBudget: 0,
    budgetUsed: 0,
    recentTransactions: [],
    savingsGoals: [],
    predictions: [],
    budgets: []
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [user])

  const fetchDashboardData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      // Get current user ID from localStorage (same as income/expense pages)
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      // Calculate current month for budget fetching
      const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM format
      
      if (!userId) {
        console.warn('⚠️ No user ID found - user might not be logged in')
        setError('Please log in to view dashboard data')
        return
      }

      // Fetch all data in parallel
      const [incomeResponse, expenseResponse, goalsResponse, budgetsResponse, transactionsResponse] = await Promise.all([
        incomeApi.getAll(userId),
        expenseApi.getAll(userId),
        savingsApi.getAll(userId),
        budgetApi.getAll(userId, currentMonth),
        transactionApi.getAll(userId)
      ])


      // Process data the same way as income/expense pages
      const incomeData = Array.isArray(incomeResponse.data) ? incomeResponse.data.filter(item => 
        item && 
        typeof item.id === 'string' && 
        (typeof item.amount === 'number' || typeof item.amount === 'string') && 
        typeof item.source === 'string' &&
        typeof item.date === 'string'
      ).map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })) : []

      const expenseData = Array.isArray(expenseResponse.data) ? expenseResponse.data.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })) : []

      const goalsData = Array.isArray(goalsResponse.data) ? goalsResponse.data.map(item => ({
        ...item,
        current_amount: typeof item.current_amount === 'string' ? parseFloat(item.current_amount) : item.current_amount,
        target_amount: typeof item.target_amount === 'string' ? parseFloat(item.target_amount) : item.target_amount
      })) : []

      const budgetsData = Array.isArray(budgetsResponse.data) ? budgetsResponse.data.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : (item.amount || 0),
        spent: typeof item.spent === 'string' ? parseFloat(item.spent) || 0 : (item.spent || 0)
      })) : []
      
      const transactionsData = Array.isArray(transactionsResponse.data) ? transactionsResponse.data.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : (item.amount || 0)
      })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()) : []
      
      console.log('📊 Budget API Response:', budgetsResponse)
      console.log('💰 Processed budgets data:', budgetsData)
      console.log('🔍 Budget data sample:', budgetsData[0])
      console.log('💳 Transaction API Response:', transactionsResponse)
      console.log('💸 Processed transactions data:', transactionsData)
      console.log('🔍 Transaction data sample:', transactionsData[0])

      // Calculate totals from actual data
      const totalIncome = incomeData.reduce((sum: number, income: any) => {
        if (!income.date) return sum
        const incomeMonth = new Date(income.date).toISOString().slice(0, 7)
        return incomeMonth === currentMonth ? sum + (income.amount || 0) : sum
      }, 0)

      const totalExpenses = expenseData.reduce((sum: number, expense: any) => {
        if (!expense.date) return sum
        const expenseMonth = new Date(expense.date).toISOString().slice(0, 7)
        return expenseMonth === currentMonth ? sum + (expense.amount || 0) : sum
      }, 0)

      const activeGoals = goalsData.filter((goal: any) => 
        goal.status === 'active' || (!goal.status && (goal.current_amount || 0) < (goal.target_amount || 0))
      )


      const currentSavings = activeGoals.reduce((sum: number, goal: any) => {
        const amount = Number(goal.current_amount) || 0
        const validAmount = isNaN(amount) ? 0 : amount
        return sum + validAmount
      }, 0)



      // Calculate budget totals
      const totalBudgetLimit = budgetsData.reduce((sum: number, budget: any) => {
        const amount = Number(budget.amount) || 0
        const validAmount = isNaN(amount) ? 0 : amount
        console.log(`💰 Processing budget ${budget.name}: amount=${budget.amount}, validAmount=${validAmount}`)
        return sum + validAmount
      }, 0)
      
      const totalBudgetSpent = budgetsData.reduce((sum: number, budget: any) => {
        const spent = Number(budget.spent) || 0
        const validSpent = isNaN(spent) ? 0 : spent
        console.log(`💸 Processing budget spent ${budget.name}: spent=${budget.spent}, validSpent=${validSpent}`)
        return sum + validSpent
      }, 0)
      
      console.log('📈 Final budget calculations:', {
        totalBudgetLimit,
        totalBudgetSpent,
        budgetsCount: budgetsData.length,
        isLimitNaN: isNaN(totalBudgetLimit),
        isSpentNaN: isNaN(totalBudgetSpent)
      })
      
      const updatedStats: DashboardStats = {
        totalIncome,
        totalExpenses,
        currentSavings,
        monthlyBudget: totalBudgetLimit,
        budgetUsed: totalBudgetSpent,
        recentTransactions: transactionsData.slice(0, 10), // Show last 10 transactions
        savingsGoals: activeGoals,
        predictions: [], // Will be fetched from ML predictions when implemented
        budgets: budgetsData
      }

      setStats(updatedStats)
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error)
      setError('Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
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

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-8">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground">{error}</p>
            <button 
              onClick={() => fetchDashboardData(true)}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
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
        <div className="pb-4 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Welcome back, {user?.name || user?.email}!
            </h1>
            <p className="text-muted-foreground">Here's your financial overview for this month</p>
          </div>
          <button
            onClick={() => fetchDashboardData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
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
                ₹{stats.totalIncome.toLocaleString()}
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
                ₹{stats.totalExpenses.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </Card>
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <IndianRupee className="h-6 w-6 text-blue-600" />
                <span className="text-sm text-blue-600 font-medium">Net</span>
              </div>
              <div className={`text-3xl font-bold mb-1 ${stats.totalIncome - stats.totalExpenses >= 0 ? 'text-foreground' : 'text-destructive'}`}>
                ₹{Math.abs(stats.totalIncome - stats.totalExpenses).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Cash flow</p>
              <div className={`mt-2 text-xs ${stats.totalIncome - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.totalIncome - stats.totalExpenses >= 0 ? 'Positive' : 'Negative'} cash flow
              </div>
            </div>
          </Card>
          <Card className="bg-card border-border hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Target className="h-6 w-6 text-purple-600" />
                <span className="text-sm text-purple-600 font-medium">Savings</span>
              </div>
              <div className="text-3xl font-bold text-foreground mb-1">
                ₹{Number(stats.currentSavings || 0).toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              {(() => {
                const totalTarget = stats.savingsGoals.reduce((sum: number, goal: any) => {
                  const target = Number(goal.target_amount) || 0
                  return sum + (isNaN(target) ? 0 : target)
                }, 0)
                const currentSavings = Number(stats.currentSavings) || 0
                const progressPercentage = totalTarget > 0 ? (currentSavings / totalTarget) * 100 : 0
                

                return (
                  <div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-2">
                      <div
                        className="bg-purple-600 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercentage.toFixed(1)}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {stats.savingsGoals.length} active goal{stats.savingsGoals.length !== 1 ? 's' : ''}
                    </p>
                    <div className="text-xs text-purple-600 mt-2">
                      {progressPercentage.toFixed(1)}% Complete
                    </div>
                  </div>
                )
              })()}
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
                budgets={stats.budgets}
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
              <SavingsGoals goals={stats.savingsGoals} onGoalCreated={() => fetchDashboardData(true)} />
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
