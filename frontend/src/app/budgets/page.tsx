'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBudgets, deleteBudget } from '@/lib/api/budgets'
import { getCurrentUserId, isAuthenticated, setupDemoUser } from '@/lib/utils/user'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, TrendingUp, TrendingDown, AlertTriangle, Target, Calendar, IndianRupee, Zap, Shield, AlertCircle, BarChart3, Filter, Eye, X } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Budget {
  id: string
  name: string
  category: string
  amount: number
  spent: number
  month: string
  created_at: string
}

interface BudgetWithStatus extends Budget {
  percentage: number
  status: 'safe' | 'warning' | 'danger' | 'exceeded'
  remaining: number
  alert_threshold?: number
  description?: string
  is_active?: boolean
  rollover?: boolean
}

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Subscriptions',
  'Other'
]

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetWithStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<BudgetWithStatus | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  // Check authentication and get user ID dynamically using user utility
  const [rawBudgetData, setRawBudgetData] = useState<any>(null)
  const [userId, setUserId] = useState('')
  const router = useRouter()

  // Get user ID from user utility with authentication check
  useEffect(() => {
    if (!isAuthenticated()) {
      // For development, set up demo user automatically
      setupDemoUser();
      toast.success('Demo user set up for development');
    }
    
    const userId = getCurrentUserId();
    setUserId(userId);
  }, [router])

  useEffect(() => {
    if (userId) {
      fetchBudgetsData()
    }
  }, [selectedMonth, userId])

  const fetchBudgetsData = async () => {
    setLoading(true)
    try {
      // Call backend with user_id and month
      const res = await getBudgets(userId, selectedMonth)
      const budgetsData = res.data || []
      // Calculate status for each budget, ensure numbers are valid
      const budgetsWithStatus: BudgetWithStatus[] = budgetsData.map((budget: Budget) => {
        const amount = Number(budget.amount) || 0;
        const spent = Number(budget.spent) || 0;
        const percentage = amount > 0 ? (spent / amount) * 100 : 0;
        const remaining = amount - spent;
        let status: 'safe' | 'warning' | 'danger' | 'exceeded';
        if (percentage >= 100) status = 'exceeded';
        else if (percentage >= 90) status = 'danger';
        else if (percentage >= 75) status = 'warning';
        else status = 'safe';
        return {
          ...budget,
          amount,
          spent,
          percentage,
          status,
          remaining
        };
      });
      setBudgets(budgetsWithStatus);
    } catch (error: any) {
      toast.error('Failed to fetch budget data');
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'danger': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'exceeded': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-muted text-muted-foreground border-border'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <Shield className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'danger': return <AlertCircle className="h-4 w-4" />
      case 'exceeded': return <Target className="h-4 w-4" />
      default: return <IndianRupee className="h-4 w-4" />
    }
  }

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'safe': return 'bg-gradient-to-r from-green-500 to-emerald-500'
      case 'warning': return 'bg-gradient-to-r from-yellow-500 to-amber-500'
      case 'danger': return 'bg-gradient-to-r from-orange-500 to-red-500'
      case 'exceeded': return 'bg-gradient-to-r from-red-500 to-pink-500'
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500'
    }
  }

  const totalBudgeted = budgets.reduce((sum, budget) => sum + (Number(budget.amount) || 0), 0)
  const totalSpent = budgets.reduce((sum, budget) => sum + (Number(budget.spent) || 0), 0)
  const totalRemaining = totalBudgeted - totalSpent
  const overallPercentage = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0

  const handleView = (id: string) => {
    router.push(`/budgets/${id}`)
  }

  const handleEdit = (budget: BudgetWithStatus) => {
    setEditingBudget(budget)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingBudget(null)
  }

  const handleAddBudget = async (data: any) => {
    try {
      const { createBudget } = await import('@/lib/api/budgets')
      await createBudget({
        user_id: userId,
        name: data.name,
        category: data.category,
        amount: Number(data.amount),
        month: data.month,
        alert_threshold: Number(data.alert_threshold),
        description: data.description,
        is_active: data.is_active,
        rollover: data.rollover,
        spent: Number(data.spent || 0),
      })
      toast.success('Budget created successfully!')
      setShowAddModal(false)
      fetchBudgetsData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to create budget')
      console.error('Error creating budget:', error)
    }
  }

  const handleUpdateBudget = async (data: any) => {
    if (!editingBudget) return

    try {
      const { updateBudget } = await import('@/lib/api/budgets')
      await updateBudget(editingBudget.id, {
        name: data.name,
        category: data.category,
        amount: Number(data.amount),
        month: data.month,
        alert_threshold: Number(data.alert_threshold),
        description: data.description,
        is_active: data.is_active,
        rollover: data.rollover,
        spent: Number(data.spent || 0),
      })
      toast.success('Budget updated successfully!')
      setShowEditModal(false)
      setEditingBudget(null)
      fetchBudgetsData()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update budget')
      console.error('Error updating budget:', error)
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBudget(id)
      toast.success('Budget deleted successfully')
      fetchBudgetsData()
    } catch (error: any) {
      toast.error('Failed to delete budget')
      console.error('Error deleting budget:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading budget data...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background to-accent/20">
      {/* Modern Header */}
      <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                  Budget Management
                </h1>
                <p className="text-sm text-muted-foreground">Track and manage your monthly budgets</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-xl shadow-sm bg-card/50 backdrop-blur-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <input
                  type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                  min="2020-01"
                  max="2030-12"
                  className="bg-transparent outline-none text-sm text-foreground appearance-none"
                  aria-label="Select budget month"
                />
              </div>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Budgeted</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{totalBudgeted.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                For {format(new Date(selectedMonth), 'MMMM yyyy')}
              </p>
              <div className="mt-3 flex items-center text-sm">
                <Calendar className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-500">Monthly plan</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Spent</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ₹{totalSpent.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallPercentage.toFixed(1)}% of budget
              </p>
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(overallPercentage, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{Math.abs(totalRemaining).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {totalRemaining >= 0 ? 'Under budget' : 'Over budget'}
              </p>
              <div className="mt-3 flex items-center text-sm">
                <Zap className={`h-4 w-4 mr-1 ${totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                <span className={totalRemaining >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {totalRemaining >= 0 ? 'On track!' : 'Watch out!'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Budgets</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {budgets.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Active budgets
              </p>
              <div className="mt-3 flex items-center space-x-2">
                <div className="flex -space-x-1">
                  {budgets.slice(0, 3).map((_, i) => (
                    <div key={i} className="w-2 h-2 bg-purple-500 rounded-full border border-white"></div>
                  ))}
                </div>
                <span className="text-xs text-purple-500">
                  {budgets.length > 0 ? 'Tracking well' : 'Start tracking'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Budget List */}
        <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Budget Overview</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>{budgets.length} active budgets</span>
            </div>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-orange-100 to-amber-100 rounded-full flex items-center justify-center">
                    <Target className="h-10 w-10 text-orange-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No budgets found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your first budget to start tracking your spending and stay within your financial goals.
                </p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Budget
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {budgets.map((budget: BudgetWithStatus) => (
                  <div key={budget.id} className="bg-card/60 backdrop-blur-sm border-2 border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="text-lg font-bold text-foreground">{budget.name}</h3>
                          <p className="text-sm text-muted-foreground">{budget.category}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${getStatusColor(budget.status)}`}>
                          {getStatusIcon(budget.status)}
                          <span className="ml-1">{budget.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Enhanced Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-foreground">Progress</span>
                        <span className="text-sm font-bold text-foreground">{budget.percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(budget.status)}`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        >
                          <div className="h-full bg-white/20 animate-pulse"></div>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Financial Details */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50">
                        <p className="text-sm text-blue-600 font-medium mb-1">Budget</p>
                        <p className="text-xl font-bold text-blue-900">₹{budget.amount.toLocaleString()}</p>
                      </div>
                      <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-200/50">
                        <p className="text-sm text-orange-600 font-medium mb-1">Spent</p>
                        <p className="text-xl font-bold text-orange-900">₹{budget.spent.toLocaleString()}</p>
                      </div>
                      <div className={`${budget.remaining >= 0 ? 'bg-green-50/50 border-green-200/50' : 'bg-red-50/50 border-red-200/50'} rounded-xl p-4 border`}>
                        <p className={`text-sm ${budget.remaining >= 0 ? 'text-green-600' : 'text-red-600'} font-medium mb-1`}>
                          {budget.remaining >= 0 ? 'Remaining' : 'Over'}
                        </p>
                        <p className={`text-xl font-bold ${budget.remaining >= 0 ? 'text-green-900' : 'text-red-900'}`}>
                          ₹{Math.abs(budget.remaining).toLocaleString()}
                        </p>
                      </div>
                      <div className="bg-purple-50/50 rounded-xl p-4 border border-purple-200/50">
                        <p className="text-sm text-purple-600 font-medium mb-1">Daily Avg</p>
                        <p className="text-xl font-bold text-purple-900">
                          ₹{(budget.spent / Math.max(1, new Date().getDate())).toFixed(0)}
                        </p>
                      </div>
                    </div>

                    {/* Budget Insights */}
                    {budget.status !== 'safe' && (
                      <div className={`p-3 rounded-xl border-2 ${
                        budget.status === 'exceeded' ? 'bg-red-50 border-red-200' :
                        budget.status === 'danger' ? 'bg-orange-50 border-orange-200' :
                        'bg-yellow-50 border-yellow-200'
                      }`}>
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(budget.status)}
                          <p className={`text-sm font-medium ${
                            budget.status === 'exceeded' ? 'text-red-800' :
                            budget.status === 'danger' ? 'text-orange-800' :
                            'text-yellow-800'
                          }`}>
                            {budget.status === 'exceeded' && 'Budget exceeded! Consider reducing spending or adjusting the budget.'}
                            {budget.status === 'danger' && 'Warning: Approaching budget limit. Monitor spending closely.'}
                            {budget.status === 'warning' && 'Caution: Using significant portion of budget. Plan ahead.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200/50">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(budget.id)}
                        className="border-blue-500 hover:bg-blue-50 text-blue-600"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(budget)}
                        className="border-blue-300 hover:bg-blue-50 text-blue-600"
                      >
                        Edit Budget
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this budget?')) {
                            handleDelete(budget.id)
                          }
                        }}
                        className="border-red-300 hover:bg-red-50 text-red-600"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Create New Budget</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <AddBudgetForm
                onSubmit={handleAddBudget}
                onCancel={() => setShowAddModal(false)}
                userId={userId}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Budget Modal */}
      {showEditModal && editingBudget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Edit Budget</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseEditModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <EditBudgetForm
                budget={editingBudget}
                onSubmit={handleUpdateBudget}
                onCancel={handleCloseEditModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
}

// Add Budget Form Component
function AddBudgetForm({ onSubmit, onCancel, userId }: { onSubmit: (data: any) => void; onCancel: () => void; userId: string }) {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    month: format(new Date(), 'yyyy-MM'),
    alert_threshold: '80',
    description: '',
    is_active: true,
    rollover: false,
    spent: '0',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const expenseCategories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Subscriptions',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit({ ...formData, user_id: userId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Name *
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          placeholder="e.g., Monthly Groceries"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Category *
        </label>
        <select
          name="category"
          required
          value={formData.category}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
        >
          <option value="">Select a category...</option>
          {expenseCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Amount *
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm">₹</span>
          </div>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            value={formData.amount}
            onChange={handleChange}
            className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Period *
        </label>
        <input
          type="month"
          name="month"
          required
          value={formData.month}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          min="2020-01"
          max="2030-12"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Alert Threshold
        </label>
        <select
          name="alert_threshold"
          value={formData.alert_threshold}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
        >
          <option value="50">50% - Early Warning</option>
          <option value="75">75% - Warning</option>
          <option value="80">80% - Standard Warning</option>
          <option value="90">90% - Critical Warning</option>
          <option value="95">95% - Urgent Alert</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          placeholder="Optional description for this budget..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Initial Spent Amount
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm">₹</span>
          </div>
          <input
            type="number"
            name="spent"
            step="0.01"
            min="0"
            value={formData.spent}
            onChange={handleChange}
            className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          If some amount is already spent for this budget, enter it here
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">Active Budget</span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            name="rollover"
            type="checkbox"
            checked={formData.rollover}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">Rollover Unused Amount</span>
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border hover:bg-accent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          {isSubmitting ? 'Creating...' : 'Create Budget'}
        </Button>
      </div>
    </form>
  )
}

// Edit Budget Form Component
function EditBudgetForm({ budget, onSubmit, onCancel }: { budget: BudgetWithStatus; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    name: budget.name,
    category: budget.category,
    amount: budget.amount.toString(),
    month: budget.month,
    alert_threshold: budget.alert_threshold?.toString() || '80',
    description: budget.description || '',
    is_active: budget.is_active !== false,
    rollover: budget.rollover || false,
    spent: budget.spent?.toString() || '0',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const expenseCategories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Subscriptions',
    'Other'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Name *
        </label>
        <input
          type="text"
          name="name"
          required
          value={formData.name}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          placeholder="e.g., Monthly Groceries"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Category *
        </label>
        <select
          name="category"
          required
          value={formData.category}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
        >
          <option value="">Select a category...</option>
          {expenseCategories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Amount *
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm">₹</span>
          </div>
          <input
            type="number"
            name="amount"
            step="0.01"
            min="0"
            required
            value={formData.amount}
            onChange={handleChange}
            className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
            placeholder="0.00"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Budget Period *
        </label>
        <input
          type="month"
          name="month"
          required
          value={formData.month}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          min="2020-01"
          max="2030-12"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Alert Threshold
        </label>
        <select
          name="alert_threshold"
          value={formData.alert_threshold}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
        >
          <option value="50">50% - Early Warning</option>
          <option value="75">75% - Warning</option>
          <option value="80">80% - Standard Warning</option>
          <option value="90">90% - Critical Warning</option>
          <option value="95">95% - Urgent Alert</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Description
        </label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
          placeholder="Optional description for this budget..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Spent Amount
        </label>
        <div className="relative rounded-xl shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <span className="text-muted-foreground sm:text-sm">₹</span>
          </div>
          <input
            type="number"
            name="spent"
            step="0.01"
            min="0"
            value={formData.spent}
            onChange={handleChange}
            className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
            placeholder="0.00"
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Update the amount already spent for this budget
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            name="is_active"
            type="checkbox"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">Active Budget</span>
        </label>
        <label className="flex items-center space-x-3 cursor-pointer">
          <input
            name="rollover"
            type="checkbox"
            checked={formData.rollover}
            onChange={handleChange}
            className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
          />
          <span className="text-sm font-medium text-foreground">Rollover Unused Amount</span>
        </label>
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border hover:bg-accent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          {isSubmitting ? 'Updating...' : 'Update Budget'}
        </Button>
      </div>
    </form>
  )
}
