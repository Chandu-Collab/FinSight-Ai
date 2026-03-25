'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, DollarSign, Target, Bell, Plus, ChevronRight, Calendar, PiggyBank, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'

interface MobileDashboardProps {
  user?: any
}

interface DashboardData {
  totalIncome: number
  totalExpenses: number
  netIncome: number
  budgets: any[]
  savingsGoals: any[]
  recentTransactions: any[]
  upcomingBills: any[]
  budgetAlerts: any[]
}

export default function MobileDashboard({ user }: MobileDashboardProps) {
  const [data, setData] = useState<DashboardData>({
    totalIncome: 0,
    totalExpenses: 0,
    netIncome: 0,
    budgets: [],
    savingsGoals: [],
    recentTransactions: [],
    upcomingBills: [],
    budgetAlerts: []
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      // Fetch current month income and expenses
      const [incomeData, expensesData, budgetsData, savingsData, transactionsData] = await Promise.all([
        supabase
          .from('income')
          .select('*')
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString()),
        supabase
          .from('expenses')
          .select('*')
          .gte('date', monthStart.toISOString())
          .lte('date', monthEnd.toISOString()),
        supabase
          .from('budgets')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('savings_goals')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('recurring_transactions')
          .select('*')
          .eq('is_active', true)
          .order('next_date', { ascending: true })
      ])

      const totalIncome = incomeData.data?.reduce((sum, item) => sum + item.amount, 0) || 0
      const totalExpenses = expensesData.data?.reduce((sum, item) => sum + item.amount, 0) || 0

      // Calculate budget alerts
      const budgetAlerts = budgetsData.data?.map(budget => {
        const relatedExpenses = expensesData.data?.filter(expense => expense.category === budget.category) || []
        const spent = relatedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
        const utilization = (spent / budget.amount) * 100
        return {
          ...budget,
          spent,
          utilization,
          isOverBudget: utilization > 100,
          isNearLimit: utilization > 80
        }
      }).filter(budget => budget.isOverBudget || budget.isNearLimit) || []

      // Get upcoming bills (next 7 days)
      const upcomingBills = transactionsData.data?.filter(transaction => {
        if (transaction.type !== 'expense') return false
        const nextDate = new Date(transaction.next_date)
        const weekFromNow = new Date()
        weekFromNow.setDate(weekFromNow.getDate() + 7)
        return isWithinInterval(nextDate, { start: new Date(), end: weekFromNow })
      }) || []

      // Get recent transactions (last 5)
      const recentTransactions = [
        ...(incomeData.data?.slice(0, 3) || []),
        ...(expensesData.data?.slice(0, 3) || [])
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)

      setData({
        totalIncome,
        totalExpenses,
        netIncome: totalIncome - totalExpenses,
        budgets: budgetsData.data || [],
        savingsGoals: savingsData.data || [],
        recentTransactions,
        upcomingBills,
        budgetAlerts
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Welcome back{user?.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}!
          </h1>
          <p className="text-sm text-gray-500">
            {format(new Date(), 'EEEE, MMM d')}
          </p>
        </div>
        <div className="flex space-x-2">
          <Link href="/notifications">
            <Button variant="outline" size="sm" className="relative">
              <Bell className="h-4 w-4" />
              {data.budgetAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full"></span>
              )}
            </Button>
          </Link>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-xs text-green-600 font-medium">Income</span>
            </div>
            <div className="text-2xl font-bold text-green-900">
              ${data.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-green-700">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingDown className="h-5 w-5 text-red-600" />
              <span className="text-xs text-red-600 font-medium">Expenses</span>
            </div>
            <div className="text-2xl font-bold text-red-900">
              ${data.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-red-700">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">Net</span>
            </div>
            <div className={`text-2xl font-bold ${data.netIncome >= 0 ? 'text-blue-900' : 'text-red-900'}`}>
              ${Math.abs(data.netIncome).toLocaleString()}
            </div>
            <p className="text-xs text-blue-700">Cash flow</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">Savings</span>
            </div>
            <div className="text-2xl font-bold text-purple-900">
              {data.savingsGoals.length}
            </div>
            <p className="text-xs text-purple-700">Active goals</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/income/add">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </Link>
            <Link href="/expenses/add">
              <Button variant="outline" className="w-full justify-start">
                <Plus className="h-4 w-4 mr-2" />
                Add Expense
              </Button>
            </Link>
            <Link href="/budgets/create">
              <Button variant="outline" className="w-full justify-start">
                <Target className="h-4 w-4 mr-2" />
                Create Budget
              </Button>
            </Link>
            <Link href="/savings/create">
              <Button variant="outline" className="w-full justify-start">
                <PiggyBank className="h-4 w-4 mr-2" />
                Set Goal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Budget Alerts */}
      {data.budgetAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <AlertTriangle className="h-5 w-5 text-orange-600 mr-2" />
              Budget Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.budgetAlerts.slice(0, 2).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{alert.name}</p>
                    <p className="text-xs text-gray-500">
                      ${alert.spent.toLocaleString()} of ${alert.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${alert.isOverBudget ? 'text-red-600' : 'text-orange-600'}`}>
                      {alert.utilization.toFixed(0)}%
                    </p>
                    <Link href="/budgets">
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
              {data.budgetAlerts.length > 2 && (
                <Link href="/budgets">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Alerts ({data.budgetAlerts.length})
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Bills */}
      {data.upcomingBills.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Calendar className="h-5 w-5 text-blue-600 mr-2" />
              Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.upcomingBills.slice(0, 3).map((bill) => (
                <div key={bill.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{bill.name}</p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(bill.next_date), 'MMM d')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">${bill.amount}</p>
                    <p className="text-xs text-gray-500">{bill.frequency}</p>
                  </div>
                </div>
              ))}
              {data.upcomingBills.length > 3 && (
                <Link href="/recurring">
                  <Button variant="outline" size="sm" className="w-full">
                    View All Bills
                  </Button>
                </Link>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Recent Transactions</span>
            <Link href="/transactions">
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </Link>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {data.recentTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    ) : (
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">
                      {transaction.type === 'income' ? transaction.source : transaction.category}
                    </p>
                    <p className="text-xs text-gray-500">
                      {format(new Date(transaction.date), 'MMM d')}
                    </p>
                  </div>
                </div>
                <div className={`font-medium ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  ${transaction.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Savings Goals Progress */}
      {data.savingsGoals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Savings Goals</span>
              <Link href="/savings">
                <Button variant="ghost" size="sm">
                  View All
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.savingsGoals.slice(0, 2).map((goal) => {
                const progress = (goal.current_amount / goal.target_amount) * 100
                return (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-sm">{goal.name}</p>
                      <p className="text-xs text-gray-500">{progress.toFixed(0)}%</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>${goal.current_amount.toLocaleString()}</span>
                      <span>${goal.target_amount.toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
