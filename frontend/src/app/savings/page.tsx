'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, Target, TrendingUp, Calendar, IndianRupee, Award, AlertCircle, Trophy, Zap, Star, Flag, CheckCircle2, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, isAfter, isBefore, startOfDay } from 'date-fns'
import { cn } from '@/lib/utils'

interface SavingsGoal {
  id: string
  name: string
  target_amount: number
  current_amount: number
  target_date: string
  description?: string
  category: string
  created_at: string
  status: 'active' | 'completed' | 'overdue'
}

interface SavingsGoalWithProgress extends SavingsGoal {
  progress_percentage: number
  remaining_amount: number
  days_remaining: number
  monthly_required: number
  is_on_track: boolean
}

const savingsCategories = [
  'Emergency Fund',
  'Vacation',
  'Home Purchase',
  'Car Purchase',
  'Education',
  'Investment',
  'Retirement',
  'Wedding',
  'Healthcare',
  'Technology',
  'Other'
]

const categoryIcons: Record<string, { icon: string, gradient: string }> = {
  'Emergency Fund': { icon: '🚨', gradient: 'from-red-500 to-orange-500' },
  'Vacation': { icon: '✈️', gradient: 'from-blue-500 to-cyan-500' },
  'Home Purchase': { icon: '🏠', gradient: 'from-green-500 to-emerald-500' },
  'Car Purchase': { icon: '🚗', gradient: 'from-purple-500 to-pink-500' },
  'Education': { icon: '📚', gradient: 'from-indigo-500 to-purple-500' },
  'Investment': { icon: '📈', gradient: 'from-yellow-500 to-amber-500' },
  'Retirement': { icon: '🏖️', gradient: 'from-teal-500 to-green-500' },
  'Wedding': { icon: '💍', gradient: 'from-pink-500 to-rose-500' },
  'Healthcare': { icon: '🏥', gradient: 'from-red-500 to-pink-500' },
  'Technology': { icon: '💻', gradient: 'from-gray-500 to-slate-500' },
  'Other': { icon: '📌', gradient: 'from-gray-500 to-slate-500' }
}

