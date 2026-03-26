'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { Plus, TrendingUp, Calendar, DollarSign, Edit, Trash2, Search, Filter, Download, BarChart3, ArrowUpRight, Wallet, PiggyBank, Target } from 'lucide-react'
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

interface Income {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at: string
}

export default function IncomePage() {
  const [income, setIncome] = useState<Income[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredIncome, setFilteredIncome] = useState<Income[]>([])
  const [selectedSource, setSelectedSource] = useState('all')
  const router = useRouter()

  useEffect(() => {
    fetchIncome()
  }, [])

  useEffect(() => {
    let filtered = income

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.source.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setIncome(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch income data')
      console.error('Error fetching income:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Income deleted successfully')
      fetchIncome()
    } catch (error: any) {
      toast.error('Failed to delete income')
      console.error('Error deleting income:', error)
    }
  }

  const totalIncome = filteredIncome.reduce((sum, item) => sum + item.amount, 0)
  const sourceTotals = filteredIncome.reduce((acc, item) => {
    acc[item.source] = (acc[item.source] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)
  const averageIncome = filteredIncome.length > 0 ? totalIncome / filteredIncome.length : 0

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
              <Link href="/income/add">
                <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Income
                </Button>
              </Link>
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
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">Growing strong!</span>
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
              <div className="mt-3 w-full bg-muted rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{ width: '75%' }} />
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
                {Object.keys(sourceTotals).length > 0 
                  ? Object.entries(sourceTotals).sort(([, a], [, b]) => b - a)[0][0]
                  : 'None'
                }
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Highest income source
              </p>
              {Object.keys(sourceTotals).length > 0 && (
                <div className="mt-3 text-sm font-medium text-purple-600">
                  ${Object.entries(sourceTotals).sort(([, a], [, b]) => b - a)[0][1].toLocaleString()}
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
                <Link href="/income/add">
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Income
                  </Button>
                </Link>
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
                        Description
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredIncome.map((item: Income) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors duration-150">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                          {format(new Date(item.date), 'MMM dd, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${sourceColors[item.source]?.bg || 'bg-muted'} ${sourceColors[item.source]?.text || 'text-foreground'}`}>
                            {item.source}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.description || <span className="text-muted-foreground italic">No description</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-lg font-bold text-green-600">
                            +${item.amount.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/income/${item.id}/edit`}>
                              <Button variant="outline" size="sm" className="border-border hover:bg-accent text-foreground">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(item.id)}
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
    </div>
    </AppLayout>
  )
}
