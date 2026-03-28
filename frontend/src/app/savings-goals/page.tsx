'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { SavingsGoalModal } from '@/components/savings-goals/SavingsGoalModal'
import { savingsGoalsAPI, SavingsGoal } from '@/lib/api/savings-goals'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Target, 
  Plus, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  Edit, 
  Trash2, 
  Eye,
  PiggyBank,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

const goalCategories = [
  'Emergency Fund',
  'Vacation',
  'Home Purchase',
  'Education',
  'Retirement',
  'Vehicle',
  'Wedding',
  'Investment',
  'Health',
  'Travel',
  'Other'
]

const categoryColors: Record<string, { bg: string, text: string, gradient: string }> = {
  'Emergency Fund': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', gradient: 'from-red-500 to-pink-500' },
  'Vacation': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', gradient: 'from-blue-500 to-cyan-500' },
  'Home Purchase': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', gradient: 'from-purple-500 to-pink-500' },
  'Education': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', gradient: 'from-green-500 to-emerald-500' },
  'Retirement': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', gradient: 'from-yellow-500 to-amber-500' },
  'Vehicle': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', gradient: 'from-orange-500 to-red-500' },
  'Wedding': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', gradient: 'from-pink-500 to-rose-500' },
  'Investment': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
  'Health': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', gradient: 'from-teal-500 to-green-500' },
  'Travel': { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-800 dark:text-cyan-200', gradient: 'from-cyan-500 to-blue-500' },
  'Other': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' }
}

const statusColors = {
  active: 'bg-blue-100 text-blue-800 border-blue-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-gray-100 text-gray-800 border-gray-200',
  cancelled: 'bg-red-100 text-red-800 border-red-200'
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-green-100 text-green-800 border-green-200'
}

export default function SavingsGoalsPage() {
  const { user, token } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState<SavingsGoal | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredGoals, setFilteredGoals] = useState<SavingsGoal[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')

  useEffect(() => {
    if (user || token) {
      fetchSavingsGoals()
    }
  }, [user, token])

  useEffect(() => {
    let filtered = goals

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredGoals(filtered)
  }, [searchTerm, selectedCategory, goals])

  const fetchSavingsGoals = async () => {
    if (!user?.id && !token) {
      setError('User not authenticated')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const userId = user?.id || 'demo-user-001'
      const response = await savingsGoalsAPI.getAllSavingsGoals(userId)
      if (response.status === 'success') {
        setGoals(response.data)
      } else {
        setError('Failed to fetch savings goals')
      }
    } catch (error) {
      console.error('Error fetching savings goals:', error)
      setError('Error loading savings goals. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGoal = async (goalData: any) => {
    if (!user?.id && !token) {
      setError('User not authenticated')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const userId = user?.id || 'demo-user-001'
      const goalWithUser = { ...goalData, user_id: userId }
      const response = await savingsGoalsAPI.createSavingsGoal(goalWithUser)
      if (response.status === 'success') {
        await fetchSavingsGoals()
        setShowCreateModal(false)
      } else {
        setError('Failed to create savings goal')
      }
    } catch (error) {
      console.error('Error creating savings goal:', error)
      setError('Error creating savings goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditGoal = async (goalData: any) => {
    if (!editingGoal?.id) return
    if (!user?.id && !token) {
      setError('User not authenticated')
      return
    }
    
    setSubmitting(true)
    setError(null)
    try {
      const response = await savingsGoalsAPI.updateSavingsGoal(editingGoal.id, goalData)
      if (response.status === 'success') {
        await fetchSavingsGoals()
        setEditingGoal(null)
      } else {
        setError('Failed to update savings goal')
      }
    } catch (error) {
      console.error('Error updating savings goal:', error)
      setError('Error updating savings goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this savings goal?')) return
    if (!user?.id && !token) {
      setError('User not authenticated')
      return
    }
    
    setSubmitting(true)
    setError(null)
    try {
      const response = await savingsGoalsAPI.deleteSavingsGoal(goalId)
      if (response.status === 'success') {
        await fetchSavingsGoals()
      } else {
        setError('Failed to delete savings goal')
      }
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      setError('Error deleting savings goal. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewGoal = async (goalId: string) => {
    // Navigate to detail page instead of opening edit modal
    window.location.href = `/savings-goals/${goalId}`
  }

  const formatCurrency = (amount: number | string | undefined | null) => {
    if (amount === undefined || amount === null || amount === '' || isNaN(Number(amount))) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(0)
    }
    
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(numAmount)
  }

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 50) return 'bg-blue-500'
    if (percentage >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getDaysRemaining = (targetDate: string) => {
    const days = differenceInDays(new Date(targetDate), new Date())
    return days
  }

  // Calculate summary metrics
  const totalSaved = filteredGoals.reduce((sum, goal) => {
    const amount = typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount) : (goal.current_amount || 0)
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)

  const totalTarget = filteredGoals.reduce((sum, goal) => {
    const amount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : (goal.target_amount || 0)
    return sum + (isNaN(amount) ? 0 : amount)
  }, 0)

  const completedCount = filteredGoals.filter(goal => {
    const status = goal.status?.toLowerCase().trim()
    return status === 'completed' || status === 'complete' || status === 'finished'
  }).length

  const averageProgress = filteredGoals.length > 0 ? 
    filteredGoals.reduce((sum, goal) => {
      const currentAmount = typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount) : (goal.current_amount || 0)
      const targetAmount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : (goal.target_amount || 0)
      const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
      return sum + progress
    }, 0) / filteredGoals.length : 0

  const categoryTotals = filteredGoals.reduce((acc, goal) => {
    const amount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : (goal.target_amount || 0)
    acc[goal.category] = (acc[goal.category] || 0) + amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading savings goals...</p>
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
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl flex items-center justify-center">
                  <PiggyBank className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Savings Goals
                  </h1>
                  <p className="text-sm text-muted-foreground">Track and achieve your financial dreams</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Goal
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-emerald-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <Target className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600 truncate">
                  {filteredGoals.length}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Active savings goals
                </p>
                <div className="mt-3 flex items-center text-sm">
                  <ArrowUpRight className="h-4 w-4 text-emerald-500 mr-1" />
                  <span className="text-emerald-500 truncate">8% from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 truncate">
                  {formatCurrency(totalSaved)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Across all goals
                </p>
                <div className="mt-3 flex items-center text-sm">
                  <ArrowUpRight className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-blue-500 truncate">15% increase</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Target Amount</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <Award className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 truncate">
                  {formatCurrency(totalTarget)}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Total target value
                </p>
                <div className="mt-3 flex items-center text-sm">
                  <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-500 truncate">On track</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 truncate">
                  {completedCount}
                </div>
                <p className="text-xs text-muted-foreground mt-1 truncate">
                  Goals achieved
                </p>
                <div className="mt-3 text-sm font-medium text-orange-600 truncate">
                  {filteredGoals.length > 0 ? ((completedCount / filteredGoals.length) * 100).toFixed(1) : '0'}% completion rate
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Search and Filter */}
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-border/50 p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search goals by name, category, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mt-4">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                    : 'bg-muted text-foreground hover:bg-accent'
                )}
              >
                All Categories
              </button>
              {goalCategories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg'
                      : 'bg-muted text-foreground hover:bg-accent'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Goals Display */}
          {filteredGoals.length === 0 ? (
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No savings goals found</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start your savings journey by creating your first financial goal'
                  }
                </p>
                <Button 
                  onClick={() => setShowCreateModal(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Goal
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGoals.map((goal) => {
                const currentAmount = typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount) : (goal.current_amount || 0)
                const targetAmount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : (goal.target_amount || 0)
                const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
                const daysRemaining = getDaysRemaining(goal.target_date)
                const categoryColor = categoryColors[goal.category] || categoryColors['Other']
                
                return (
                  <Card key={goal.id} className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold text-foreground mb-1 truncate">{goal.name}</CardTitle>
                          <div className="flex items-center space-x-2">
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                              statusColors[goal.status as keyof typeof statusColors] || statusColors.active
                            )}>
                              {goal.status}
                            </span>
                            <span className={cn(
                              "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border",
                              priorityColors[goal.priority as keyof typeof priorityColors] || priorityColors.medium
                            )}>
                              {goal.priority}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleViewGoal(goal.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setEditingGoal(goal)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            onClick={() => handleDeleteGoal(goal.id)}
                            disabled={submitting}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className={cn("h-2 rounded-full transition-all duration-300", getProgressColor(progress))}
                            style={{ width: `${Math.min(progress, 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Amounts */}
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Current</span>
                          <span className="font-medium">{formatCurrency(currentAmount)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Target</span>
                          <span className="font-medium">{formatCurrency(targetAmount)}</span>
                        </div>
                      </div>

                      {/* Time Remaining */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{daysRemaining > 0 ? `${daysRemaining} days left` : 'Overdue'}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                        </span>
                      </div>

                      {/* Category */}
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center space-x-2">
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                            categoryColor.bg,
                            categoryColor.text
                          )}>
                            {goal.category.charAt(0)}
                          </div>
                          <span className="text-xs text-muted-foreground">{goal.category}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </main>

        {/* Create Goal Modal */}
        <SavingsGoalModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateGoal}
          isLoading={submitting}
        />

        {/* Edit Goal Modal */}
        <SavingsGoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          onSubmit={handleEditGoal}
          editingGoal={editingGoal}
          isLoading={submitting}
        />
      </div>
    </AppLayout>
  )
}
