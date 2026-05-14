'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getBudgetById, updateBudget, deleteBudget } from '@/lib/api/budgets'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Target, Loader2, AlertTriangle, Trash2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Budget {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  spent: number
  month: string
  alert_threshold: number
  description: string
  is_active: boolean
  rollover: boolean
  created_at: string
}

export default function EditBudgetPage() {
  const [budget, setBudget] = useState<Budget | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

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

  const budgetRecommendations: Record<string, { min: number; max: number; description: string }> = {
    'Food & Dining': { min: 300, max: 800, description: 'Monthly groceries and dining out' },
    'Transportation': { min: 100, max: 500, description: 'Gas, public transport, car maintenance' },
    'Shopping': { min: 100, max: 400, description: 'Clothing, electronics, personal items' },
    'Entertainment': { min: 50, max: 200, description: 'Movies, games, hobbies' },
    'Bills & Utilities': { min: 200, max: 600, description: 'Rent, utilities, phone, internet' },
    'Healthcare': { min: 50, max: 300, description: 'Insurance, medications, doctor visits' },
    'Education': { min: 50, max: 200, description: 'Courses, books, learning materials' },
    'Travel': { min: 100, max: 500, description: 'Vacations, business trips' },
    'Subscriptions': { min: 20, max: 100, description: 'Streaming, software, memberships' },
    'Other': { min: 50, max: 300, description: 'Miscellaneous expenses' }
  }

  useEffect(() => {
    fetchBudget()
  }, [id])

  const fetchBudget = async () => {
    setLoading(true)
    try {
      console.log('Fetching budget with ID:', id)
      const data = await getBudgetById(id)
      console.log('Received budget data:', data)
      
      if (data && data.data) {
        // If the API response has a data wrapper
        setBudget(data.data)
        console.log('Set budget from data.data:', data.data)
      } else if (data) {
        // If the API response is direct
        setBudget(data)
        console.log('Set budget directly:', data)
      } else {
        throw new Error('No budget data received')
      }
    } catch (error: any) {
      console.error('Error fetching budget:', error)
      toast.error('Failed to fetch budget: ' + (error.message || 'Unknown error'))
      router.push('/budgets')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    if (budget) {
      setBudget(prev => ({
        ...prev!,
        [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
      }))
    }
  }

  const handleQuickAmount = (amount: number) => {
    if (budget) {
      setBudget(prev => ({
        ...prev!,
        amount: amount
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!budget) return

    setSaving(true)

    // Validate form
    if (!budget.name.trim()) {
      toast.error('Please enter a budget name')
      setSaving(false)
      return
    }

    if (!budget.category.trim()) {
      toast.error('Please select a category')
      setSaving(false)
      return
    }

    if (!budget.amount || budget.amount <= 0) {
      toast.error('Please enter a valid amount')
      setSaving(false)
      return
    }

    if (!budget.month) {
      toast.error('Please select a month')
      setSaving(false)
      return
    }

    try {
      await updateBudget(id, {
        name: budget.name,
        category: budget.category,
        amount: budget.amount,
        month: budget.month,
        alert_threshold: budget.alert_threshold,
        description: budget.description,
        is_active: budget.is_active,
        rollover: budget.rollover,
        spent: budget.spent
      })

      toast.success('Budget updated successfully!')
      router.push('/budgets')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update budget')
      console.error('Error updating budget:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading budget data...</p>
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
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Target className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Budget not found</h2>
            <p className="text-muted-foreground mb-6">The budget you're looking for doesn't exist.</p>
            <Link href="/budgets">
              <Button className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg">
                Back to Budgets
              </Button>
            </Link>
          </div>
        </div>
      </AppLayout>
    )
  }

  const currentRecommendation = budgetRecommendations[budget.category]

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/budgets">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Budgets</span>
                  </Button>
                </Link>
                <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Edit Budget
                  </h1>
                  <p className="text-sm text-muted-foreground">Update budget details</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Edit Budget Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Budget Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                    Budget Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={budget.name || ''}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                    placeholder="e.g., Monthly Groceries"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    required
                    value={budget.category || ''}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                  >
                    <option value="">Select a category...</option>
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {expenseCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setBudget(prev => ({ ...prev!, category }))}
                          className={`p-2 text-xs rounded-lg transition-colors flex flex-col items-center ${
                            budget.category === category
                              ? 'bg-primary/20 text-primary border border-primary/30'
                              : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                          }`}
                        >
                          <span>{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                    Budget Amount *
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      step="0.01"
                      min="0"
                      required
                      value={budget.amount || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Month */}
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-foreground mb-2">
                    Budget Period *
                  </label>
                  <div className="mt-1">
                    <input
                      type="month"
                      id="month"
                      name="month"
                      required
                      value={budget.month || ''}
                      onChange={handleInputChange}
                      className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                      min="2020-01"
                      max="2030-12"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Select the month and year for this budget period
                  </p>
                </div>

                {/* Alert Threshold */}
                <div>
                  <label htmlFor="alert_threshold" className="block text-sm font-medium text-foreground mb-2">
                    Alert Threshold
                  </label>
                  <select
                    id="alert_threshold"
                    name="alert_threshold"
                    value={budget.alert_threshold || 80}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                  >
                    <option value="50">50% - Early Warning</option>
                    <option value="75">75% - Warning</option>
                    <option value="80">80% - Standard Warning</option>
                    <option value="90">90% - Critical Warning</option>
                    <option value="95">95% - Urgent Alert</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Send alerts when spending reaches this percentage of the budget
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    rows={3}
                    value={budget.description || ''}
                    onChange={handleInputChange}
                    className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                    placeholder="Optional description for this budget..."
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      name="is_active"
                      type="checkbox"
                      checked={budget.is_active ?? true}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Active Budget</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      name="rollover"
                      type="checkbox"
                      checked={budget.rollover ?? false}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Rollover Unused Amount</span>
                  </label>
                </div>

                {/* Initial Spent (optional) */}
                <div>
                  <label htmlFor="spent" className="block text-sm font-medium text-foreground mb-2">
                    Initial Spent Amount
                  </label>
                  <div className="relative rounded-xl shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-muted-foreground sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="spent"
                      name="spent"
                      step="0.01"
                      min="0"
                      value={budget.spent || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    If you've already spent money on this category, enter the amount here
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t border-border/50">
                  <Link href="/budgets">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4 mr-2" />
                        Update Budget
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

            {/* Delete Section */}
            <Card className="mt-6 border-red-200/50 bg-card/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center space-x-2">
                  <Trash2 className="h-5 w-5" />
                  <span>Danger Zone</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Once you delete a budget, there is no going back. Please be certain.
                  </p>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this budget?')) {
                        handleDelete()
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Budget
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  )

  async function handleDelete() {
    try {
      await deleteBudget(id)
      toast.success('Budget deleted successfully!')
      router.push('/budgets')
    } catch (error: any) {
      toast.error('Failed to delete budget')
      console.error('Error deleting budget:', error)
    }
  }
}
