'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Download, 
  Filter, 
  BarChart3, 
  PieChart, 
  Activity, 
  Target, 
  Zap, 
  Eye, 
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Users,
  ShoppingCart,
  CreditCard
} from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear } from 'date-fns'
import { cn } from '@/lib/utils'

interface AnalyticsData {
  totalIncome: number
  totalExpenses: number
  netSavings: number
  transactionCount: number
  averageTransaction: number
  topCategory: string
  monthlyTrend: Array<{ month: string, income: number, expenses: number }>
  categoryBreakdown: Array<{ category: string, amount: number, percentage: number }>
  dailySpending: Array<{ date: string, amount: number }>
  savingsRate: number
  budgetUtilization: number
  financialHealthScore: number
}

const timeRanges = [
  { value: '1m', label: 'Last Month' },
  { value: '3m', label: 'Last 3 Months' },
  { value: '6m', label: 'Last 6 Months' },
  { value: '1y', label: 'Last Year' },
  { value: 'all', label: 'All Time' }
]

const categoryIcons: Record<string, string> = {
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Shopping': '🛍',
  'Entertainment': '🎬',
  'Bills & Utilities': '📄',
  'Healthcare': '🏥',
  'Education': '📚',
  'Travel': '✈️',
  'Subscriptions': '📱',
  'Other': '📌'
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedTimeRange, setSelectedTimeRange] = useState('3m')
  const [selectedMetric, setSelectedMetric] = useState('overview')

  useEffect(() => {
    fetchAnalyticsData()
  }, [selectedTimeRange])

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      // Simulate API call with mock data
      const mockData: AnalyticsData = {
        totalIncome: 15000,
        totalExpenses: 8500,
        netSavings: 6500,
        transactionCount: 124,
        averageTransaction: 68.55,
        topCategory: 'Food & Dining',
        monthlyTrend: [
          { month: 'Jan', income: 5000, expenses: 2800 },
          { month: 'Feb', income: 5000, expenses: 2900 },
          { month: 'Mar', income: 5000, expenses: 2800 }
        ],
        categoryBreakdown: [
          { category: 'Food & Dining', amount: 2400, percentage: 28 },
          { category: 'Transportation', amount: 1200, percentage: 14 },
          { category: 'Shopping', amount: 1800, percentage: 21 },
          { category: 'Bills & Utilities', amount: 1500, percentage: 18 },
          { category: 'Entertainment', amount: 800, percentage: 9 },
          { category: 'Other', amount: 800, percentage: 10 }
        ],
        dailySpending: Array.from({ length: 30 }, (_, i) => ({
          date: format(subMonths(new Date(), 29 - i), 'MMM dd'),
          amount: Math.floor(Math.random() * 500) + 100
        })),
        savingsRate: 43.3,
        budgetUtilization: 72,
        financialHealthScore: 85
      }
      
      setAnalyticsData(mockData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getHealthScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Modern Header */}
      <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Analytics & Reports
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Deep insights into your financial data</p>
              </div>
            </div>
            <div className="flex space-x-2 sm:space-x-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-3 sm:px-4 py-2 border border-input rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
              >
                {timeRanges.map((range) => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>
              <Button variant="outline" className="border-border hover:bg-accent">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Savings</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-green-600">
                ${analyticsData?.netSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData?.savingsRate.toFixed(1)}% savings rate
              </p>
              <div className="mt-3 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">+12% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                ${analyticsData?.totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From all sources
              </p>
              <div className="mt-3 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-500">+8% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Expenses</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <ShoppingCart className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-orange-600">
                ${analyticsData?.totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analyticsData?.transactionCount} transactions
              </p>
              <div className="mt-3 flex items-center text-sm">
                <ArrowDownRight className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-500">-5% vs last period</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Health Score</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                {analyticsData?.financialHealthScore}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Financial health
              </p>
              <div className="mt-3">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getHealthScoreColor(analyticsData?.financialHealthScore || 0)}`}>
                  {getHealthScoreLabel(analyticsData?.financialHealthScore || 0)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Monthly Trend Chart */}
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Monthly Trend</CardTitle>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <Eye className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center border-2 border-dashed border-border rounded-xl">
                <div className="text-center">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">Monthly Trend Chart</p>
                  <p className="text-sm text-muted-foreground mt-2">Income vs Expenses over time</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Breakdown */}
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Category Breakdown</CardTitle>
              <Button variant="outline" size="sm" className="border-border hover:bg-accent">
                <PieChart className="h-4 w-4 mr-2" />
                View Details
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.categoryBreakdown.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{categoryIcons[category.category]}</span>
                      <span className="text-sm font-medium text-foreground">{category.category}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full"
                          style={{ width: `${category.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-semibold text-foreground w-12 text-right">
                        {category.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Top Spending Categories */}
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData?.categoryBreakdown.slice(0, 5).map((category, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <span className="text-sm">{categoryIcons[category.category]}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{category.category}</p>
                        <p className="text-xs text-muted-foreground">{category.percentage}% of total</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-foreground">${category.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Financial Insights */}
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Key Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <Zap className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800">Strong Savings Rate</p>
                      <p className="text-xs text-green-600 mt-1">You're saving {analyticsData?.savingsRate.toFixed(1)}% of your income</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">Budget Utilization</p>
                      <p className="text-xs text-blue-600 mt-1">{analyticsData?.budgetUtilization}% of budget used</p>
                    </div>
                  </div>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-xl">
                  <div className="flex items-start space-x-2">
                    <Clock className="h-5 w-5 text-orange-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">Avg Transaction</p>
                      <p className="text-xs text-orange-600 mt-1">${analyticsData?.averageTransaction.toFixed(2)} per transaction</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-foreground">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button variant="outline" className="w-full border-border hover:bg-accent">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full border-border hover:bg-accent">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced Filters
                </Button>
                <Button variant="outline" className="w-full border-border hover:bg-accent">
                  <Calendar className="h-4 w-4 mr-2" />
                  Schedule Reports
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
    </AppLayout>
  )
}
