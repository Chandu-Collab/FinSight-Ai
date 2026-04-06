'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import { expenseApi } from '@/lib/api/production'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ExpenseData {
  month: string
  expenses: number
}

export function ExpenseChart() {
  const [data, setData] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenseData()
  }, [])

  const fetchExpenseData = async () => {
    try {
      // Get user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      if (!userId) {
        console.warn('No user ID found for expense chart')
        return
      }

      const response = await expenseApi.getAll(userId)
      
      const expenseData = Array.isArray(response.data) ? response.data.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })) : Array.isArray(response) ? response.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })) : []

      // Group expenses by month for the last 6 months
      const monthlyExpenses = new Map<string, number>()
      const currentDate = new Date()
      
      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        monthlyExpenses.set(monthKey, 0)
      }

      // Sum expenses by month
      expenseData.forEach(expense => {
        if (expense.date) {
          const expenseDate = new Date(expense.date)
          const monthKey = expenseDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          
          // Only include expenses from the last 6 months
          const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)
          if (expenseDate >= sixMonthsAgo) {
            const amount = Number(expense.amount) || 0
            const validAmount = isNaN(amount) ? 0 : amount
            const currentAmount = monthlyExpenses.get(monthKey) || 0
            monthlyExpenses.set(monthKey, currentAmount + validAmount)
          }
        }
      })

      // Convert to array format for chart
      const chartData: ExpenseData[] = Array.from(monthlyExpenses.entries()).map(([month, expenses]) => ({
        month,
        expenses
      }))

      setData(chartData)
    } catch (error) {
      console.error('Error fetching expense data for chart:', error)
    } finally {
      setLoading(false)
    }
  }

  const averageExpenses = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.expenses || 0), 0) / data.length 
    : 0

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">Expense Trend</h3>
          <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
            <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-300" />
          </div>
        </div>
        <div className="h-64 bg-card rounded-lg flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Expense Trend</h3>
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-300" />
        </div>
      </div>

      <div className="h-64 bg-card rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} style={{ backgroundColor: 'hsl(var(--card))' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="var(--tw-prose-invert-borders, #6b7280)"
              fontSize={12}
            />
            <YAxis 
              stroke="var(--tw-prose-invert-borders, #6b7280)"
              fontSize={12}
              tickFormatter={(value) => `₹${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`₹${value.toLocaleString()}`, 'Expenses']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="expenses" 
              stroke="#ef4444" 
              strokeWidth={2}
              dot={{ fill: '#ef4444', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Average monthly expenses: <span className="font-semibold text-card-foreground">₹{isNaN(averageExpenses) ? '0' : averageExpenses.toLocaleString()}</span></p>
      </div>
    </Card>
  )
}
