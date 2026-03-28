'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { recurringApi, RecurringTransaction } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, Repeat, TrendingUp, TrendingDown, Play, Pause, FileText, Clock, Target, AlertTriangle, Shield, Zap } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, isAfter, isBefore, addDays, addWeeks, addMonths, addYears } from 'date-fns'

const frequencyLabels: Record<string, string> = {
  daily: 'Daily',
  weekly: 'Weekly',
  biweekly: 'Bi-weekly',
  monthly: 'Monthly',
  bimonthly: 'Bi-monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly',
  'once': 'Once',
  'custom': 'Custom'
}

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
  'Other': '📌',
  'Salary': '💼',
  'Freelance': '💻',
  'Business': '🏢',
  'Investments': '📈',
  'Rentals': '🏠',
  'Dividends': '💰',
  'Side Hustle': '🔧',
  'Gifts': '🎁',
  'Refunds': '↩️'
}

export default function RecurringTransactionDetailPage() {
  const [transaction, setTransaction] = useState<RecurringTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchTransaction()
  }, [id])

  const fetchTransaction = async () => {
    try {
      console.log('🔍 Fetching recurring transaction details for ID:', id)
      
      const response = await recurringApi.getById(id)
      console.log('📊 Recurring transaction detail response:', response)
      
      if (response.data) {
        // Transform the data to ensure amount is a number
        const transformedData = {
          ...response.data,
          amount: typeof response.data.amount === 'string' ? parseFloat(response.data.amount) : response.data.amount
        }
        setTransaction(transformedData)
      } else {
        toast.error('Recurring transaction not found')
        router.push('/recurring')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch recurring transaction record')
      console.error('Error fetching recurring transaction:', error)
      router.push('/recurring')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) {
      return
    }

    try {
      await recurringApi.delete(id)
      toast.success('Recurring transaction deleted successfully!')
      router.push('/recurring')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete recurring transaction')
      console.error('Error deleting recurring transaction:', error)
    }
  }

  const toggleTransactionStatus = async () => {
    if (!transaction) return

    try {
      const response = await recurringApi.update(id, { is_active: !transaction.is_active })
      if (response.data) {
        toast.success(`Recurring transaction ${!transaction.is_active ? 'activated' : 'paused'} successfully`)
        setTransaction({ ...transaction, is_active: !transaction.is_active })
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update transaction status'
      toast.error(errorMessage)
      console.error('Error updating status:', error)
    }
  }

  const generateNextTransaction = async () => {
    try {
      toast('Transaction generation feature coming soon')
    } catch (error: any) {
      toast.error('Failed to generate next transaction')
      console.error('Error generating transaction:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading recurring transaction details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!transaction) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Recurring transaction not found</h2>
            <p className="text-muted-foreground mb-4">The recurring transaction you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/recurring')}>
              Back to Recurring Transactions
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

  const now = new Date()
  const nextDate = new Date(transaction.next_date)
  const daysUntilNext = differenceInDays(nextDate, now)
  const isOverdue = isBefore(nextDate, now)
  
  const progressPercentage = transaction.max_occurrences && transaction.max_occurrences > 0 
    ? Math.min(((transaction.run_count || 0) / transaction.max_occurrences) * 100, 100) 
    : 0

  const typeIcon = transaction.type === 'income' ? '📈' : '📉'
  const typeColor = transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
  const typeGradient = transaction.type === 'income' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500'

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
                  onClick={() => router.push('/recurring')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Recurring Transactions</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    Recurring Transaction Details
                  </h1>
                  <p className="text-sm text-muted-foreground">View and manage recurring transaction information</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href={`/recurring/${id}/edit`}>
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
            {/* Main Transaction Card */}
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-foreground">Transaction Information</CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">{typeIcon}</span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                        transaction.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {transaction.is_active ? 'Active' : 'Paused'}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <div className={`bg-gradient-to-r ${transaction.type === 'income' ? 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' : 'from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20'} rounded-xl p-6 border ${transaction.type === 'income' ? 'border-green-200/50' : 'border-red-200/50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          {transaction.type === 'income' ? 'Income Amount' : 'Expense Amount'}
                        </p>
                        <p className={`text-3xl font-bold ${transaction.type === 'income' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                          {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${typeGradient} rounded-xl flex items-center justify-center`}>
                        <DollarSign className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <Repeat className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Frequency</p>
                          <p className="font-medium text-foreground">
                            {frequencyLabels[transaction.frequency] || transaction.frequency}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Next Date</p>
                          <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                            {format(nextDate, 'MMMM dd, yyyy')}
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
                            {isOverdue ? 'Overdue by' : 'Next in'}
                          </p>
                          <p className={`font-medium ${isOverdue ? 'text-red-600' : 'text-foreground'}`}>
                            {Math.abs(daysUntilNext)} days {isOverdue ? 'ago' : ''}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                          <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Run Count</p>
                          <p className="font-medium text-foreground">
                            {transaction.run_count || 0} {transaction.max_occurrences ? `/ ${transaction.max_occurrences}` : 'times'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  {transaction.max_occurrences && transaction.max_occurrences > 0 && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">
                          {transaction.run_count || 0}/{transaction.max_occurrences}
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${
                            progressPercentage >= 100 ? 'bg-green-500' :
                            progressPercentage >= 75 ? 'bg-blue-500' :
                            progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-muted'
                          }`}
                          style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {progressPercentage.toFixed(1)}% completed
                      </p>
                    </div>
                  )}

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {transaction.source && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Source</p>
                        <p className="font-medium text-foreground">{transaction.source}</p>
                      </div>
                    )}
                    
                    {transaction.category && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <div className="flex items-center space-x-2">
                          <span>{categoryIcons[transaction.category] || '📌'}</span>
                          <p className="font-medium text-foreground">{transaction.category}</p>
                        </div>
                      </div>
                    )}
                    
                    {transaction.start_date && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Start Date</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(transaction.start_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                    
                    {transaction.end_date && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">End Date</p>
                        <p className="font-medium text-foreground">
                          {format(new Date(transaction.end_date), 'MMMM dd, yyyy')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {transaction.description && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground leading-relaxed">{transaction.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {transaction.notes && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-foreground leading-relaxed">{transaction.notes}</p>
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
                    <span className="text-sm text-muted-foreground">Type</span>
                    <span className={`font-semibold capitalize ${typeColor}`}>
                      {transaction.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className="font-semibold capitalize">
                      {transaction.is_active ? 'Active' : 'Paused'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Frequency</span>
                    <span className="font-semibold">
                      {frequencyLabels[transaction.frequency] || transaction.frequency}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(transaction.created_at || new Date()), 'MMM dd, yyyy')}
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
                  <Link href={`/recurring/${id}/edit`} className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-accent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Transaction
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={toggleTransactionStatus}
                    className="w-full border-blue-500 hover:bg-blue-50 text-blue-600"
                  >
                    {transaction.is_active ? (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause Transaction
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume Transaction
                      </>
                    )}
                  </Button>
                  
                  {isOverdue && (
                    <Button
                      variant="outline"
                      onClick={generateNextTransaction}
                      className="w-full border-green-500 hover:bg-green-50 text-green-600"
                    >
                      <Play className="h-4 w-4 mr-2" />
                      Generate Next
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full border-destructive hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Transaction
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
                    <Zap className="h-4 w-4 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Next Occurrence</p>
                      <p className="text-xs text-muted-foreground">
                        {isOverdue ? 'Overdue' : `${daysUntilNext} days remaining`}
                      </p>
                    </div>
                  </div>
                  
                  {transaction.max_occurrences && transaction.max_occurrences > 0 && (
                    <div className="flex items-center space-x-3">
                      <Shield className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Completion</p>
                        <p className="text-xs text-muted-foreground">
                          {progressPercentage.toFixed(1)}% completed
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {transaction.end_date && (
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <div>
                        <p className="text-sm font-medium text-foreground">End Date</p>
                        <p className="text-xs text-muted-foreground">
                          Ends {format(new Date(transaction.end_date), 'MMM dd, yyyy')}
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
