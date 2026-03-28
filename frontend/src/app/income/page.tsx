'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { incomeApi } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, TrendingUp, Calendar, DollarSign, Edit, Trash2, Search, Filter, Download, BarChart3, ArrowUpRight, Wallet, PiggyBank, Target, X, Eye } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

const incomeSources = [
  'Salary',
  'Freelance',
  'Business',
  'Investments',
  'Rentals',
  'Dividends',
  'Side Hustle',
  'Gifts',
  'Refunds',
  'Other'
]

const sourceColors: Record<string, { bg: string, text: string, gradient: string }> = {
  'Salary': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', gradient: 'from-blue-500 to-cyan-500' },
  'Freelance': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-200', gradient: 'from-purple-500 to-pink-500' },
  'Business': { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', gradient: 'from-green-500 to-emerald-500' },
  'Investments': { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', gradient: 'from-yellow-500 to-amber-500' },
  'Rentals': { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-200', gradient: 'from-orange-500 to-red-500' },
  'Dividends': { bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-800 dark:text-indigo-200', gradient: 'from-indigo-500 to-purple-500' },
  'Side Hustle': { bg: 'bg-pink-100 dark:bg-pink-900/30', text: 'text-pink-800 dark:text-pink-200', gradient: 'from-pink-500 to-rose-500' },
  'Gifts': { bg: 'bg-teal-100 dark:bg-teal-900/30', text: 'text-teal-800 dark:text-teal-200', gradient: 'from-teal-500 to-green-500' },
  'Refunds': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' },
  'Other': { bg: 'bg-muted', text: 'text-muted-foreground', gradient: 'from-gray-500 to-slate-500' }
}

interface IncomeData {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at?: string
  category?: string
  currency?: string
  status?: string
  frequency?: string
  tax_deducted?: number | string
  attachment_url?: string
  recurring_id?: string
  updated_at?: string
  user_id?: string
}

export default function IncomePage() {
  const [income, setIncome] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredIncome, setFilteredIncome] = useState<IncomeData[]>([])
  const [selectedSource, setSelectedSource] = useState('all')
  const [editingIncome, setEditingIncome] = useState<IncomeData | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchIncome()
  }, [])

  useEffect(() => {
    let filtered = income.filter(item => 
      item && 
      typeof item.id === 'string' && 
      typeof item.amount === 'number' && 
      typeof item.source === 'string' &&
      typeof item.date === 'string'
    )

    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(item =>
        item.source.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower)) ||
        item.amount.toString().includes(searchTerm)
      )
    }

    if (selectedSource !== 'all') {
      filtered = filtered.filter(item => item.source === selectedSource)
    }

    setFilteredIncome(filtered)
  }, [searchTerm, selectedSource, income])

  const fetchIncome = async () => {
    try {
      // Get current user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      console.log('🔍 Fetching income data for userId:', userId)
      console.log('👤 User data from localStorage:', userData)
      
      if (!userId) {
        console.warn('⚠️ No user ID found - user might not be logged in')
        toast.error('Please log in to view income data')
        setIncome([])
        setLoading(false)
        return
      }
      
      const response = await incomeApi.getAll(userId)
      console.log('📊 API Response:', response)
      
      if (response.data && Array.isArray(response.data)) {
        console.log('📋 Raw income data:', response.data)
        
        // Validate and sanitize income data
        const validIncome = response.data.filter(item => 
          item && 
          typeof item.id === 'string' && 
          (typeof item.amount === 'number' || typeof item.amount === 'string') && 
          typeof item.source === 'string' &&
          typeof item.date === 'string'
        ).map(item => ({
          ...item,
          amount: typeof item.amount === 'string' ? parseFloat(item.amount) : item.amount,
          tax_deducted: item.tax_deducted ? (typeof item.tax_deducted === 'string' ? parseFloat(item.tax_deducted) : item.tax_deducted) : undefined
        }))
        
        console.log('✅ Valid income data:', validIncome)
        setIncome(validIncome)
        
        if (validIncome.length === 0) {
          toast('No income records found. Add your first income!', {
            icon: '💰',
            style: {
              background: '#10b981',
              color: 'white',
            }
          })
        }
      } else {
        console.log('⚠️ No data received from API')
        setIncome([])
      }
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch income data'
      console.error('❌ Error fetching income:', error)
      toast.error(errorMessage)
      setIncome([]) // Set empty array on error to prevent UI crashes
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      await incomeApi.delete(id)
      toast.success('Income deleted successfully')
      fetchIncome() // Refresh the data
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete income'
      toast.error(errorMessage)
      console.error('Error deleting income:', error)
    }
  }

  const handleEdit = (incomeItem: IncomeData) => {
    setEditingIncome(incomeItem)
    setShowEditModal(true)
  }

  const handleUpdateIncome = async (data: any) => {
    if (!editingIncome) return

    try {
      const response = await incomeApi.update(editingIncome.id, {
        amount: parseFloat(data.amount),
        source: data.source,
        description: data.description || undefined,
        date: data.date,
        category: data.category || undefined,
        currency: data.currency || undefined,
        status: data.status || undefined,
        frequency: data.frequency || undefined,
        tax_deducted: data.tax_deducted ? parseFloat(data.tax_deducted) : undefined
      })

      if (response.data) {
        toast.success('Income updated successfully!')
        setShowEditModal(false)
        setEditingIncome(null)
        fetchIncome() // Refresh the data
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update income')
      console.error('Error updating income:', error)
    }
  }

  const handleCloseEditModal = () => {
    setShowEditModal(false)
    setEditingIncome(null)
  }

  const handleAddIncome = async (data: any) => {
    try {
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      if (!userId) {
        toast.error('Please log in to add income')
        return
      }
      
      const response = await incomeApi.create({
        user_id: userId,
        amount: parseFloat(data.amount),
        source: data.source,
        description: data.description || undefined,
        date: data.date,
        category: data.category || undefined,
        currency: data.currency || 'USD',
        status: data.status || 'confirmed',
        frequency: data.frequency || undefined,
        tax_deducted: data.tax_deducted ? parseFloat(data.tax_deducted) : undefined
      })

      if (response.data) {
        toast.success('Income added successfully!')
        setShowAddModal(false)
        fetchIncome() // Refresh the data
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to add income')
      console.error('Error adding income:', error)
    }
  }

  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0)
  const sourceTotals = filteredIncome.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)
  const averageIncome = filteredIncome.length > 0 ? totalIncome / filteredIncome.length : 0
  
  // Calculate additional dynamic metrics
  const highestIncome = filteredIncome.length > 0 ? Math.max(...filteredIncome.map(item => item.amount)) : 0
  const lowestIncome = filteredIncome.length > 0 ? Math.min(...filteredIncome.map(item => item.amount)) : 0
  const monthlyIncome = filteredIncome.reduce((acc, item) => {
    const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    acc[month] = (acc[month] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)
  
  // Calculate growth trend (compare last month with previous month)
  const sortedByDate = [...filteredIncome].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  const currentDate = new Date()
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  const lastMonthIncome = sortedByDate
    .filter(item => {
      const itemDate = new Date(item.date)
      return itemDate.getMonth() === currentMonth && itemDate.getFullYear() === currentYear
    })
    .reduce((sum, item) => sum + item.amount, 0)
  
  const previousMonthIncome = sortedByDate
    .filter(item => {
      const itemDate = new Date(item.date)
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear
      return itemDate.getMonth() === prevMonth && itemDate.getFullYear() === prevYear
    })
    .reduce((sum, item) => sum + item.amount, 0)
  
  const growthRate = previousMonthIncome > 0 ? ((lastMonthIncome - previousMonthIncome) / previousMonthIncome) * 100 : 0
  
  // Safe calculations to prevent division by zero
  const topSourceData = Object.keys(sourceTotals).length > 0 
    ? Object.entries(sourceTotals).sort(([, a], [, b]) => b - a)[0]
    : null
  const topSourcePercentage = topSourceData && totalIncome > 0 
    ? ((topSourceData[1] / totalIncome) * 100).toFixed(1)
    : '0'

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground font-medium">Loading income data...</p>
        </div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background to-accent/20">
      {/* Modern Header */}
      <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  Income Management
                </h1>
                <p className="text-sm text-muted-foreground">Track and manage your income sources</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-border hover:bg-accent">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Income
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Enhanced Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-card/80 backdrop-blur-sm border-2 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">
                ${totalIncome.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {filteredIncome.length} sources
              </p>
              <div className="mt-3 flex items-center text-sm">
                {growthRate >= 0 ? (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">{growthRate.toFixed(1)}% from last month</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 text-red-500 mr-1 rotate-180" />
                    <span className="text-red-500">{Math.abs(growthRate).toFixed(1)}% from last month</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Income</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                ${averageIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Per transaction
              </p>
              <div className="mt-3 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Highest:</span>
                  <span className="font-medium text-green-600">${highestIncome.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Lowest:</span>
                  <span className="font-medium text-red-600">${lowestIncome.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Top Source</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {topSourceData ? topSourceData[0] : 'None'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest income source
              </p>
              {topSourceData && (
                <div className="mt-3">
                  <div className="text-sm font-medium text-purple-600">
                    ${topSourceData[1].toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {topSourcePercentage}% of total
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm border border-border/50 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search income by source, description, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Filter by source:</span>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedSource('all')}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                selectedSource === 'all'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                  : 'bg-muted text-foreground hover:bg-accent'
              )}
            >
              All Sources
            </button>
            {incomeSources.map((source) => (
              <button
                key={source}
                onClick={() => setSelectedSource(source)}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200",
                  selectedSource === source
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg'
                    : 'bg-muted text-foreground hover:bg-accent'
                )}
              >
                {source}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Income List */}
        <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-foreground">Income Records</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <BarChart3 className="h-4 w-4" />
              <span>{filteredIncome.length} transactions</span>
            </div>
          </CardHeader>
          <CardContent>
            {filteredIncome.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center">
                    <DollarSign className="h-10 w-10 text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">No income records</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  {searchTerm || selectedSource !== 'all' 
                    ? 'No income found matching your filters. Try adjusting your search or filter criteria.' 
                    : 'Start by adding your first income record to begin tracking your earnings.'
                  }
                </p>
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Income
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredIncome.map((item: IncomeData) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors duration-150 cursor-pointer" onClick={() => router.push(`/income/${item.id}`)}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                          {item.date ? format(new Date(item.date), 'MMM dd, yyyy') : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sourceColors[item.source]?.bg || 'bg-muted'} ${sourceColors[item.source]?.text || 'text-foreground'}`}>
                            {item.source || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {item.category || 'General'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">
                          {item.description ? item.description : <span className="text-muted-foreground italic">No description</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold text-green-600">
                              {item.currency || '$'}{typeof item.amount === 'number' ? item.amount.toLocaleString() : '0'}
                            </span>
                            {item.tax_deducted && (
                              <span className="text-xs text-red-500">
                                Tax: {item.currency || '$'}{typeof item.tax_deducted === 'number' ? item.tax_deducted.toLocaleString() : '0'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            item.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            item.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            item.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/income/${item.id}`)
                              }}
                              className="border-blue-500 hover:bg-blue-50 text-blue-600"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {item.attachment_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(item.attachment_url, '_blank')
                                }}
                                className="border-blue-500 hover:bg-blue-50 text-blue-600"
                              >
                                📎
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(item)
                              }}
                              className="border-border hover:bg-accent text-foreground"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(item.id)
                              }}
                              className="border-destructive hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Add Income Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Add New Income</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <AddIncomeForm
                onSubmit={handleAddIncome}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Modal */}
      {showEditModal && editingIncome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Edit Income</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseEditModal}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <EditIncomeForm
                income={editingIncome}
                onSubmit={handleUpdateIncome}
                onCancel={handleCloseEditModal}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    </AppLayout>
  )
}

// Add Income Form Component
function AddIncomeForm({ onSubmit, onCancel }: { onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    amount: '',
    source: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    category: '',
    currency: 'USD',
    status: 'confirmed',
    frequency: '',
    tax_deducted: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Amount *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Source *</label>
          <select
            required
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="">Select source</option>
            {incomeSources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            placeholder="e.g., Job, Business"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="RUPEE">RUPEE (₹)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tax Deducted</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              value={formData.tax_deducted}
              onChange={(e) => handleChange('tax_deducted', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
          placeholder="Add any additional notes..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border hover:bg-accent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105"
        >
          {isSubmitting ? 'Adding...' : 'Add Income'}
        </Button>
      </div>
    </form>
  )
}

// Edit Income Form Component
function EditIncomeForm({ income, onSubmit, onCancel }: { income: IncomeData; onSubmit: (data: any) => void; onCancel: () => void }) {
  const [formData, setFormData] = useState({
    amount: income.amount.toString(),
    source: income.source,
    description: income.description || '',
    date: income.date ? income.date.split('T')[0] : '',
    category: income.category || '',
    currency: income.currency || 'USD',
    status: income.status || 'confirmed',
    frequency: income.frequency || '',
    tax_deducted: income.tax_deducted ? income.tax_deducted.toString() : ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Amount *</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              required
              value={formData.amount}
              onChange={(e) => handleChange('amount', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Source *</label>
          <select
            required
            value={formData.source}
            onChange={(e) => handleChange('source', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="">Select source</option>
            {incomeSources.map((source) => (
              <option key={source} value={source}>{source}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Category</label>
          <input
            type="text"
            value={formData.category}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
            placeholder="e.g., Job, Business"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => handleChange('currency', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="RUPEE">RUPEE (₹)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
          <select
            value={formData.frequency}
            onChange={(e) => handleChange('frequency', e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
          >
            <option value="">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Tax Deducted</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="number"
              step="0.01"
              value={formData.tax_deducted}
              onChange={(e) => handleChange('tax_deducted', e.target.value)}
              className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
          placeholder="Add any additional notes..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="border-border hover:bg-accent"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isSubmitting ? 'Updating...' : 'Update Income'}
        </Button>
      </div>
    </form>
  )
}
