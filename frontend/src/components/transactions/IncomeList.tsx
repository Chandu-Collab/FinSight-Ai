'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, ArrowUpRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Income {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at: string
}

export function IncomeList() {
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIncome()
  }, [])

  const fetchIncome = async () => {
    try {
      // Mock data for now - replace with actual API call
      const mockIncome: Income[] = [
        {
          id: '1',
          amount: 3500,
          source: 'Salary',
          description: 'Monthly salary',
          date: '2024-03-24',
          created_at: '2024-03-24T10:00:00Z',
        },
        {
          id: '2',
          amount: 500,
          source: 'Freelance',
          description: 'Web design project',
          date: '2024-03-20',
          created_at: '2024-03-20T15:30:00Z',
        },
        {
          id: '3',
          amount: 150,
          source: 'Investment',
          description: 'Dividend payment',
          date: '2024-03-15',
          created_at: '2024-03-15T09:00:00Z',
        },
      ]
      
      setIncome(mockIncome)
    } catch (error) {
      toast.error('Failed to fetch income data')
      console.error('Error fetching income:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setIncome(income.filter(item => item.id !== id))
      toast.success('Income deleted successfully')
    } catch (error) {
      toast.error('Failed to delete income')
      console.error('Error deleting income:', error)
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Income History</h3>
        <p className="text-sm text-gray-600">Your recent income records</p>
      </div>

      {income.length === 0 ? (
        <div className="text-center py-8">
          <ArrowUpRight className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 mb-4">No income records yet</p>
          <Button>Add Your First Income</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {income.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900">{item.source}</h4>
                  <span className="text-lg font-semibold text-green-600">
                    +{formatCurrency(item.amount)}
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
