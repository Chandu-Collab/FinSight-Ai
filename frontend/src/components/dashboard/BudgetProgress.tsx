'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, calculatePercentage } from '@/lib/utils'

interface BudgetProgressProps {
  budgetUsed: number
  budgetLimit: number
}

export function BudgetProgress({ budgetUsed, budgetLimit }: BudgetProgressProps) {
  const percentage = calculatePercentage(budgetUsed, budgetLimit)
  const remaining = budgetLimit - budgetUsed
  const isOverBudget = budgetUsed > budgetLimit
  const isNearLimit = percentage >= 80 && percentage <= 100

  const getProgressColor = () => {
    if (isOverBudget) return 'bg-red-500'
    if (isNearLimit) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  const getStatusIcon = () => {
    if (isOverBudget) {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    return <CheckCircle className="h-5 w-5 text-green-600" />
  }

  const getStatusText = () => {
    if (isOverBudget) {
      return `Over budget by ${formatCurrency(Math.abs(remaining))}`
    }
    return `${formatCurrency(remaining)} remaining`
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-card-foreground">Monthly Budget</h3>
        {getStatusIcon()}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Budget Used</span>
            <span className={`font-semibold ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-card-foreground'}`}>
              {formatCurrency(budgetUsed)} / {formatCurrency(budgetLimit)}
            </span>
          </div>

          <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-xs mt-1">
            <span className="text-muted-foreground">{percentage}% used</span>
            <span className={`font-medium ${isOverBudget ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {/* Budget Categories */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Category Breakdown</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
                <span className="text-sm text-muted-foreground">Food</span>
              </div>
              <span className="text-sm font-medium text-card-foreground">$1,200 / $1,500</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-muted-foreground">Transport</span>
              </div>
              <span className="text-sm font-medium text-card-foreground">$450 / $500</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                <span className="text-sm text-muted-foreground">Entertainment</span>
              </div>
              <span className="text-sm font-medium text-card-foreground">$300 / $400</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
