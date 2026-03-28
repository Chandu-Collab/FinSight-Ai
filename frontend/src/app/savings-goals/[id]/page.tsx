'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { savingsGoalsAPI, SavingsGoal } from '@/lib/api/savings-goals'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit, Trash2, Target, Calendar, DollarSign, TrendingUp, Clock, FileText, Award, CheckCircle, AlertCircle, Play, Pause, PiggyBank, Gift, Heart, Star, Repeat } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, addDays, addWeeks, addMonths, addYears } from 'date-fns'
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

export default function SavingsGoalDetailPage() {
  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchGoal()
  }, [id])

  const fetchGoal = async () => {
    try {
      console.log('🔍 Fetching savings goal details for ID:', id)
      
      const response = await savingsGoalsAPI.getSavingsGoalById(id)
      console.log('📊 Savings goal detail response:', response)
      
      if (response.data) {
        // Transform the data to ensure amounts are numbers
        const transformedData = {
          ...response.data,
          current_amount: typeof response.data.current_amount === 'string' ? parseFloat(response.data.current_amount) : response.data.current_amount,
          target_amount: typeof response.data.target_amount === 'string' ? parseFloat(response.data.target_amount) : response.data.target_amount,
          recurring_contribution: response.data.recurring_contribution ? (typeof response.data.recurring_contribution === 'string' ? parseFloat(response.data.recurring_contribution) : response.data.recurring_contribution) : undefined
        }
        setGoal(transformedData)
      } else {
        toast.error('Savings goal not found')
        router.push('/savings-goals')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch savings goal record')
      console.error('Error fetching savings goal:', error)
      router.push('/savings-goals')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this savings goal?')) {
      return
    }

    try {
      await savingsGoalsAPI.deleteSavingsGoal(id)
      toast.success('Savings goal deleted successfully!')
      router.push('/savings-goals')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete savings goal')
      console.error('Error deleting savings goal:', error)
    }
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

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading savings goal details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!goal) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Savings goal not found</h2>
            <p className="text-muted-foreground mb-4">The savings goal you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/savings-goals')}>
              Back to Savings Goals
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const currentAmount = typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount) : (goal.current_amount || 0)
  const targetAmount = typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) : (goal.target_amount || 0)
  const progress = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0
  const daysRemaining = getDaysRemaining(goal.target_date)
  const categoryColor = categoryColors[goal.category] || categoryColors['Other']
  const progressColor = getProgressColor(progress)

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
                  onClick={() => router.push('/savings-goals')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Savings Goals</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                    Savings Goal Details
                  </h1>
                  <p className="text-sm text-muted-foreground">View and manage your savings goal information</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href={`/savings-goals/${id}/edit`}>
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
            {/* Main Goal Card */}
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-emerald-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-foreground">Goal Information</CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${statusColors[goal.status as keyof typeof statusColors] || statusColors.active}`}>
                        {goal.status}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold border ${priorityColors[goal.priority as keyof typeof priorityColors] || priorityColors.medium}`}>
                        {goal.priority}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Goal Header */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Goal Name</p>
                        <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                          {goal.name}
                        </p>
                        <p className="text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                          {goal.category}
                        </p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-r ${categoryColor.gradient}`}>
                        <Target className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Progress Section */}
                  <div className="bg-card/50 rounded-xl p-6 border border-border/50">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-foreground">Progress Overview</h3>
                      <span className="text-2xl font-bold text-foreground">{progress.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-4 rounded-full transition-all duration-500 ${progressColor}`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      >
                        <div className="h-full bg-white/20 animate-pulse"></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Current Saved</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(currentAmount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Target Amount</p>
                        <p className="text-xl font-bold text-blue-600">{formatCurrency(targetAmount)}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className={`text-xl font-bold ${targetAmount - currentAmount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(Math.abs(targetAmount - currentAmount))}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Time Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Target Date</p>
                          <p className="font-medium text-foreground">
                            {format(new Date(goal.target_date), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                          <Clock className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {daysRemaining > 0 ? 'Time Remaining' : 'Overdue'}
                          </p>
                          <p className={`font-medium ${daysRemaining > 0 ? 'text-foreground' : 'text-red-600'}`}>
                            {daysRemaining > 0 ? `${daysRemaining} days` : 'Overdue'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground leading-relaxed">{goal.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {goal.recurring_contribution && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Recurring Contribution</p>
                        <p className="font-medium text-foreground">{formatCurrency(goal.recurring_contribution)}</p>
                      </div>
                    )}
                    
                    {goal.last_contribution_date && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Last Contribution</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(goal.last_contribution_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    
                    {goal.motivation && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground mb-2">Motivation</p>
                        <p className="text-foreground leading-relaxed">{goal.motivation}</p>
                      </div>
                    )}
                    
                    {goal.image_url && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground mb-2">Goal Image</p>
                        <img 
                          src={goal.image_url} 
                          alt={goal.name}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  {goal.notes && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-foreground leading-relaxed">{goal.notes}</p>
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
                    <span className="text-sm text-muted-foreground">Progress</span>
                    <span className="font-semibold text-foreground">{progress.toFixed(1)}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="font-semibold capitalize">{goal.status}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Priority</span>
                    <span className="font-semibold capitalize">{goal.priority}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(goal.created_at || new Date()), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  {goal.completion_date && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Completed</span>
                      <span className="font-semibold text-foreground">
                        {format(new Date(goal.completion_date), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Link href={`/savings-goals/${id}/edit`} className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-accent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Goal
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full border-destructive hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Goal
                  </Button>
                </CardContent>
              </Card>

              {/* Insights */}
              <Card className="bg-card/80 backdrop-blur-sm border border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-foreground">Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Monthly Savings Needed</p>
                      <p className="text-xs text-muted-foreground">
                        {targetAmount > 0 ? (targetAmount - currentAmount) / getDaysRemaining(goal.target_date) : 0}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <Target className="h-4 w-4 text-emerald-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">On Track</p>
                      <p className="text-xs text-muted-foreground">
                        {progress >= 80 ? 'Excellent progress!' : progress >= 50 ? 'Good progress!' : 'Keep going!'}
                      </p>
                    </div>
                  </div>
                  
                  {goal.recurring_contribution && (
                    <div className="flex items-center space-x-3">
                      <Repeat className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Auto-Saving</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(goal.recurring_contribution)} per contribution
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Achievement Badges */}
              {progress >= 100 && (
                <Card className="bg-gradient-to-r from-yellow-100 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200/50 shadow-lg">
                  <CardContent className="text-center py-4">
                    <div className="flex justify-center mb-2">
                      <Award className="h-8 w-8 text-yellow-600" />
                    </div>
                    <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-200">Goal Achieved!</h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Congratulations on reaching your savings goal!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
