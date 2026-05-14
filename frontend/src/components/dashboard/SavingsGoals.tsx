'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Target, Plus, Calendar } from 'lucide-react'
import { formatCurrency, calculatePercentage, getDaysUntilDeadline } from '@/lib/utils'
import { SavingsGoalModal } from '@/components/savings-goals/SavingsGoalModal'
import { savingsGoalsAPI } from '@/lib/api/savings-goals'
import { useAuth } from '@/contexts/AuthContext'

interface Goal {
  id: string
  title: string
  target_amount: number
  current_amount: number
  target_date?: string
  name?: string
}

interface SavingsGoalsProps {
  goals: Goal[]
  onGoalCreated?: () => void
}

export function SavingsGoals({ goals, onGoalCreated }: SavingsGoalsProps) {
  const { user } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500 dark:bg-green-400'
    if (percentage >= 50) return 'bg-yellow-500 dark:bg-yellow-400'
    return 'bg-blue-500 dark:bg-blue-400'
  }

  const handleCreateGoal = async (goalData: any) => {
    try {
      setIsLoading(true)
      const userId = user?.id || 'demo-user-001'
      await savingsGoalsAPI.createSavingsGoal({
        ...goalData,
        user_id: userId
      })
      setIsModalOpen(false)
      if (onGoalCreated) {
        onGoalCreated()
      }
    } catch (error) {
      console.error('Error creating savings goal:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getDeadlineText = (target_date?: string) => {
    if (!target_date) return 'No deadline'
    const daysLeft = getDaysUntilDeadline(target_date)
    if (daysLeft < 0) return 'Overdue'
    if (daysLeft === 0) return 'Due today'
    if (daysLeft === 1) return '1 day left'
    return `${daysLeft} days left`
  }

  const getDeadlineColor = (target_date?: string) => {
    if (!target_date) return 'text-muted-foreground'
    const daysLeft = getDaysUntilDeadline(target_date)
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
        <Button size="sm" className="p-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {goals.map((goal) => {
          const percentage = calculatePercentage(goal.current_amount, goal.target_amount)
          const remaining = goal.target_amount - goal.current_amount
          const goalTitle = goal.title || goal.name || 'Untitled Goal'

          return (
            <div key={goal.id} className="p-4 border border-border rounded-lg bg-card text-card-foreground">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-card-foreground">{goalTitle}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                  </p>
                </div>
                {goal.target_date && (
                  <div className="flex items-center text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span className={getDeadlineColor(goal.target_date)}>
                      {getDeadlineText(goal.target_date)}
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
            <Button size="sm" onClick={() => setIsModalOpen(true)}>Create Your First Goal</Button>
          </div>
        )}
      </div>
      
      <SavingsGoalModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateGoal}
        isLoading={isLoading}
      />
    </Card>
  )
}
