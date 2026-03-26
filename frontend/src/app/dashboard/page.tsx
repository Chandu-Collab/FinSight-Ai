'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { dashboardApi, mlApi } from '@/lib/api/production'
import toast from 'react-hot-toast'

export default function DashboardPage() {
  const { user, token, isAuthenticated, logout } = useAuth()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const data = await dashboardApi.getSummary()
      setDashboardData(data)
      console.log('✅ Dashboard data loaded:', data)
    } catch (error: any) {
      console.error('❌ Failed to load dashboard:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const testProtectedAPI = async () => {
    try {
      const result = await mlApi.health()
      console.log('✅ Protected API call successful:', result)
      toast.success('API call successful!')
    } catch (error: any) {
      console.error('❌ Protected API call failed:', error)
      toast.error('API call failed')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please login to access the dashboard</p>
          <a href="/auth/login" className="text-blue-600 hover:text-blue-500">
            Go to Login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={testProtectedAPI}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Test API
              </button>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading dashboard...</p>
          </div>
        ) : dashboardData ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
              <p className="mt-2 text-3xl font-bold text-green-600">
                ${dashboardData.total_income || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
              <p className="mt-2 text-3xl font-bold text-red-600">
                ${dashboardData.total_expenses || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Net Income</h3>
              <p className="mt-2 text-3xl font-bold text-blue-600">
                ${dashboardData.net_income || 0}
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-sm font-medium text-gray-500">Savings</h3>
              <p className="mt-2 text-3xl font-bold text-purple-600">
                ${dashboardData.total_savings || 0}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No dashboard data available</p>
          </div>
        )}

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Authentication Debug Info</h2>
          <div className="space-y-2 text-sm">
            <p><strong>User:</strong> {JSON.stringify(user, null, 2)}</p>
            <p><strong>Token Present:</strong> {token ? 'Yes' : 'No'}</p>
            <p><strong>Token Preview:</strong> {token ? token.substring(0, 50) + '...' : 'N/A'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
