'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { incomeApi, Income } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Edit, Trash2, Calendar, DollarSign, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const sourceColors: Record<string, { bg: string, text: string, gradient: string }> = {
  'Salary': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', gradient: 'from-blue-500 to-cyan-500' },
  'Freelance': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', gradient: 'from-purple-500 to-pink-500' },
  'Business': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', gradient: 'from-green-500 to-emerald-500' },
  'Investments': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', gradient: 'from-yellow-500 to-amber-500' },
  'Rentals': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', gradient: 'from-orange-500 to-red-500' },
  'Dividends': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
  'Side Hustle': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', gradient: 'from-pink-500 to-rose-500' },
  'Gifts': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', gradient: 'from-teal-500 to-green-500' },
  'Refunds': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' },
  'Other': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' }
}

interface IncomeData {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at?: string
  category?: string
  currency?: string
  status?: string
  frequency?: string
  tax_deducted?: number | string
  attachment_url?: string
  recurring_id?: string
  updated_at?: string
  user_id?: string
}

export default function IncomeDetailPage() {
  const [income, setIncome] = useState<IncomeData | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchIncome()
  }, [id])

  const fetchIncome = async () => {
    try {
      console.log('ðŸ” Fetching income details for ID:', id)
      
      const response = await incomeApi.getById(id)
      console.log('ðŸ“Š Income detail response:', response)
      
      if (response.data) {
        // Transform the data to ensure amount and tax_deducted are numbers
        const transformedData = {
          ...response.data,
          amount: typeof response.data.amount === 'string' ? parseFloat(response.data.amount) : response.data.amount,
          tax_deducted: response.data.tax_deducted ? (typeof response.data.tax_deducted === 'string' ? parseFloat(response.data.tax_deducted) : response.data.tax_deducted) : undefined
        }
        setIncome(transformedData)
      } else {
        toast.error('Income record not found')
        router.push('/income')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch income record')
      console.error('Error fetching income:', error)
      router.push('/income')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      await incomeApi.delete(id)
      toast.success('Income deleted successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete income')
      console.error('Error deleting income:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading income details...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!income) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">Income not found</h2>
            <p className="text-muted-foreground mb-4">The income record you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/income')}>
              Back to Income
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
                  onClick={() => router.push('/income')}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Income</span>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    Income Details
                  </h1>
                  <p className="text-sm text-muted-foreground">View and manage income information</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Link href={`/income/${id}/edit`}>
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
            {/* Main Income Card */}
            <div className="lg:col-span-2">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-green-200/50 shadow-lg">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-semibold text-foreground">Income Information</CardTitle>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${sourceColors[income.source]?.bg || 'bg-muted'} ${sourceColors[income.source]?.text || 'text-foreground'}`}>
                      {income.source}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Amount */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6 border border-green-200/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">Amount</p>
                        <p className="text-3xl font-bold text-green-700 dark:text-green-300">
                          ${income.amount.toLocaleString()}
                        </p>
                      </div>
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <DollarSign className="h-6 w-6 text-white" />
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
                            {format(new Date(income.date), 'MMMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                          <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Status</p>
                          <p className="font-medium text-foreground capitalize">
                            {income.status || 'Active'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {income.description && (
                    <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mt-1">
                          <FileText className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground mb-2">Description</p>
                          <p className="text-foreground leading-relaxed">{income.description}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {income.currency && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="font-medium text-foreground">{income.currency}</p>
                      </div>
                    )}
                    
                    {income.category && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Category</p>
                        <p className="font-medium text-foreground">{income.category}</p>
                      </div>
                    )}
                    
                    {income.frequency && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Frequency</p>
                        <p className="font-medium text-foreground capitalize">{income.frequency}</p>
                      </div>
                    )}
                    
                    {income.tax_deducted && (
                      <div className="bg-card/50 rounded-xl p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">Tax Deducted</p>
                        <p className="font-medium text-foreground">₹{income.tax_deducted.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
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
                    <span className="text-sm text-muted-foreground">Net Amount</span>
                    <span className="font-semibold text-foreground">
                      {income.currency || '₹'}{((income.amount || 0) - (Number(income.tax_deducted) || 0)).toLocaleString()}
                    </span>
                  </div>
                  
                  {income.tax_deducted && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Tax Rate</span>
                      <span className="font-semibold text-foreground">
                        {((Number(income.tax_deducted) / income.amount) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {format(new Date(income.created_at || income.date), 'MMM dd, yyyy')}
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
                  <Link href={`/income/${id}/edit`} className="w-full">
                    <Button variant="outline" className="w-full border-border hover:bg-accent">
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Income
                    </Button>
                  </Link>
                  
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    className="w-full border-destructive hover:bg-destructive/10 text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Income
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
