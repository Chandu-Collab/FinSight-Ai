'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import { incomeApi } from '@/lib/api/production'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface IncomeData {
  month: string
  income: number
}

export function IncomeChart() {
  const [data, setData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchIncomeData()
  }, [])

  const fetchIncomeData = async () => {
    try {
      // Get user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      if (!userId) {
        console.warn('No user ID found for income chart')
        return
      }

      const response = await incomeApi.getAll(userId)
      const incomeData = Array.isArray(response.data) ? response.data.map(item => ({
        ...item,
        amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount
      })) : []

      console.log('📈 Income chart data:', incomeData)

      // Group income by month for the last 6 months
      const monthlyIncome = new Map<string, number>()
      const currentDate = new Date()
      
      // Initialize last 6 months with 0
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1)
        const monthKey = monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        const monthString = monthDate.toISOString().slice(0, 7) // YYYY-MM
        monthlyIncome.set(monthKey, 0)
      }

      // Sum income by month
      incomeData.forEach(income => {
        if (income.date) {
          const incomeDate = new Date(income.date)
          const monthKey = incomeDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
          const monthString = incomeDate.toISOString().slice(0, 7)
          
          // Only include income from the last 6 months
          const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 6, 1)
          if (incomeDate >= sixMonthsAgo) {
            const amount = Number(income.amount) || 0
            const validAmount = isNaN(amount) ? 0 : amount
            const currentAmount = monthlyIncome.get(monthKey) || 0
            monthlyIncome.set(monthKey, currentAmount + validAmount)
          }
        }
      })

      // Convert to array format for chart
      const chartData: IncomeData[] = Array.from(monthlyIncome.entries()).map(([month, income]) => ({
        month,
        income
      }))

      console.log('📊 Processed chart data:', chartData)
      setData(chartData)
    } catch (error) {
      console.error('Error fetching income data for chart:', error)
    } finally {
      setLoading(false)
    }
  }

  const averageIncome = data.length > 0 
    ? data.reduce((sum, item) => sum + (item.income || 0), 0) / data.length 
    : 0

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-card-foreground">Income Trend</h3>
          <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-300" />
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
        <h3 className="text-lg font-semibold text-card-foreground">Income Trend</h3>
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-300" />
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
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Income']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Line 
              type="monotone" 
              dataKey="income" 
              stroke="#10b981" 
              strokeWidth={2}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Average monthly income: <span className="font-semibold text-card-foreground">${averageIncome.toLocaleString()}</span></p>
      </div>
    </Card>
  )
}
