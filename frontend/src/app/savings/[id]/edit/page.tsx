'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Target, Loader2, AlertCircle, Award } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format, differenceInDays, isBefore, addMonths } from 'date-fns'

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

export default function EditSavingsPage() {
  const [goal, setGoal] = useState<SavingsGoal | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

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

  const categoryIcons: Record<string, string> = {
    'Emergency Fund': 'ðŸš¨',
    'Vacation': 'âœˆï¸',
    'Home Purchase': 'ðŸ ',
    'Car Purchase': 'ðŸš—',
    'Education': 'ðŸ“š',
    'Investment': 'ðŸ“ˆ',
    'Retirement': 'ðŸ–ï¸',
    'Wedding': 'ðŸ’',
    'Healthcare': 'ðŸ¥',
    'Technology': 'ðŸ’»',
    'Other': 'ðŸ“Œ'
  }

  useEffect(() => {
    fetchGoal()
  }, [id])

  const fetchGoal = async () => {
    try {
      const { data, error } = await supabase
        .from('savings_goals')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setGoal(data)
      }
    } catch (error: any) {
      toast.error('Failed to fetch savings goal')
      console.error('Error fetching goal:', error)
      router.push('/savings')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    if (goal) {
      setGoal(prev => ({
        ...prev!,
        [name]: name === 'target_amount' || name === 'current_amount' ? parseFloat(value) || 0 : value
      }))
    }
  }

  const calculateMonthlyRequired = () => {
    if (!goal) return 0
    const remaining = goal.target_amount - goal.current_amount
    const days = differenceInDays(new Date(goal.target_date), new Date())
    const months = Math.max(1, Math.ceil(days / 30))
    return remaining / months
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!goal) return

    setSaving(true)

    // Validate form
    if (!goal.name.trim()) {
      toast.error('Please enter a goal name')
      setSaving(false)
      return
    }

    if (!goal.category.trim()) {
      toast.error('Please select a category')
      setSaving(false)
      return
    }

    if (!goal.target_amount || goal.target_amount <= 0) {
      toast.error('Please enter a valid target amount')
      setSaving(false)
      return
    }

    if (!goal.target_date) {
      toast.error('Please select a target date')
      setSaving(false)
      return
    }

    const targetDate = new Date(goal.target_date)
    if (isBefore(targetDate, new Date())) {
      toast.error('Target date must be in the future')
      setSaving(false)
      return
    }

    if (goal.current_amount > goal.target_amount) {
      toast.error('Current amount cannot exceed target amount')
      setSaving(false)
      return
    }

    try {
      const { error } = await supabase
        .from('savings_goals')
        .update({
          name: goal.name,
          target_amount: goal.target_amount,
          current_amount: goal.current_amount,
          target_date: goal.target_date,
          category: goal.category,
          description: goal.description
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Savings goal updated successfully!')
      router.push('/savings')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update savings goal')
      console.error('Error updating goal:', error)
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

  if (!goal) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Savings goal not found</h2>
          <p className="mt-2 text-gray-500">The savings goal you're looking for doesn't exist.</p>
          <Link href="/savings">
            <Button className="mt-4">Back to Savings</Button>
          </Link>
        </div>
      </div>
    )
  }

  const progress_percentage = (goal.current_amount / goal.target_amount) * 100
  const remaining_amount = goal.target_amount - goal.current_amount
  const days_remaining = differenceInDays(new Date(goal.target_date), new Date())
  const monthly_required = calculateMonthlyRequired()

  // Determine status
  let status: 'active' | 'completed' | 'overdue'
  if (progress_percentage >= 100) status = 'completed'
  else if (days_remaining < 0) status = 'overdue'
  else status = 'active'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link href="/savings">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back to Savings</span>
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Edit Savings Goal</h1>
                <p className="text-sm text-gray-500">Update savings goal details</p>
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
                Edit Savings Goal Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Goal Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Goal Name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={goal.name}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="e.g., Emergency Fund, Vacation to Japan"
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
                      value={goal.category}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    >
                      <option value="">Select a category...</option>
                      {savingsCategories.map((category) => (
                        <option key={category} value={category}>
                          {categoryIcons[category]} {category}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-2">Quick select:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {savingsCategories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => setGoal(prev => ({ ...prev!, category }))}
                          className={`p-2 text-xs rounded-lg transition-colors flex flex-col items-center ${
                            goal.category === category
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

                {/* Target Amount */}
                <div>
                  <label htmlFor="target_amount" className="block text-sm font-medium text-gray-700">
                    Target Amount *
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="target_amount"
                      name="target_amount"
                      step="0.01"
                      min="0"
                      required
                      value={goal.target_amount}
                      onChange={handleInputChange}
                      className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                {/* Current Amount */}
                <div>
                  <label htmlFor="current_amount" className="block text-sm font-medium text-gray-700">
                    Current Saved Amount
                  </label>
                  <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">₹</span>
                    </div>
                    <input
                      type="number"
                      id="current_amount"
                      name="current_amount"
                      step="0.01"
                      min="0"
                      value={goal.current_amount}
                      onChange={handleInputChange}
                      className="block w-full pl-8 pr-12 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Amount you've already saved toward this goal
                  </p>
                </div>

                {/* Target Date */}
                <div>
                  <label htmlFor="target_date" className="block text-sm font-medium text-gray-700">
                    Target Date *
                  </label>
                  <div className="mt-1">
                    <input
                      type="date"
                      id="target_date"
                      name="target_date"
                      required
                      min={format(new Date(), 'yyyy-MM-dd')}
                      value={goal.target_date}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={goal.description || ''}
                      onChange={handleInputChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
                      placeholder="Add details about your savings goal..."
                    />
                  </div>
                </div>

                {/* Current Progress */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Progress</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{progress_percentage.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            progress_percentage >= 100 ? 'bg-green-500' :
                            progress_percentage >= 75 ? 'bg-blue-500' :
                            progress_percentage >= 50 ? 'bg-yellow-500' : 'bg-gray-300'
                          }`}
                          style={{ width: `${Math.min(progress_percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
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
                        <p className={`font-medium ${remaining_amount >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                          ₹{Math.abs(remaining_amount).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Days Left</p>
                        <p className={`font-medium ${days_remaining < 30 ? 'text-red-600' : 'text-gray-900'}`}>
                          {days_remaining}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Required */}
                {remaining_amount > 0 && days_remaining > 0 && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-blue-900 mb-2">Monthly Savings Required</h3>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-blue-700">To reach goal on time</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-900">
                          ₹{monthly_required.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Form Actions */}
                <div className="flex justify-end space-x-3">
                  <Link href="/savings">
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
                        <span>Update Goal</span>
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
                  Once you delete a savings goal, there is no going back. Please be certain.
                </p>
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this savings goal?')) {
                      handleDelete()
                    }
                  }}
                >
                  Delete Goal
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
        .from('savings_goals')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Savings goal deleted successfully!')
      router.push('/savings')
    } catch (error: any) {
      toast.error('Failed to delete savings goal')
      console.error('Error deleting goal:', error)
    }
  }
}
