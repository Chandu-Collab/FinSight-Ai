'use client'

import { useState, useEffect } from 'react'
import { recurringApi, incomeApi, type RecurringTransaction, type Income } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, Repeat, Calendar, DollarSign, TrendingUp, TrendingDown, Play, Pause, Edit, Trash2, Wallet, ArrowUpRight, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, isAfter, isBefore, addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { cn } from '@/lib/utils'

interface RecurringTransactionWithDetails extends RecurringTransaction {
  formattedAmount: string
  formattedNextDate: string
  formattedStartDate: string
  formattedEndDate?: string
  frequencyLabel: string
  typeIcon: string
  typeColor: string
  progressPercentage: number
  daysUntilNext: number
  isOverdue: boolean
  current_occurrence: number
  run_count: number
  count_occurrences?: number
}

export default function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithDetails[]>([])
  const [incomeData, setIncomeData] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  useEffect(() => {
    fetchRecurringTransactions()
  }, [])

  const fetchRecurringTransactions = async () => {
    try {
      // Get current user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      console.log('🔍 Fetching recurring transactions for userId:', userId)
      console.log('👤 User data from localStorage:', userData)
      
      if (!userId) {
        console.warn('⚠️ No user ID found - user might not be logged in')
        toast.error('Please log in to view recurring transactions')
        setRecurringTransactions([])
        setIncomeData([])
        setLoading(false)
        return
      }
      
      // Fetch both recurring transactions and income data in parallel
      const [recurringResponse, incomeResponse] = await Promise.all([
        recurringApi.getAll(userId),
        incomeApi.getAll(userId)
      ])
      
      console.log('📊 Recurring API Response:', recurringResponse)
      console.log('💰 Income API Response:', incomeResponse)
      
      // Process recurring transactions
      if (recurringResponse.data && Array.isArray(recurringResponse.data)) {
        console.log('📋 Raw recurring transactions data:', recurringResponse.data)
        const processedTransactions = recurringResponse.data.map(processRecurringTransaction)
        setRecurringTransactions(processedTransactions)
        
        if (processedTransactions.length === 0) {
          toast('No recurring transactions found. Create your first recurring transaction!', {
            icon: '🔄',
            style: {
              background: '#8b5cf6',
              color: 'white',
            }
          })
        }
      } else {
        console.log('⚠️ No recurring data received from API')
        setRecurringTransactions([])
      }
      
      // Process income data
      if (incomeResponse.data && Array.isArray(incomeResponse.data)) {
        console.log('💰 Raw income data:', incomeResponse.data)
        setIncomeData(incomeResponse.data)
      } else {
        console.log('⚠️ No income data received from API')
        setIncomeData([])
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch data'
      console.error('❌ Error fetching data:', error)
      toast.error(errorMessage)
      setRecurringTransactions([]) // Set empty array on error to prevent UI crashes
      setIncomeData([])
    } finally {
      setLoading(false)
    }
  }

  const processRecurringTransaction = (transaction: RecurringTransaction): RecurringTransactionWithDetails => {
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

    const now = new Date()
    const nextDate = new Date(transaction.next_date)
    const daysUntilNext = differenceInDays(nextDate, now)
    const isOverdue = isBefore(nextDate, now)

    const progressPercentage = transaction.max_occurrences && transaction.max_occurrences > 0 
      ? Math.min(((transaction.run_count || 0) / transaction.max_occurrences) * 100, 100) 
      : 0

    return {
      ...transaction,
      formattedAmount: `$${typeof transaction.amount === 'number' ? transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : Number(transaction.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      formattedNextDate: format(nextDate, 'MMM d, yyyy'),
      formattedStartDate: format(new Date(transaction.start_date || transaction.created_at), 'MMM d, yyyy'),
      formattedEndDate: transaction.end_date ? format(new Date(transaction.end_date), 'MMM d, yyyy') : undefined,
      frequencyLabel: frequencyLabels[transaction.frequency],
      typeIcon: transaction.type === 'income' ? '📈' : '📉',
      typeColor: transaction.type === 'income' ? 'text-green-600' : 'text-red-600',
      progressPercentage,
      daysUntilNext,
      isOverdue,
      current_occurrence: transaction.run_count || 0,
      run_count: transaction.run_count || 0,
      count_occurrences: transaction.max_occurrences
    }
  }

  const toggleTransactionStatus = async (id: string, isActive: boolean) => {
    try {
      const response = await recurringApi.update(id, { is_active: !isActive })
      if (response.data) {
        toast.success(`Recurring transaction ${!isActive ? 'activated' : 'paused'} successfully`)
        fetchRecurringTransactions()
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update transaction status'
      toast.error(errorMessage)
      console.error('Error updating status:', error)
    }
  }

  const deleteRecurringTransaction = async (id: string) => {
    try {
      const response = await recurringApi.delete(id)
      if (response.status === 'success' || response.data) {
        toast.success('Recurring transaction deleted successfully')
        fetchRecurringTransactions()
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete recurring transaction'
      toast.error(errorMessage)
      console.error('Error deleting recurring transaction:', error)
    }
  }

  const generateNextTransaction = async (id: string) => {
    try {
      // This would be a custom API endpoint - for now just refresh
      toast('Transaction generation feature coming soon')
      fetchRecurringTransactions()
    } catch (error: any) {
      toast.error('Failed to generate next transaction')
      console.error('Error generating transaction:', error)
    }
  }

  const handleView = (id: string) => {
    // Navigate to detail page
    window.location.href = `/recurring/${id}`
  }

  const getFilteredTransactions = () => {
    return recurringTransactions.filter(transaction => {
      const typeMatch = filterType === 'all' || transaction.type === filterType
      let statusMatch = true

      if (filterStatus === 'active') {
        statusMatch = transaction.is_active && !transaction.isOverdue
      } else if (filterStatus === 'paused') {
        statusMatch = !transaction.is_active
      } else if (filterStatus === 'completed') {
        const hasReachedMaxOccurrences = transaction.max_occurrences && (transaction.run_count || 0) >= transaction.max_occurrences
        const hasEndDatePassed = transaction.end_date && isBefore(new Date(), new Date(transaction.end_date))
        statusMatch = hasReachedMaxOccurrences || hasEndDatePassed
      }

      return typeMatch && statusMatch
    })
  }

  const getTotalByType = (type: 'income' | 'expense') => {
    return getFilteredTransactions()
      .filter(t => t.type === type && t.is_active && !t.isOverdue)
      .reduce((sum, t) => {
        const amount = typeof t.amount === 'number' ? t.amount : Number(t.amount)
        return sum + (isNaN(amount) ? 0 : amount)
      }, 0)
  }

  const totalIncome = getTotalByType('income')
  const totalExpenses = getTotalByType('expense')

  const filteredTransactions = getFilteredTransactions()
  const activeCount = filteredTransactions.filter(t => t.is_active).length
  const overdueCount = filteredTransactions.filter(t => t.isOverdue && t.is_active).length

  // Calculate monthly income breakdown (same logic as income page)
  const monthlyIncomeData = filteredTransactions
    .filter(t => t.type === 'income' && t.is_active && !t.isOverdue)
    .reduce((acc, item) => {
      const month = new Date(item.start_date || item.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + (typeof item.amount === 'number' ? item.amount : Number(item.amount))
      return acc
    }, {} as Record<string, number>)

  // Calculate actual monthly income from income API data (same logic as income page)
  const actualMonthlyIncome = incomeData
    .reduce((acc, item) => {
      const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      acc[month] = (acc[month] || 0) + (typeof item.amount === 'number' ? item.amount : Number(item.amount))
      return acc
    }, {} as Record<string, number>)

  // Get current month income from actual income data
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const currentMonthIncome = incomeData
    .filter(item => {
      const itemDate = new Date(item.date)
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
    })
    .reduce((sum, item) => sum + (typeof item.amount === 'number' ? item.amount : Number(item.amount)), 0)

  // Calculate expected monthly income from all active recurring income transactions
  const expectedMonthlyIncome = filteredTransactions
    .filter(t => t.type === 'income' && t.is_active && !t.isOverdue)
    .reduce((sum, item) => {
      const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  // Calculate expected monthly expenses from all active recurring expense transactions
  const expectedMonthlyExpenses = filteredTransactions
    .filter(t => t.type === 'expense' && t.is_active && !t.isOverdue)
    .reduce((sum, item) => {
      const amount = typeof item.amount === 'number' ? item.amount : Number(item.amount)
      return sum + (isNaN(amount) ? 0 : amount)
    }, 0)

  const netMonthly = currentMonthIncome - expectedMonthlyExpenses

  // Debug logging to check calculations
  console.log('📊 Recurring Transactions Stats:')
  console.log('- Actual Current Month Income:', currentMonthIncome)
  console.log('- Expected Monthly Expenses:', expectedMonthlyExpenses)
  console.log('- Net Monthly:', netMonthly)
  console.log('- Income Data Count:', incomeData.length)
  console.log('- Filtered Transactions Count:', filteredTransactions.length)
  console.log('- Active Income Count:', filteredTransactions.filter(t => t.type === 'income' && t.is_active).length)
  console.log('- Active Expense Count:', filteredTransactions.filter(t => t.type === 'expense' && t.is_active).length)

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading recurring transactions...</p>
          </div>
        </div>
      </AppLayout>
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
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                  Recurring Transactions
                </h1>
                <p className="text-sm text-muted-foreground">Manage your automatic recurring income and expenses</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Link href="/recurring/create">
                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Recurring
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${currentMonthIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                From {incomeData.length} income records this month
              </p>
              <div className="mt-3 flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">Actual income this month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${expectedMonthlyExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                From {filteredTransactions.filter(t => t.type === 'expense' && t.is_active).length} active recurring expenses
              </p>
              <div className="mt-3 flex items-center text-sm">
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-500">Expected monthly</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Monthly</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netMonthly >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${Math.abs(netMonthly).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <p className="text-xs text-muted-foreground">
                {netMonthly >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
              </p>
              <div className="mt-3 flex items-center text-sm">
                {netMonthly >= 0 ? (
                  <>
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">Income vs recurring expenses</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
                    <span className="text-red-500">Expenses exceed income</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Recurring</CardTitle>
              <Repeat className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {activeCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {overdueCount > 0 && (
                  <span className="text-red-600">{overdueCount} overdue</span>
                )}
                {overdueCount === 0 && 'All on schedule'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex space-x-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All Types
            </Button>
            <Button
              variant={filterType === 'income' ? 'default' : 'outline'}
              onClick={() => setFilterType('income')}
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>📈</span>
              Income
            </Button>
            <Button
              variant={filterType === 'expense' ? 'default' : 'outline'}
              onClick={() => setFilterType('expense')}
              size="sm"
              className="flex items-center space-x-1"
            >
              <span>📉</span>
              Expenses
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant={filterStatus === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('all')}
              size="sm"
            >
              All Status
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('active')}
              size="sm"
            >
              Active
            </Button>
            <Button
              variant={filterStatus === 'paused' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('paused')}
              size="sm"
            >
              Paused
            </Button>
            <Button
              variant={filterStatus === 'completed' ? 'default' : 'outline'}
              onClick={() => setFilterStatus('completed')}
              size="sm"
            >
              Completed
            </Button>
          </div>
        </div>

        {/* Recurring Transactions List */}
        <Card>
          <CardHeader>
            <CardTitle>Recurring Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                    <Repeat className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-foreground">No recurring transactions found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create your first recurring transaction to automate your finances.
                </p>
                <div className="mt-6">
                  <Link href="/recurring/create">
                    <Button className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Recurring Transaction</span>
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`border rounded-lg p-4 ${
                      transaction.isOverdue ? 'border-destructive bg-destructive/10' : 'hover:bg-muted'
                    } transition-colors`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{transaction.typeIcon}</span>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900">{transaction.name}</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            {transaction.source && (
                              <span className="flex items-center space-x-1">
                                <span>From:</span>
                                <span className="font-medium">{transaction.source}</span>
                              </span>
                            )}
                            {transaction.category && (
                              <span className="flex items-center space-x-1">
                                <span>Category:</span>
                                <span className="font-medium">{transaction.category}</span>
                              </span>
                            )}
                            <span className="flex items-center space-x-1">
                              <span>Frequency:</span>
                              <span className="font-medium">{transaction.frequencyLabel}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <span>Next:</span>
                              <span className={`font-medium ${transaction.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                {transaction.formattedNextDate}
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <p className={`text-lg font-semibold ${transaction.typeColor}`}>
                            {transaction.formattedAmount}
                          </p>
                          <p className="text-xs text-gray-500">
                            {transaction.is_active ? 'Active' : 'Paused'}
                            {transaction.isOverdue && ' • Overdue'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleView(transaction.id)}
                            className="border-blue-500 hover:bg-blue-50 text-blue-600"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleTransactionStatus(transaction.id, transaction.is_active)}
                            className="flex items-center space-x-1"
                          >
                            {transaction.is_active ? (
                              <>
                                <Pause className="h-4 w-4" />
                                <span>Pause</span>
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4" />
                                <span>Resume</span>
                              </>
                            )}
                          </Button>
                          {transaction.isOverdue && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => generateNextTransaction(transaction.id)}
                              className="flex items-center space-x-1 text-green-600"
                            >
                              <Play className="h-4 w-4" />
                              <span>Generate</span>
                            </Button>
                          )}
                          <Link href={`/recurring/${transaction.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this recurring transaction?')) {
                                deleteRecurringTransaction(transaction.id)
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Progress and Details */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Progress */}
                      {transaction.max_occurrences && transaction.max_occurrences > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {transaction.run_count || 0}/{transaction.max_occurrences}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                transaction.progressPercentage >= 100 ? 'bg-green-500' :
                                transaction.progressPercentage >= 75 ? 'bg-blue-500' :
                                transaction.progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-muted'
                              }`}
                              style={{ width: `${Math.min(transaction.progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Date Range */}
                      <div>
                        <p className="text-sm text-gray-600">Period</p>
                        <p className="text-sm font-medium">
                          {transaction.formattedStartDate}
                          {transaction.formattedEndDate && ` - ${transaction.formattedEndDate}`}
                          {!transaction.formattedEndDate && ' - Ongoing'}
                        </p>
                      </div>

                      {/* Next Occurrence */}
                      <div>
                        <p className="text-sm text-gray-600">
                          {transaction.isOverdue ? 'Overdue by' : 'Next in'}
                        </p>
                        <p className={`text-sm font-medium ${transaction.isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                          {Math.abs(transaction.daysUntilNext)} days
                          {transaction.isOverdue ? ' ago' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {transaction.description && (
                      <div className="mt-3 p-3 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">{transaction.description}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    </AppLayout>
  )
}
