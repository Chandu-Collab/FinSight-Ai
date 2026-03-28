'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { expenseApi, Expense } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit, Trash2, Calendar, CreditCard, FileText, TrendingDown, Receipt, Tag, Clock } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const categoryColors: Record<string, { bg: string, text: string, gradient: string }> = {
  'Food': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', gradient: 'from-orange-500 to-red-500' },
  'Transportation': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', gradient: 'from-blue-500 to-cyan-500' },
  'Shopping': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', gradient: 'from-purple-500 to-pink-500' },
  'Entertainment': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', gradient: 'from-pink-500 to-rose-500' },
  'Bills & Utilities': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', gradient: 'from-red-500 to-orange-500' },
  'Healthcare': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', gradient: 'from-green-500 to-emerald-500' },
  'Education': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
  'Travel': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', gradient: 'from-yellow-500 to-amber-500' },
  'Subscriptions': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' },
  'Other': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' }
}

const categoryIcons: Record<string, string> = {
  'Food': '🍔',
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

export default function ExpenseDetailPage() {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchExpense()
  }, [id])

  const fetchExpense = async () => {
    try {
      console.log('🔍 Fetching expense details for ID:', id)
      
      const response = await expenseApi.getById(id)
      console.log('📊 Expense detail response:', response)
      
      if (response.data) {
        // Transform the data to ensure amount is a number
        const transformedData = {
          ...response.data,
          amount: typeof response.data.amount === 'string' ? parseFloat(response.data.amount) : response.data.amount
        }
        setExpense(transformedData)
      } else {
        toast.error('Expense record not found')
        router.push('/expenses')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch expense record')
      console.error('Error fetching expense:', error)
      router.push('/expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return
    }

    try {
      await expenseApi.delete(id)
      toast.success('Expense deleted successfully!')
      router.push('/expenses')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete expense')
      console.error('Error deleting expense:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading expense details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!expense) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Expense not found</h2>
            <p className="text-muted-foreground mb-4">The expense record you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/expenses')}>
              Back to Expenses
            </Button>
          </div>
        </div>
      </AppLayout>
    )
  }

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
                  onClick={() => router.push('/expenses')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Expenses</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Expense Details
                  </h1>
                  <p className="text-sm text-muted-foreground">View and manage expense information</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href={`/expenses/${id}/edit`}>
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
            {/* Main Expense Card */}
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-red-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-foreground">Expense Information</CardTitle>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${categoryColors[expense.category]?.bg || 'bg-muted'} ${categoryColors[expense.category]?.text || 'text-foreground'}`}>
                      <span className="mr-1">{categoryIcons[expense.category]}</span>
                      {expense.category}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <div className="bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-red-600 dark:text-red-400">Amount</p>
                        <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                          -${expense.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                          <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Date</p>
                          <p className="font-medium text-foreground">
                            {format(new Date(expense.date), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <TrendingDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium text-foreground capitalize">
                            {expense.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {expense.description && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground leading-relaxed">{expense.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {expense.payment_method && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Payment Method</p>
                        <p className="font-medium text-foreground">{expense.payment_method}</p>
                      </div>
                    )}
                    
                    {expense.merchant && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Merchant</p>
                        <p className="font-medium text-foreground">{expense.merchant}</p>
                      </div>
                    )}
                    
                    {expense.tags && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Tags</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {expense.tags.split(',').map((tag, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {expense.recurring && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Recurring</p>
                        <p className="font-medium text-foreground capitalize">{expense.recurring ? 'Yes' : 'No'}</p>
                      </div>
                    )}
                  </div>

                  {/* Receipt */}
                  {expense.receipt_url && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                          <Receipt className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Receipt</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(expense.receipt_url, '_blank')}
                            className="border-blue-500 hover:bg-blue-50 text-blue-600"
                          >
                            View Receipt
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {expense.notes && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Notes</p>
                          <p className="text-foreground leading-relaxed">{expense.notes}</p>
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
                    <span className="text-sm text-muted-foreground">Category</span>
                    <span className="font-semibold text-foreground">{expense.category}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(expense.created_at || expense.date), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  
                  {expense.recurring && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Type</span>
                      <span className="font-semibold text-foreground">Recurring</span>
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
                  <Link href={`/expenses/${id}/edit`} className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-accent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Expense
                    </Button>
                  </Link>
                  
                  {expense.receipt_url && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(expense.receipt_url, '_blank')}
                      className="w-full border-blue-500 hover:bg-blue-50 text-blue-600"
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      View Receipt
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full border-destructive hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Expense
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  )
}
