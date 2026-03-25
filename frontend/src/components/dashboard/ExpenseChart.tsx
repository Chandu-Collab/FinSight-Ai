'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

export default function ExpenseChart() {
  const [chartData, setChartData] = useState<any[]>([])
  const [categoryData, setCategoryData] = useState<any[]>([])

  useEffect(() => {
    // Mock data - replace with actual API call
    const monthlyData = [
      { month: 'Jan', expenses: 2800 },
      { month: 'Feb', expenses: 3200 },
      { month: 'Mar', expenses: 2900 },
      { month: 'Apr', expenses: 3500 },
      { month: 'May', expenses: 3100 },
      { month: 'Jun', expenses: 3300 }
    ]

    const categoryBreakdown = [
      { name: 'Food', value: 800, color: '#8884d8' },
      { name: 'Transport', value: 400, color: '#82ca9d' },
      { name: 'Entertainment', value: 300, color: '#ffc658' },
      { name: 'Utilities', value: 500, color: '#ff7c7c' },
      { name: 'Shopping', value: 600, color: '#8dd1e1' },
      { name: 'Other', value: 700, color: '#d084d0' }
    ]

    setChartData(monthlyData)
    setCategoryData(categoryBreakdown)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value}`} />
              <Bar dataKey="expenses" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `$${value}`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
