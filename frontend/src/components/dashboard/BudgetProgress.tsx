'use client'

import { Card } from '@/components/ui/card'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { formatCurrency, calculatePercentage } from '@/lib/utils'

// Define proper types for budget data
interface BudgetItem {
  id: string
  name?: string
  category?: string
  amount: number | string
  spent: number | string
}

interface GroupedBudget {
  name: string
  totalAmount: number
  totalSpent: number
  ids: string[]
}

interface BudgetProgressProps {
  budgetUsed: number
  budgetLimit: number
  budgets?: BudgetItem[]
}

export function BudgetProgress({ budgetUsed, budgetLimit, budgets = [] }: BudgetProgressProps) {
  // Group budgets by category and sum their amounts
  const groupedBudgets = budgets.reduce((acc: Record<string, GroupedBudget>, budget: BudgetItem) => {
    const categoryName = budget.name || budget.category || 'Uncategorized'
    if (!acc[categoryName]) {
      acc[categoryName] = {
        name: categoryName,
        totalAmount: 0,
        totalSpent: 0,
        ids: []
      }
    }
    acc[categoryName].totalAmount += isNaN(Number(budget.amount)) ? 0 : Number(budget.amount)
    acc[categoryName].totalSpent += isNaN(Number(budget.spent)) ? 0 : Number(budget.spent)
    acc[categoryName].ids.push(budget.id)
    return acc
  }, {})
  
  // Convert to array for rendering
  const uniqueBudgets: GroupedBudget[] = Object.values(groupedBudgets)
  
  // Calculate totals from grouped data
  const calculatedBudgetUsed = uniqueBudgets.reduce((sum: number, budget: GroupedBudget) => sum + budget.totalSpent, 0)
  const calculatedBudgetLimit = uniqueBudgets.reduce((sum: number, budget: GroupedBudget) => sum + budget.totalAmount, 0)
  
  // Use calculated values, fallback to passed values if no budget data
  const safeBudgetUsed = budgets.length > 0 ? calculatedBudgetUsed : (isNaN(Number(budgetUsed)) ? 0 : Number(budgetUsed))
  const safeBudgetLimit = budgets.length > 0 ? calculatedBudgetLimit : (isNaN(Number(budgetLimit)) ? 0 : Number(budgetLimit))
  
  const percentage = calculatePercentage(safeBudgetUsed, safeBudgetLimit)
  const remaining = safeBudgetLimit - safeBudgetUsed
  const isOverBudget = safeBudgetUsed > safeBudgetLimit
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
              {formatCurrency(safeBudgetUsed)} / {formatCurrency(safeBudgetLimit)}
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
        {budgets.length > 0 && (
          <div className="pt-4 border-t border-border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium text-muted-foreground">Category Breakdown</h4>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total Used: <span className="font-semibold text-card-foreground">{formatCurrency(safeBudgetUsed)}</span></p>
                <p className="text-xs text-muted-foreground">Total Budget: <span className="font-semibold text-card-foreground">{formatCurrency(safeBudgetLimit)}</span></p>
              </div>
            </div>
            <div className="space-y-3">
              {uniqueBudgets.map((budget: GroupedBudget, index: number) => {
                // Ensure budget values are safe numbers
                const budgetAmount: number = budget.totalAmount
                const budgetSpent: number = budget.totalSpent
                const categoryPercentage: number = calculatePercentage(budgetSpent, budgetAmount)
                const isOverCategoryBudget: boolean = budgetSpent > budgetAmount
                const categoryColors = [
                  'bg-red-500',
                  'bg-blue-500', 
                  'bg-purple-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-orange-500',
                  'bg-pink-500',
                  'bg-indigo-500'
                ]
                const color = categoryColors[index % categoryColors.length]
                
                return (
                  <div key={`${budget.name}-${index}`} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 ${color} rounded-full mr-2`}></div>
                      <span className="text-sm text-muted-foreground">{budget.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${isOverCategoryBudget ? 'text-red-600' : 'text-card-foreground'}`}>
                      {formatCurrency(budgetSpent)} / {formatCurrency(budgetAmount)}
                    </span>
                  </div>
                )
              })}
            </div>
            
            {/* Summary Row */}
            <div className="mt-4 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
                  <span className="text-sm font-semibold text-card-foreground">Total Summary</span>
                </div>
                <div className="text-right">
                  <span className={`text-sm font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(safeBudgetUsed)} / {formatCurrency(safeBudgetLimit)}
                  </span>
                  <div className="text-xs text-muted-foreground">
                    {percentage.toFixed(1)}% of total budget used
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {budgets.length === 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-muted-foreground mb-3">Category Breakdown</h4>
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">No budgets set for this month</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
