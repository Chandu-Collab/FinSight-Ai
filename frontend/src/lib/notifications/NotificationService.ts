import { supabase } from '@/lib/supabase/client'
import toast from 'react-hot-toast'
import { format, differenceInDays, isBefore } from 'date-fns'

export interface Notification {
  id: string
  type: 'budget_alert' | 'savings_goal' | 'recurring_transaction' | 'system'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  is_acknowledged: boolean
  action_required: boolean
  action_url?: string
  action_label?: string
  metadata?: any
  created_at: string
  acknowledged_at?: string
}

export interface NotificationOptions {
  type: Notification['type']
  title: string
  message: string
  priority: Notification['priority']
  action_required?: boolean
  action_url?: string
  action_label?: string
  metadata?: any
}

class NotificationService {
  // Create a new notification
  static async createNotification(options: NotificationOptions): Promise<Notification | null> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          ...options,
          is_read: false,
          is_acknowledged: false,
          created_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      toast.success('Notification created')
      return data
    } catch (error: any) {
      console.error('Error creating notification:', error)
      toast.error('Failed to create notification')
      return null
    }
  }

  // Create budget alert
  static async createBudgetAlert(
    budgetName: string,
    spent: number,
    budgeted: number,
    percentage: number,
    priority: Notification['priority'] = 'medium'
  ): Promise<Notification | null> {
    const message = `You've spent $${spent.toLocaleString()} of your $${budgeted.toLocaleString()} budget for ${budgetName} (${percentage.toFixed(1)}% utilized).`
    
    return this.createNotification({
      type: 'budget_alert',
      title: `Budget Alert: ${budgetName}`,
      message,
      priority,
      action_required: percentage >= 100,
      action_url: '/budgets',
      action_label: 'View Budget',
      metadata: {
        budgetName,
        spent,
        budgeted,
        percentage
      }
    })
  }

  // Create savings goal notification
  static async createSavingsGoalNotification(
    goalName: string,
    currentAmount: number,
    targetAmount: number,
    progress: number,
    isCompleted: boolean = false
  ): Promise<Notification | null> {
    const title = isCompleted ? `Savings Goal Achieved: ${goalName}` : `Savings Progress: ${goalName}`
    const message = isCompleted 
      ? `Congratulations! You've reached your savings goal of $${targetAmount.toLocaleString()} for ${goalName}.`
      : `Your savings goal "${goalName}" is ${progress.toFixed(1)}% complete. You've saved $${currentAmount.toLocaleString()} of $${targetAmount.toLocaleString()}.`
    
    return this.createNotification({
      type: 'savings_goal',
      title,
      message,
      priority: isCompleted ? 'high' : 'low',
      action_required: false,
      action_url: '/savings',
      action_label: 'View Goals',
      metadata: {
        goalName,
        currentAmount,
        targetAmount,
        progress,
        isCompleted
      }
    })
  }

  // Create recurring transaction notification
  static async createRecurringTransactionNotification(
    transactionName: string,
    type: 'income' | 'expense',
    amount: number,
    frequency: string,
    isOverdue: boolean = false,
    issue: string = ''
  ): Promise<Notification | null> {
    const title = isOverdue ? `Overdue Recurring ${type}` : `Recurring ${type} Issue`
    const message = isOverdue 
      ? `Your recurring ${type} "${transactionName}" of $${amount} (${frequency}) is overdue. ${issue}`
      : `Issue detected with recurring ${type} "${transactionName}": ${issue}`
    
    return this.createNotification({
      type: 'recurring_transaction',
      title,
      message,
      priority: isOverdue ? 'urgent' : 'medium',
      action_required: isOverdue,
      action_url: '/recurring',
      action_label: 'Manage Recurring',
      metadata: {
        transactionName,
        transactionType: type,
        amount,
        frequency,
        isOverdue,
        issue
      }
    })
  }

  // Create system notification
  static async createSystemNotification(
    title: string,
    message: string,
    priority: Notification['priority'] = 'medium',
    action_url?: string,
    action_label?: string
  ): Promise<Notification | null> {
    return this.createNotification({
      type: 'system',
      title,
      message,
      priority,
      action_required: false,
      action_url,
      action_label
    })
  }

  // Create welcome notification
  static async createWelcomeNotification(): Promise<Notification | null> {
    return this.createSystemNotification(
      'Welcome to FinSight AI!',
      'Get started by adding your first income or expense transaction to begin tracking your finances.',
      'low',
      '/dashboard',
      'Get Started'
    )
  }

  // Create milestone notification
  static async createMilestoneNotification(
    milestone: string,
    message: string,
    priority: Notification['priority'] = 'medium'
  ): Promise<Notification | null> {
    return this.createSystemNotification(
      `Milestone Reached!`,
      `${milestone}: ${message}`,
      priority
    )
  }

  // Get all notifications for a user
  static async getNotifications(limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error: any) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Get unread notifications count
  static async getUnreadCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('is_read', false)

      if (error) throw error
      return count || 0
    } catch (error: any) {
      console.error('Error fetching unread count:', error)
      return 0
    }
  }

  // Get unacknowledged notifications count
  static async getUnacknowledgedCount(): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('is_acknowledged', false)

      if (error) throw error
      return count || 0
    } catch (error: any) {
      console.error('Error fetching unacknowledged count:', error)
      return 0
    }
  }

  // Mark notification as read
  static async markAsRead(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Mark notification as unread
  static async markAsUnread(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error marking notification as unread:', error)
      return false
    }
  }

  // Acknowledge notification
  static async acknowledgeNotification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error acknowledging notification:', error)
      return false
    }
  }

  // Delete notification
  static async deleteNotification(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error deleting notification:', error)
      return false
    }
  }

  // Mark all as read
  static async markAllAsRead(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error marking all as read:', error)
      return false
    }
  }

  // Acknowledge all notifications
  static async acknowledgeAll(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('is_acknowledged', false)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error acknowledging all notifications:', error)
      return false
    }
  }

  // Delete all read notifications
  static async deleteAllRead(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('is_read', true)

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error deleting all read notifications:', error)
      return false
    }
  }

  // Delete old notifications (older than specified days)
  static async deleteOldNotifications(daysOld: number = 30): Promise<boolean> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString())

      if (error) throw error
      return true
    } catch (error: any) {
      console.error('Error deleting old notifications:', error)
      return false
    }
  }

  // Get notification statistics
  static async getNotificationStats(): Promise<{
    total: number
    unread: number
    unacknowledged: number
    byType: Record<string, number>
    byPriority: Record<string, number>
  }> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')

      if (error) throw error

      const notifications = data || []
      
      const stats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        unacknowledged: notifications.filter(n => !n.is_acknowledged).length,
        byType: {} as Record<string, number>,
        byPriority: {} as Record<string, number>
      }

      notifications.forEach(notification => {
        stats.byType[notification.type] = (stats.byType[notification.type] || 0) + 1
        stats.byPriority[notification.priority] = (stats.byPriority[notification.priority] || 0) + 1
      })

      return stats
    } catch (error: any) {
      console.error('Error fetching notification stats:', error)
      return {
        total: 0,
        unread: 0,
        unacknowledged: 0,
        byType: {},
        byPriority: {}
      }
    }
  }

  // Check budget alerts and create notifications
  static async checkBudgetAlerts(): Promise<void> {
    try {
      // Fetch all budgets
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')

      if (budgetsError) throw budgetsError

      // Fetch expenses for current month
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .gte('date', startOfMonth.toISOString())
        .lte('date', endOfMonth.toISOString())

      if (expensesError) throw expensesError

      // Check each budget
      for (const budget of budgets || []) {
        const relatedExpenses = expenses?.filter(expense => expense.category === budget.category) || []
        const spent = relatedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        const utilization = (spent / budget.amount) * 100

        // Create alert if budget is over or near limit
        if (utilization >= 80) {
          const priority = utilization >= 100 ? 'urgent' : utilization >= 90 ? 'high' : 'medium'
          await this.createBudgetAlert(budget.name, spent, budget.amount, utilization, priority)
        }
      }
    } catch (error: any) {
      console.error('Error checking budget alerts:', error)
    }
  }

  // Check savings goals and create notifications
  static async checkSavingsGoals(): Promise<void> {
    try {
      // Fetch all savings goals
      const { data: goals, error } = await supabase
        .from('savings_goals')
        .select('*')

      if (error) throw error

      // Check each goal
      for (const goal of goals || []) {
        const progress = (goal.current_amount / goal.target_amount) * 100
        const isCompleted = progress >= 100

        // Create notification for completed goals or significant milestones
        if (isCompleted && !goal.notification_sent) {
          await this.createSavingsGoalNotification(goal.name, goal.current_amount, goal.target_amount, progress, true)
          
          // Mark notification as sent
          await supabase
            .from('savings_goals')
            .update({ notification_sent: true })
            .eq('id', goal.id)
        } else if (progress >= 50 && progress < 60 && !goal.milestone_50_sent) {
          await this.createSavingsGoalNotification(goal.name, goal.current_amount, goal.target_amount, progress, false)
          
          // Mark milestone as sent
          await supabase
            .from('savings_goals')
            .update({ milestone_50_sent: true })
            .eq('id', goal.id)
        }
      }
    } catch (error: any) {
      console.error('Error checking savings goals:', error)
    }
  }

  // Check recurring transactions and create notifications
  static async checkRecurringTransactions(): Promise<void> {
    try {
      // Fetch all recurring transactions
      const { data: transactions, error } = await supabase
        .from('recurring_transactions')
        .select('*')

      if (error) throw error

      // Check each transaction
      const now = new Date()
      for (const transaction of transactions || []) {
        if (!transaction.is_active) continue

        const nextDate = new Date(transaction.next_date)
        const isOverdue = isBefore(nextDate, now)
        const daysOverdue = differenceInDays(now, nextDate)

        // Create alert for overdue transactions
        if (isOverdue) {
          await this.createRecurringTransactionNotification(
            transaction.name,
            transaction.type,
            transaction.amount,
            transaction.frequency,
            true,
            `Overdue by ${Math.abs(daysOverdue)} days`
          )
        }
      }
    } catch (error: any) {
      console.error('Error checking recurring transactions:', error)
    }
  }

  // Run all notification checks
  static async runAllChecks(): Promise<void> {
    await Promise.all([
      this.checkBudgetAlerts(),
      this.checkSavingsGoals(),
      this.checkRecurringTransactions()
    ])
  }
}

export default NotificationService
