'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const mockData = [
  { month: 'Jan', income: 7500 },
  { month: 'Feb', income: 8200 },
  { month: 'Mar', income: 8500 },
  { month: 'Apr', income: 7800 },
  { month: 'May', income: 9100 },
  { month: 'Jun', income: 8500 },
]

export function IncomeChart() {
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
          <LineChart data={mockData} style={{ backgroundColor: 'hsl(var(--card))' }}>
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
        <p>Average monthly income: <span className="font-semibold text-card-foreground">$8,100</span></p>
      </div>
    </Card>
  )
}
