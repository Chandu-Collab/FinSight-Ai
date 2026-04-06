'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { budgetApi, Budget } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, Target, TrendingDown, AlertTriangle, Shield, AlertCircle, BarChart3, Zap, FileText } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const categoryIcons: Record<string, { icon: string, gradient: string }> = {
  'Food & Dining': { icon: 'ðŸ”', gradient: 'from-orange-500 to-red-500' },
  'Transportation': { icon: 'ðŸš—', gradient: 'from-blue-500 to-cyan-500' },
  'Shopping': { icon: 'ðŸ›', gradient: 'from-purple-500 to-pink-500' },
  'Entertainment': { icon: 'ðŸŽ¬', gradient: 'from-pink-500 to-rose-500' },
  'Bills & Utilities': { icon: 'ðŸ“„', gradient: 'from-gray-500 to-slate-500' },
  'Healthcare': { icon: 'ðŸ¥', gradient: 'from-green-500 to-emerald-500' },
  'Education': { icon: 'ðŸ“š', gradient: 'from-indigo-500 to-purple-500' },
  'Travel': { icon: 'âœˆï¸', gradient: 'from-yellow-500 to-amber-500' },
  'Subscriptions': { icon: 'ðŸ“±', gradient: 'from-teal-500 to-green-500' },
  'Other': { icon: 'ðŸ“Œ', gradient: 'from-gray-500 to-slate-500' }
}

