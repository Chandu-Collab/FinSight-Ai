'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowUpRight, ArrowDownRight, MoreHorizontal } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Transaction {
  id: number
  type: 'income' | 'expense'
  amount: number
  category?: string
  source?: string
  date: string
  description: string
}

interface RecentTransactionsProps {
  transactions: Transaction[]
}

export function RecentTransactions({ transactions }: RecentTransactionsProps) {
  const getIcon = (type: 'income' | 'expense') => {
    if (type === 'income') {
      return (
        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
          <ArrowUpRight className="h-4 w-4 text-green-600 dark:text-green-300" />
        </div>
      )
    }
    return (
      <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
        <ArrowDownRight className="h-4 w-4 text-red-600 dark:text-red-300" />
      </div>
    )
  }

  const getAmountColor = (type: 'income' | 'expense') => {
    return type === 'income' ? 'text-green-600' : 'text-red-600'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Recent Transactions</h3>
        <Button variant="outline" size="sm">
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors">
            <div className="flex items-center space-x-3">
              {getIcon(transaction.type)}
              <div>
                <p className="font-medium text-card-foreground">{transaction.description}</p>
                <p className="text-sm text-muted-foreground">
                  {transaction.category || transaction.source} • {formatDate(transaction.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="text-right">
                <p className={`font-semibold ${getAmountColor(transaction.type)}`}>
                  {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                </p>
              </div>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        {transactions.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No recent transactions</p>
          </div>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <Button variant="outline" className="w-full">
          Add Transaction
        </Button>
      </div>
    </Card>
  )
}
