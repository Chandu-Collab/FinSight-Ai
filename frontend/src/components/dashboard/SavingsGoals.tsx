'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Plus, Calendar } from 'lucide-react'
import { formatCurrency, calculatePercentage, getDaysUntilDeadline } from '@/lib/utils'

interface Goal {
  id: number
  title: string
  target: number
  current: number
  deadline?: string
}

interface SavingsGoalsProps {
  goals: Goal[]
}

export function SavingsGoals({ goals }: SavingsGoalsProps) {
  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-400'
    if (percentage >= 50) return 'bg-yellow-500 dark:bg-yellow-400'
    return 'bg-blue-500 dark:bg-blue-400'
  }

  const getDeadlineText = (deadline?: string) => {
    if (!deadline) return 'No deadline'
    const daysLeft = getDaysUntilDeadline(deadline)
    if (daysLeft < 0) return 'Overdue'
    if (daysLeft === 0) return 'Due today'
    if (daysLeft === 1) return '1 day left'
    return `${daysLeft} days left`
  }

  const getDeadlineColor = (deadline?: string) => {
    if (!deadline) return 'text-muted-foreground'
    const daysLeft = getDaysUntilDeadline(deadline)
    if (daysLeft < 0) return 'text-red-600 dark:text-red-400'
    if (daysLeft <= 7) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-muted-foreground'
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
          <h3 className="text-lg font-semibold text-card-foreground">Savings Goals</h3>
        </div>
        <Button size="sm" className="p-2">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = calculatePercentage(goal.current, goal.target)
          const remaining = goal.target - goal.current

          return (
            <div key={goal.id} className="p-4 border border-border rounded-lg bg-card text-card-foreground">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-card-foreground">{goal.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(goal.current)} of {formatCurrency(goal.target)}
                  </p>
                </div>
                {goal.deadline && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className={getDeadlineColor(goal.deadline)}>
                      {getDeadlineText(goal.deadline)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium text-card-foreground">{percentage}%</span>
                </div>

                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${getProgressColor(percentage)}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>

                <p className="text-xs text-muted-foreground">
                  {formatCurrency(remaining)} remaining
                </p>
              </div>
            </div>
          )
        })}
        
        {goals.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No savings goals yet</p>
            <Button size="sm">Create Your First Goal</Button>
          </div>
        )}
      </div>
    </Card>
  )
}