export default function BudgetDetailPage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchBudget()
  }, [id])

  const fetchBudget = async () => {
    try {
      console.log('ðŸ” Fetching budget details for ID:', id)
      
      const response = await budgetApi.getById(id)
      console.log('ðŸ“Š Budget detail response:', response)
      
      if (response.data) {
        // Transform the data to ensure amounts are numbers
        const transformedData = {
          ...response.data,
          amount: typeof response.data.amount === 'string' ? parseFloat(response.data.amount) : response.data.amount,
          spent: typeof response.data.spent === 'string' ? parseFloat(response.data.spent) : response.data.spent,
          alert_threshold: typeof response.data.alert_threshold === 'string' ? parseFloat(response.data.alert_threshold) : response.data.alert_threshold
        }
        setBudget(transformedData)
      } else {
        toast.error('Budget record not found')
        router.push('/budgets')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch budget record')
      console.error('Error fetching budget:', error)
      router.push('/budgets')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this budget?')) {
      return
    }

    try {
      await budgetApi.delete(id)
      toast.success('Budget deleted successfully!')
      router.push('/budgets')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete budget')
      console.error('Error deleting budget:', error)
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-red-100 text-red-800 border-red-200'
    if (percentage >= 90) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (percentage >= 75) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 100) return <Target className="h-4 w-4" />
    if (percentage >= 90) return <AlertCircle className="h-4 w-4" />
    if (percentage >= 75) return <AlertTriangle className="h-4 w-4" />
    return <Shield className="h-4 w-4" />
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 100) return 'exceeded'
    if (percentage >= 90) return 'danger'
    if (percentage >= 75) return 'warning'
    return 'safe'
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-gradient-to-r from-red-500 to-pink-500'
    if (percentage >= 90) return 'bg-gradient-to-r from-orange-500 to-red-500'
    if (percentage >= 75) return 'bg-gradient-to-r from-yellow-500 to-amber-500'
    return 'bg-gradient-to-r from-green-500 to-emerald-500'
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading budget details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!budget) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Budget not found</h2>
            <p className="text-muted-foreground mb-4">The budget you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/budgets')}>
              Back to Budgets
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const percentage = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0
  const remaining = budget.amount - budget.spent
  const dailyAverage = budget.spent / Math.max(1, new Date().getDate())
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
  const projectedSpend = dailyAverage * daysInMonth

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background to-accent/20 min-h-screen">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push('/budgets')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Budgets</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Budget Details
                  </h1>
                  <p className="text-sm text-muted-foreground">View and manage budget information</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href={`/budgets/${id}/edit`}>
                  <Button variant="outline" className="border-border hover:bg-accent">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleDelete}
                  className="border-destructive hover:bg-destructive/10 text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Budget Card */}
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-foreground">Budget Information</CardTitle>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor(percentage)}`}>
                      {getStatusIcon(percentage)}
                      <span className="ml-1">{getStatusText(percentage)}</span>
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Budget Header */}
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6 border border-orange-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Budget Name</p>
                        <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
                          {budget.name}
                        </p>
                        <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                          {budget.category}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${categoryIcons[budget.category]?.gradient || 'from-gray-500 to-slate-500'}`}>
                        <span className="text-xl">{categoryIcons[budget.category]?.icon}</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Budget Progress</h3>
                      <span className="text-2xl font-bold text-foreground">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden mb-4">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${getProgressColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      >
                        <div className="h-full bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    
                    {/* Financial Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                        <p className="text-sm text-blue-600 font-medium mb-1">Budget Amount</p>
                        <p className="text-xl font-bold text-blue-900">₹{budget.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200/50">
                        <p className="text-sm text-orange-600 font-medium mb-1">Spent</p>
                        <p className="text-xl font-bold text-orange-900">₹{budget.spent.toLocaleString()}</p>
                      </div>
                      <div className={`${remaining >= 0 ? 'bg-green-50/50 border-green-200/50' : 'bg-red-50/50 border-red-200/50'} rounded-xl p-4 border`}>
                        <p className={`text-sm ${remaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>
                          {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                        </p>
                        <p className={`text-xl font-bold ${remaining >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          ${Math.abs(remaining).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Month</p>
                          <p className="font-medium text-foreground">
                            {budget.month ? format(new Date(budget.month + '-01'), 'MMMM yyyy') : 'Not specified'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {budget.alert_threshold && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Alert Threshold</p>
                            <p className="font-medium text-foreground">{budget.alert_threshold}%</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {budget.description && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground leading-relaxed">{budget.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Alert Message */}
                  {percentage >= 75 && (
                    <div className={`p-4 rounded-xl border-2 ${
                      percentage >= 100 ? 'bg-red-50 border-red-200' :
                      percentage >= 90 ? 'bg-orange-50 border-orange-200' :
                      'bg-yellow-50 border-yellow-200'
                    }`}>
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(percentage)}
                        <div>
                          <p className={`font-semibold ${
                            percentage >= 100 ? 'text-red-800' :
                            percentage >= 90 ? 'text-orange-800' :
                            'text-yellow-800'
                          }`}>
                            {percentage >= 100 && 'Budget Exceeded!'}
                            {percentage >= 90 && percentage < 100 && 'Danger: Approaching Budget Limit'}
                            {percentage >= 75 && percentage < 90 && 'Warning: Using Significant Portion of Budget'}
                          </p>
                          <p className={`text-sm mt-1 ${
                            percentage >= 100 ? 'text-red-700' :
                            percentage >= 90 ? 'text-orange-700' :
                            'text-yellow-700'
                          }`}>
                            {percentage >= 100 && `You have spent ₹${Math.abs(remaining).toLocaleString()} over your budget.`}
                            {percentage >= 90 && percentage < 100 && `Only ${(100 - percentage).toFixed(1)}% of budget remaining.`}
                            {percentage >= 75 && percentage < 90 && `${(100 - percentage).toFixed(1)}% of budget already used.`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Stats */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Daily Average</span>
                    <span className="font-semibold text-foreground">₹{dailyAverage.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Projected Spend</span>
                    <span className="font-semibold text-foreground">₹{projectedSpend.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Days Left</span>
                    <span className="font-semibold text-foreground">{daysInMonth - new Date().getDate()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`font-semibold capitalize ${getStatusColor(percentage).split(' ')[1]}`}>
                      {getStatusText(percentage)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(budget.created_at || new Date()), 'MMM dd, yyyy')}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/budgets/${id}/edit`} className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-accent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Budget
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full border-destructive hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Budget
                  </Button>
                </CardContent>
              </Card>

              {/* Budget Insights */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Spending Rate</p>
                      <p className="text-xs text-muted-foreground">
                        ${dailyAverage.toFixed(2)} per day
                      </p>
                    </div>
                  </div>
                  
                  {projectedSpend > budget.amount && (
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Projected Overspend</p>
                        <p className="text-xs text-muted-foreground">
                          ${(projectedSpend - budget.amount).toFixed(2)} over budget
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {remaining > 0 && dailyAverage > 0 && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Days Remaining</p>
                        <p className="text-xs text-muted-foreground">
                          {Math.floor(remaining / dailyAverage)} days at current rate
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
