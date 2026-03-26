'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, TrendingUp, TrendingDown, Target, Bell, BellOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface BudgetAlert {
  id: string
  budget_id: string
  budget_name: string
  category: string
  percentage: number
  amount_spent: number
  budget_amount: number
  remaining: number
  status: 'warning' | 'danger' | 'exceeded'
  created_at: string
  acknowledged: boolean
}

export default function BudgetAlerts() {
  const [alerts, setAlerts] = useState<BudgetAlert[]>([])
  const [loading, setLoading] = useState(true)
  const [acknowledging, setAcknowledging] = useState<string | null>(null)

  useEffect(() => {
    fetchAlerts()
    
    // Set up real-time subscription for budget updates
    const subscription = supabase
      .channel('budget-alerts')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'budgets' 
        }, 
        () => {
          fetchAlerts()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchAlerts = async () => {
    try {
      const { data: budgets, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .gte('month', new Date().toISOString().slice(0, 7))
        .lte('month', new Date().toISOString().slice(0, 7))

      if (budgetsError) throw budgetsError

      const budgetAlerts: BudgetAlert[] = []

      for (const budget of budgets || []) {
        // Calculate actual spending for this budget
        const monthStart = new Date(budget.month)
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

        const { data: expensesData, error: expensesError } = await supabase
          .from('expenses')
          .select('amount')
          .eq('category', budget.category)
          .gte('date', monthStart.toISOString().split('T')[0])
          .lte('date', monthEnd.toISOString().split('T')[0])

        if (expensesError) throw expensesError

        const spent = expensesData?.reduce((sum, expense) => sum + expense.amount, 0) || 0
        const percentage = (spent / budget.amount) * 100
        const remaining = budget.amount - spent

        // Check if alert should be triggered
        if (percentage >= budget.alert_threshold) {
          let status: 'warning' | 'danger' | 'exceeded'
          if (percentage >= 100) status = 'exceeded'
          else if (percentage >= 90) status = 'danger'
          else status = 'warning'

          budgetAlerts.push({
            id: budget.id,
            budget_id: budget.id,
            budget_name: budget.name,
            category: budget.category,
            percentage,
            amount_spent: spent,
            budget_amount: budget.amount,
            remaining,
            status,
            created_at: budget.created_at,
            acknowledged: false
          })
        }
      }

      // Sort by severity (exceeded > danger > warning) and then by percentage
      budgetAlerts.sort((a, b) => {
        const severityOrder = { exceeded: 3, danger: 2, warning: 1 }
        const severityDiff = severityOrder[b.status] - severityOrder[a.status]
        if (severityDiff !== 0) return severityDiff
        return b.percentage - a.percentage
      })

      setAlerts(budgetAlerts)
    } catch (error: any) {
      toast.error('Failed to fetch budget alerts')
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    setAcknowledging(alertId)
    
    try {
      // In a real app, you'd save this to a separate alerts table
      // For now, we'll just remove it from the local state
      setAlerts(prev => prev.filter(alert => alert.id !== alertId))
      toast.success('Alert acknowledged')
    } catch (error: any) {
      toast.error('Failed to acknowledge alert')
      console.error('Error acknowledging alert:', error)
    } finally {
      setAcknowledging(null)
    }
  }

  const acknowledgeAll = async () => {
    setAcknowledging('all')
    
    try {
      setAlerts([])
      toast.success('All alerts acknowledged')
    } catch (error: any) {
      toast.error('Failed to acknowledge alerts')
      console.error('Error acknowledging all alerts:', error)
    } finally {
      setAcknowledging(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'warning': return 'bg-yellow-100 border-yellow-300 text-yellow-900 dark:bg-yellow-900 dark:border-yellow-700 dark:text-yellow-100'
      case 'danger': return 'bg-orange-100 border-orange-300 text-orange-900 dark:bg-orange-900 dark:border-orange-700 dark:text-orange-100'
      case 'exceeded': return 'bg-red-100 border-red-300 text-red-900 dark:bg-red-900 dark:border-red-700 dark:text-red-100'
      default: return 'bg-card border-border text-card-foreground'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'warning': return <AlertTriangle className="h-5 w-5" />
      case 'danger': return <TrendingDown className="h-5 w-5" />
      case 'exceeded': return <Target className="h-5 w-5" />
      default: return <Bell className="h-5 w-5" />
    }
  }

  const getStatusMessage = (status: string, percentage: number) => {
    switch (status) {
      case 'warning': return `Budget alert: ${percentage.toFixed(1)}% used`
      case 'danger': return `Critical: ${percentage.toFixed(1)}% of budget spent`
      case 'exceeded': return `Budget exceeded by ${percentage.toFixed(1)}%`
      default: return 'Budget status update'
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BellOff className="h-5 w-5 text-green-600" />
            Budget Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">All budgets on track</h3>
            <p className="mt-2 text-sm text-gray-500">
              Great job! All your budgets are within limits.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            Budget Alerts
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {alerts.length}
            </span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={acknowledgeAll}
            disabled={acknowledging === 'all'}
            className="flex items-center space-x-2"
          >
            {acknowledging === 'all' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent"></div>
                <span>Acknowledging...</span>
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                <span>Acknowledge All</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 ${getStatusColor(alert.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {getStatusIcon(alert.status)}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{alert.budget_name}</h4>
                    <p className="text-sm opacity-75">{alert.category}</p>
                    <p className="text-sm mt-1">{getStatusMessage(alert.status, alert.percentage)}</p>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <span className="opacity-75">Budget:</span>
                        <span className="ml-1 font-medium">${alert.budget_amount.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Spent:</span>
                        <span className="ml-1 font-medium">${alert.amount_spent.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="opacity-75">Remaining:</span>
                        <span className={`ml-1 font-medium ${alert.remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${Math.abs(alert.remaining).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => acknowledgeAlert(alert.id)}
                    disabled={acknowledging === alert.id}
                    className="flex items-center space-x-1"
                  >
                    {acknowledging === alert.id ? (
                      <>
                        <div className="animate-spin rounded-full h-3 w-3 border-2 border-current border-t-transparent"></div>
                        <span>Ack</span>
                      </>
                    ) : (
                      <>
                        <BellOff className="h-3 w-3" />
                        <span>Ack</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-3">
                <div className="w-full bg-white bg-opacity-30 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      alert.status === 'exceeded' ? 'bg-red-500' :
                      alert.status === 'danger' ? 'bg-orange-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Summary Stats */}
        <div className="mt-6 pt-4 border-t border-current border-opacity-20">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium">{alerts.filter(a => a.status === 'warning').length}</div>
              <div className="opacity-75">Warnings</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{alerts.filter(a => a.status === 'danger').length}</div>
              <div className="opacity-75">Critical</div>
            </div>
            <div className="text-center">
              <div className="font-medium">{alerts.filter(a => a.status === 'exceeded').length}</div>
              <div className="opacity-75">Exceeded</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
