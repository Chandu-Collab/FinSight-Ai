'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Repeat, Calendar, DollarSign, TrendingUp, TrendingDown, Play, Pause, Edit, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, isAfter, isBefore, addDays, addWeeks, addMonths, addYears } from 'date-fns'

interface RecurringTransaction {
  id: string
  name: string
  type: 'income' | 'expense'
  amount: number
  source?: string
  category?: string
  description?: string
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'yearly'
  start_date: string
  end_date?: string
  next_date: string
  count_occurrences: number
  current_occurrence: number
  is_active: boolean
  created_at: string
}

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
}

export default function RecurringTransactionsPage() {
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransactionWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'paused' | 'completed'>('all')

  useEffect(() => {
    fetchRecurringTransactions()
  }, [])

  const fetchRecurringTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('recurring_transactions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const processedTransactions = (data || []).map(processRecurringTransaction)
      setRecurringTransactions(processedTransactions)
    } catch (error: any) {
      toast.error('Failed to fetch recurring transactions')
      console.error('Error fetching recurring transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const processRecurringTransaction = (transaction: RecurringTransaction): RecurringTransactionWithDetails => {
    const frequencyLabels = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      bimonthly: 'Bi-monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    }

    const now = new Date()
    const nextDate = new Date(transaction.next_date)
    const daysUntilNext = differenceInDays(nextDate, now)
    const isOverdue = isBefore(nextDate, now)

    const progressPercentage = transaction.count_occurrences > 0 
      ? (transaction.current_occurrence / transaction.count_occurrences) * 100 
      : 0

    return {
      ...transaction,
      formattedAmount: `$${transaction.amount.toLocaleString()}`,
      formattedNextDate: format(nextDate, 'MMM d, yyyy'),
      formattedStartDate: format(new Date(transaction.start_date), 'MMM d, yyyy'),
      formattedEndDate: transaction.end_date ? format(new Date(transaction.end_date), 'MMM d, yyyy') : undefined,
      frequencyLabel: frequencyLabels[transaction.frequency],
      typeIcon: transaction.type === 'income' ? '📈' : '📉',
      typeColor: transaction.type === 'income' ? 'text-green-600' : 'text-red-600',
      progressPercentage,
      daysUntilNext,
      isOverdue
    }
  }

  const toggleTransactionStatus = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error

      toast.success(`Recurring transaction ${!isActive ? 'activated' : 'paused'} successfully`)
      fetchRecurringTransactions()
    } catch (error: any) {
      toast.error('Failed to update transaction status')
      console.error('Error updating status:', error)
    }
  }

  const deleteRecurringTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('recurring_transactions')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Recurring transaction deleted successfully')
      fetchRecurringTransactions()
    } catch (error: any) {
      toast.error('Failed to delete recurring transaction')
      console.error('Error deleting recurring transaction:', error)
    }
  }

  const generateNextTransaction = async (id: string) => {
    try {
      const { error } = await supabase.rpc('generate_next_recurring_transaction', { 
        recurring_transaction_id: id 
      })

      if (error) throw error

      toast.success('Next transaction generated successfully')
      fetchRecurringTransactions()
    } catch (error: any) {
      toast.error('Failed to generate next transaction')
      console.error('Error generating transaction:', error)
    }
  }

  const getFilteredTransactions = () => {
    return recurringTransactions.filter(transaction => {
      const typeMatch = filterType === 'all' || transaction.type === filterType
      let statusMatch = true

      if (filterStatus === 'active') {
        statusMatch = transaction.is_active && !transaction.isOverdue && transaction.current_occurrence < transaction.count_occurrences
      } else if (filterStatus === 'paused') {
        statusMatch = !transaction.is_active
      } else if (filterStatus === 'completed') {
        statusMatch = transaction.current_occurrence >= transaction.count_occurrences || (transaction.end_date && isBefore(new Date(), new Date(transaction.end_date)))
      }

      return typeMatch && statusMatch
    })
  }

  const getTotalByType = (type: 'income' | 'expense') => {
    return getFilteredTransactions()
      .filter(t => t.type === type && t.is_active)
      .reduce((sum, t) => sum + t.amount, 0)
  }

  const totalIncome = getTotalByType('income')
  const totalExpenses = getTotalByType('expense')
  const netMonthly = totalIncome - totalExpenses

  const filteredTransactions = getFilteredTransactions()
  const activeCount = filteredTransactions.filter(t => t.is_active).length
  const overdueCount = filteredTransactions.filter(t => t.isOverdue && t.is_active).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Recurring Transactions</h1>
              <p className="text-sm text-gray-500">Manage your automatic recurring income and expenses</p>
            </div>
            <Link href="/recurring/create">
              <Button className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>Create Recurring</span>
              </Button>
            </Link>
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
                ${totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {filteredTransactions.filter(t => t.type === 'income' && t.is_active).length} active recurring incomes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                From {filteredTransactions.filter(t => t.type === 'expense' && t.is_active).length} active recurring expenses
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Monthly</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${netMonthly >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ${Math.abs(netMonthly).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {netMonthly >= 0 ? 'Positive cash flow' : 'Negative cash flow'}
              </p>
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
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Repeat className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No recurring transactions found</h3>
                <p className="mt-2 text-sm text-gray-500">
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
                      transaction.isOverdue ? 'border-red-200 bg-red-50' : 'hover:bg-gray-50'
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
                      {transaction.count_occurrences > 0 && (
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {transaction.current_occurrence}/{transaction.count_occurrences}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                transaction.progressPercentage >= 100 ? 'bg-green-500' :
                                transaction.progressPercentage >= 75 ? 'bg-blue-500' :
                                transaction.progressPercentage >= 50 ? 'bg-yellow-500' : 'bg-gray-300'
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
                        <p className={`text-sm font-medium ${transaction.isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                          {Math.abs(transaction.daysUntilNext)} days
                          {transaction.isOverdue ? ' ago' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    {transaction.description && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">{transaction.description}</p>
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
  )
}
