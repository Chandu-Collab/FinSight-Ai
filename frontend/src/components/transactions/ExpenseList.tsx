'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowDownRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Expense {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  created_at: string
}

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      // TODO: Replace with actual API call to fetch expense data
      // For now, show empty state until API is implemented
      console.log('🔍 Fetching expense data - API endpoint not yet implemented')
      
      setExpenses([]) // No mock data - empty state
    } catch (error) {
      toast.error('Failed to fetch expense data')
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return
    }

    try {
      // TODO: Replace with actual API call to delete expense
      console.log('🔍 Deleting expense - API endpoint not yet implemented')
      
      // For now, just remove from local state
      setExpenses(expenses.filter(item => item.id !== id))
      toast.success('Expense record deleted')
    } catch (error) {
      toast.error('Failed to delete expense record')
      console.error('Error deleting expense:', error)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Food': 'bg-orange-100 text-orange-800',
      'Transport': 'bg-blue-100 text-blue-800',
      'Entertainment': 'bg-purple-100 text-purple-800',
      'Utilities': 'bg-green-100 text-green-800',
      'Shopping': 'bg-pink-100 text-pink-800',
      'Health': 'bg-red-100 text-red-800',
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Expense History</h3>
        <p className="text-sm text-gray-600">Your recent expense records</p>
      </div>

      {expenses.length === 0 ? (
        <div className="text-center py-8">
          <ArrowDownRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No expense records yet</p>
          <Button>Add Your First Expense</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {expenses.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{item.category}</h4>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}>
                      {item.category}
                    </span>
                  </div>
                  <span className="text-lg font-semibold text-red-600">
                    -{formatCurrency(item.amount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-1">
                  {item.description || 'No description'}
                </p>
                <p className="text-xs text-gray-500">{formatDate(item.date)}</p>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(item.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