export default function SavingsPage() {
  const [goals, setGoals] = useState<SavingsGoalWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchGoals()
  }, [])

  const fetchGoals = async () => {
    try {
      const { data: goalsData, error: goalsError } = await supabase
        .from('savings_goals')
        .select('*')
        .order('created_at', { ascending: false })

      if (goalsError) throw goalsError

      const goalsWithProgress: SavingsGoalWithProgress[] = (goalsData || []).map((goal: SavingsGoal) => {
        const progress_percentage = (goal.current_amount / goal.target_amount) * 100
        const remaining_amount = goal.target_amount - goal.current_amount
        const days_remaining = differenceInDays(new Date(goal.target_date), new Date())
        
        // Calculate monthly required savings
        const months_remaining = Math.max(1, Math.ceil(days_remaining / 30))
        const monthly_required = remaining_amount / months_remaining
        
        // Determine if goal is on track
        const today = startOfDay(new Date())
        const targetDate = startOfDay(new Date(goal.target_date))
        const is_on_track = days_remaining > 0 && progress_percentage >= ((365 - days_remaining) / 365) * 100
        
        // Determine status
        let status: 'active' | 'completed' | 'overdue'
        if (progress_percentage >= 100) status = 'completed'
        else if (isAfter(today, targetDate)) status = 'overdue'
        else status = 'active'

        return {
          ...goal,
          progress_percentage,
          remaining_amount,
          days_remaining,
          monthly_required,
          is_on_track,
          status
        }
      })

      setGoals(goalsWithProgress)
    } catch (error: any) {
      toast.error('Failed to fetch savings goals')
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100'
      case 'overdue': return 'text-red-600 bg-red-100'
      case 'active': return 'text-blue-600 bg-blue-100'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Award className="h-4 w-4" />
      case 'overdue': return <AlertCircle className="h-4 w-4" />
      case 'active': return <Target className="h-4 w-4" />
      default: return <IndianRupee className="h-4 w-4" />
    }
  }

  const getProgressColor = (percentage: number, is_on_track: boolean) => {
    if (percentage >= 100) return 'bg-green-500'
    if (!is_on_track) return 'bg-orange-500'
    if (percentage >= 75) return 'bg-blue-500'
    if (percentage >= 50) return 'bg-yellow-500'
    return 'bg-muted'
  }

  const totalTarget = goals.reduce((sum, goal) => sum + goal.target_amount, 0)
  const totalSaved = goals.reduce((sum, goal) => sum + goal.current_amount, 0)
  const totalRemaining = totalTarget - totalSaved
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0

  const activeGoals = goals.filter(goal => goal.status === 'active')
  const completedGoals = goals.filter(goal => goal.status === 'completed')
  const overdueGoals = goals.filter(goal => goal.status === 'overdue')

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading savings goals...</p>
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
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Savings Goals
                </h1>
                <p className="text-sm text-gray-500">Track and achieve your financial dreams</p>
              </div>
            </div>
            <Link href="/savings/create">
              <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                <Plus className="h-4 w-4 mr-2" />
                Create Goal
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Target</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ₹{totalTarget.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {goals.length} goals
              </p>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-blue-500 mr-1" />
                <span className="text-blue-500">Dream big!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Saved</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <IndianRupee className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ₹{totalSaved.toLocaleString()}  
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {overallProgress.toFixed(1)}% progress
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                  style={{ width: `${Math.min(overallProgress, 100)}%` }}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Remaining</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ₹{totalRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                To reach all goals
              </p>
              <div className="mt-3 flex items-center text-sm">
                <Clock className="h-4 w-4 text-orange-500 mr-1" />
                <span className="text-orange-500">Keep going!</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Goals</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">
                {activeGoals.length}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {completedGoals.length} completed
              </p>
              <div className="mt-3 flex items-center space-x-2">
                {completedGoals.length > 0 && (
                  <div className="flex -space-x-1">
                    {[...Array(Math.min(completedGoals.length, 3))].map((_, i) => (
                      <div key={i} className="w-2 h-2 bg-green-500 rounded-full border border-white"></div>
                    ))}
                  </div>
                )}
                <span className="text-xs text-purple-500">
                  {completedGoals.length > 0 ? 'Great progress!' : 'Start today!'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <div className="space-y-6">
          {/* Active Goals */}
          {activeGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Goals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeGoals.map((goal) => (
                    <div key={goal.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{categoryIcons[goal.category]?.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{goal.name}</h3>
                            <p className="text-sm text-gray-500">{goal.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(goal.status)}`}>
                            {getStatusIcon(goal.status)}
                            <span className="ml-1">{goal.status}</span>
                          </span>
                          {!goal.is_on_track && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-orange-600 bg-orange-100">
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Off Track
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{goal.progress_percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${getProgressColor(goal.progress_percentage, goal.is_on_track)}`}
                            style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Goal Details */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Target</p>
                          <p className="font-medium">₹{goal.target_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Saved</p>
                          <p className="font-medium text-green-600">₹{goal.current_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Remaining</p>
                          <p className="font-medium text-orange-600">₹{goal.remaining_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Days Left</p>
                          <p className={`font-medium ${goal.days_remaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                            {goal.days_remaining}
                          </p>
                        </div>
                      </div>

                      {/* Monthly Target */}
                      <div className="bg-blue-50 rounded-lg p-3 mb-3">
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="text-sm font-medium text-blue-900">Monthly Required</p>
                            <p className="text-xs text-blue-700">To reach goal on time</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-blue-900">
                              ₹{goal.monthly_required.toFixed(0)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-2">
                        <Link href={`/savings/${goal.id}/edit`}>
                          <Button variant="outline" size="sm">
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this savings goal?')) {
                              handleDelete(goal.id)
                            }
                          }}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Completed Goals */}
          {completedGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="h-5 w-5 text-green-600" />
                  Completed Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedGoals.map((goal) => (
                    <div key={goal.id} className="border border-green-200 rounded-lg p-4 bg-green-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{categoryIcons[goal.category]?.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{goal.name}</h3>
                            <p className="text-sm text-gray-500">{goal.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-green-600 bg-green-100">
                            <Award className="h-4 w-4 mr-1" />
                            Completed
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Target</p>
                          <p className="font-medium">₹{goal.target_amount.toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Saved</p>
                          <p className="font-medium text-green-600">₹{goal.current_amount.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Overdue Goals */}
          {overdueGoals.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  Overdue Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {overdueGoals.map((goal) => (
                    <div key={goal.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{categoryIcons[goal.category]?.icon}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{goal.name}</h3>
                            <p className="text-sm text-gray-500">{goal.category}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-red-600 bg-red-100">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            Overdue
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-sm text-red-700">
                        Target date was {format(new Date(goal.target_date), 'MMMM d, yyyy')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Empty State */}
          {goals.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Target className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">No savings goals yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first savings goal to start tracking your progress.
                </p>
                <div className="mt-6">
                  <Link href="/savings/create">
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Goal</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
    </AppLayout>
  )

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Savings goal deleted successfully')
      fetchGoals()
    } catch (error: any) {
      toast.error('Failed to delete savings goal')
      console.error('Error deleting goal:', error)
    }
  }
}
