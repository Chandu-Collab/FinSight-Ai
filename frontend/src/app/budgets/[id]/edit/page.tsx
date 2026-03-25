'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Target, Loader2, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface Budget {
  id: string
  name: string
  category: string
  amount: number
  spent: number
  month: string
  alert_threshold: number
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
    'Other': '📌'
  }

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
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setBudget(data)
      }
    } catch (error: any) {
      toast.error('Failed to fetch budget')
      console.error('Error fetching budget:', error)
      router.push('/budgets')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (budget) {
      setBudget(prev => ({
        ...prev!,
        [name]: value
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
      const { error } = await supabase
        .from('budgets')
        .update({
          name: budget.name,
          category: budget.category,
          amount: budget.amount,
          month: budget.month,
          alert_threshold: budget.alert_threshold
        })
        .eq('id', id)

      if (error) throw error

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Budget not found</h2>
          <p className="mt-2 text-gray-500">The budget you're looking for doesn't exist.</p>
          <Link href="/budgets">
            <Button className="mt-4">Back to Budgets</Button>
          </Link>
        </div>
      </div>
    )
  }

  const currentRecommendation = budgetRecommendations[budget.category]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/budgets">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Budgets</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Budget</h1>
                <p className="text-sm text-gray-500">Update budget details</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="h-5 w-5" />
                Edit Budget Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Budget Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Budget Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={budget.name}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="e.g., Monthly Groceries"
                    />
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <div className="mt-1">
                    <select
                      id="category"
                      name="category"
                      required
                      value={budget.category}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    >
                      <option value="">Select a category...</option>
                      {expenseCategories.map((category) => (
                        <option key={category} value={category}>
                          {categoryIcons[category]} {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                    <div className="grid grid-cols-5 gap-2">
                      {expenseCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setBudget(prev => ({ ...prev!, category }))}
                          className={`p-2 text-xs rounded-lg transition-colors flex flex-col items-center ${
                            budget.category === category
                              ? 'bg-blue-100 text-blue-800 border border-blue-300'
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          <span className="text-lg">{categoryIcons[category]}</span>
                          <span>{category}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Amount */}
                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
                    Budget Amount *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                      type="number"
                      id="amount"
                      name="amount"
                      step="0.01"
                      min="0"
                      required
                      value={budget.amount}
                      onChange={handleInputChange}
                      className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  
                  {/* Quick Amount Suggestions */}
                  {currentRecommendation && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">
                        Recommended range: ${currentRecommendation.min} - ${currentRecommendation.max}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickAmount(currentRecommendation.min)}
                          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                        >
                          ${currentRecommendation.min}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickAmount(currentRecommendation.max)}
                          className="px-3 py-1 text-xs bg-blue-100 hover:bg-blue-200 rounded-full transition-colors"
                        >
                          ${currentRecommendation.max}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {currentRecommendation.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Month */}
                <div>
                  <label htmlFor="month" className="block text-sm font-medium text-gray-700">
                    Month *
                  </label>
                  <div className="mt-1">
                    <input
                      type="month"
                      id="month"
                      name="month"
                      required
                      value={budget.month}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                </div>

                {/* Alert Threshold */}
                <div>
                  <label htmlFor="alert_threshold" className="block text-sm font-medium text-gray-700">
                    Alert Threshold
                  </label>
                  <div className="mt-1">
                    <select
                      id="alert_threshold"
                      name="alert_threshold"
                      value={budget.alert_threshold}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    >
                      <option value="50">50% - Early Warning</option>
                      <option value="75">75% - Warning</option>
                      <option value="80">80% - Standard Warning</option>
                      <option value="90">90% - Critical Warning</option>
                      <option value="95">95% - Urgent Alert</option>
                    </select>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Send alerts when spending reaches this percentage of the budget
                  </p>
                </div>

                {/* Current Spending Info */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Current Status</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Budgeted</p>
                      <p className="font-medium">${budget.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Spent</p>
                      <p className="font-medium text-orange-600">${budget.spent.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Remaining</p>
                      <p className={`font-medium ${(budget.amount - budget.spent) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(budget.amount - budget.spent).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Percentage Used</p>
                      <p className="font-medium">
                        {((budget.spent / budget.amount) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <Link href="/budgets">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Updating...</span>
                      </>
                    ) : (
                      <>
                        <Target className="h-4 w-4" />
                        <span>Update Budget</span>
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Delete Section */}
          <Card className="mt-6 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
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
                  Delete Budget
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )

  async function handleDelete() {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Budget deleted successfully!')
      router.push('/budgets')
    } catch (error: any) {
      toast.error('Failed to delete budget')
      console.error('Error deleting budget:', error)
    }
  }
}
