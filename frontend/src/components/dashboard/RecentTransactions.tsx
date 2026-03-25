'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Eye, EyeOff, TrendingUp, TrendingDown } from 'lucide-react'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  category?: string
  source?: string
  description?: string
  date: string
}

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // Mock data - replace with actual API call
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'expense',
        amount: 85.50,
        category: 'Food',
        description: 'Grocery shopping',
        date: '2024-03-24'
      },
      {
        id: '2',
        type: 'income',
        amount: 3000,
        source: 'Salary',
        description: 'Monthly salary',
        date: '2024-03-23'
      },
      {
        id: '3',
        type: 'expense',
        amount: 45.00,
        category: 'Transport',
        description: 'Uber ride',
        date: '2024-03-22'
      },
      {
        id: '4',
        type: 'expense',
        amount: 120.00,
        category: 'Entertainment',
        description: 'Movie tickets',
        date: '2024-03-21'
      },
      {
        id: '5',
        type: 'income',
        amount: 500,
        source: 'Freelance',
        description: 'Web design project',
        date: '2024-03-20'
      }
    ]
    setTransactions(mockTransactions)
  }, [])

  const displayedTransactions = showAll ? transactions : transactions.slice(0, 3)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent Transactions</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAll(!showAll)}
          className="flex items-center space-x-1"
        >
          {showAll ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          <span>{showAll ? 'Show Less' : 'Show All'}</span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayedTransactions.map((transaction) => (
            <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium">
                    {transaction.source || transaction.category}
                  </p>
                  <p className="text-sm text-gray-500">
                    {transaction.description}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(transaction.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className={`text-lg font-semibold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                ${transaction.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
        
        {transactions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No transactions yet. Add your first transaction to get started!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
