'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingUp, TrendingDown, DollarSign, PiggyBank, Menu, Bell, User, Settings, LogOut, CreditCard, Target, Activity } from 'lucide-react'
import SummaryCards from './SummaryCards'
import ExpenseChart from './ExpenseChart'
import RecentTransactions from './RecentTransactions'
import BudgetAlerts from '../budgets/BudgetAlerts'
import AIPredictions from './AIPredictions'
import { cn } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  const navigation = [
    { name: 'Overview', icon: Activity, id: 'overview' },
    { name: 'Transactions', icon: CreditCard, id: 'transactions' },
    { name: 'Budgets', icon: Target, id: 'budgets' },
    { name: 'Goals', icon: PiggyBank, id: 'goals' },
    { name: 'Analytics', icon: TrendingUp, id: 'analytics' },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading FinSight AI...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-3 sm:py-4">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                  <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FinSight AI
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">
                    Welcome back, {user?.user_metadata?.name || user?.email}
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    FinSight AI
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <Button variant="outline" size="sm" className="relative border-gray-300 hover:bg-gray-50">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              </Button>
              <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50 hidden sm:flex">
                <Settings className="h-4 w-4" />
              </Button>
              <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
                <User className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                  {user?.user_metadata?.name || user?.email?.split('@')[0]}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Responsive Sidebar */}
        <aside className={cn(
          "fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white/80 backdrop-blur-lg shadow-xl transform transition-transform duration-300 ease-in-out mt-14 lg:mt-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}>
          <nav className="p-4 space-y-2 mt-16 lg:mt-4">
            {navigation.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-all duration-200 text-sm sm:text-base",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg transform scale-105"
                    : "text-gray-700 hover:bg-gray-100 hover:shadow-md"
                )}
              >
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Quick Actions Bar */}
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Financial Overview</h2>
                <p className="text-sm text-gray-600 mt-1 hidden sm:block">Track your financial health in real-time</p>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transform transition-all duration-200 hover:scale-105 text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Transaction
                </Button>
                <Button variant="outline" className="border-gray-300 hover:bg-gray-50 text-sm">
                  <Target className="h-4 w-4 mr-2" />
                  Set Goal
                </Button>
              </div>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <SummaryCards />
          </div>

          {/* Charts and Predictions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <ExpenseChart />
            <AIPredictions />
          </div>

          {/* Recent Transactions and Budget Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <RecentTransactions />
            <BudgetAlerts />
          </div>
        </main>
      </div>
    </div>
  )
}
