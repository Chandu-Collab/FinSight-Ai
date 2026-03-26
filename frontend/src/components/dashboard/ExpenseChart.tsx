'use client'

import { Card } from '@/components/ui/card'
import { TrendingDown } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const mockData = [
  { category: 'Food', amount: 1200, color: '#ef4444' },
  { category: 'Transport', amount: 450, color: '#f59e0b' },
  { category: 'Entertainment', amount: 300, color: '#8b5cf6' },
  { category: 'Utilities', amount: 280, color: '#3b82f6' },
  { category: 'Shopping', amount: 870, color: '#ec4899' },
  { category: 'Health', amount: 200, color: '#10b981' },
]

export function ExpenseChart() {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Expenses by Category</h3>
        <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-300" />
        </div>
      </div>

      <div className="h-64 bg-card rounded-lg">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={mockData} layout="horizontal" style={{ backgroundColor: 'hsl(var(--card))' }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              type="number"
              stroke="var(--tw-prose-invert-borders, #6b7280)"
              fontSize={12}
              tickFormatter={(value) => `$${value}`}
            />
            <YAxis 
              type="category"
              dataKey="category"
              stroke="var(--tw-prose-invert-borders, #6b7280)"
              fontSize={12}
              width={80}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Amount']}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                color: 'hsl(var(--card-foreground))',
              }}
            />
            <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
              {mockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 text-sm text-muted-foreground">
        <p>Total expenses: <span className="font-semibold text-card-foreground">$3,300</span></p>
      </div>
    </Card>
  )
}
