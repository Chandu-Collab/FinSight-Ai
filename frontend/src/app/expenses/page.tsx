'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, TrendingDown, Calendar, CreditCard, Edit, Trash2, Search, Filter, Download, BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Wallet } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface Expense {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  created_at: string
}

const expenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Subscriptions',
  'Other'
]

const categoryIcons: Record<string, string> = {
  'Food & Dining': '🍔',
  'Transportation': '🚗',
  'Shopping': '🛍',
  'Entertainment': '🎬',
  'Bills & Utilities': '📄',
  'Healthcare': '🏥',
  'Education': '📚',
  'Travel': '✈️',
  'Subscriptions': '📱',
  'Other': '📌'
}

const categoryColors: Record<string, { bg: string, text: string, gradient: string }> = {
  'Food & Dining': { bg: 'bg-orange-100', text: 'text-orange-800', gradient: 'from-orange-500 to-red-500' },
  'Transportation': { bg: 'bg-blue-100', text: 'text-blue-800', gradient: 'from-blue-500 to-cyan-500' },
  'Shopping': { bg: 'bg-purple-100', text: 'text-purple-800', gradient: 'from-purple-500 to-pink-500' },
  'Entertainment': { bg: 'bg-pink-100', text: 'text-pink-800', gradient: 'from-pink-500 to-rose-500' },
  'Bills & Utilities': { bg: 'bg-red-100', text: 'text-red-800', gradient: 'from-red-500 to-orange-500' },
  'Healthcare': { bg: 'bg-green-100', text: 'text-green-800', gradient: 'from-green-500 to-emerald-500' },
  'Education': { bg: 'bg-indigo-100', text: 'text-indigo-800', gradient: 'from-indigo-500 to-purple-500' },
  'Travel': { bg: 'bg-yellow-100', text: 'text-yellow-800', gradient: 'from-yellow-500 to-amber-500' },
  'Subscriptions': { bg: 'bg-gray-100', text: 'text-gray-800', gradient: 'from-gray-500 to-slate-500' },
  'Other': { bg: 'bg-gray-100', text: 'text-gray-800', gradient: 'from-gray-500 to-slate-500' }
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredExpenses, setFilteredExpenses] = useState<Expense[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const router = useRouter()

  useEffect(() => {
    fetchExpenses()
  }, [])

  useEffect(() => {
    let filtered = expenses

    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.amount.toString().includes(searchTerm)
      )
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(item => item.category === selectedCategory)
    }

    setFilteredExpenses(filtered)
  }, [searchTerm, selectedCategory, expenses])

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })

      if (error) throw error
      setExpenses(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch expense data')
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Expense deleted successfully')
      fetchExpenses()
    } catch (error: any) {
      toast.error('Failed to delete expense')
      console.error('Error deleting expense:', error)
    }
  }

  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0)
  const categoryTotals = filteredExpenses.reduce((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-pink-600 rounded-xl flex items-center justify-center">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                  Expense Management
                </h1>
                <p className="text-sm text-gray-500">Track and manage your expenses</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Link href="/expenses/add">
                <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Expense
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
          <Card className="bg-white/80 backdrop-blur-sm border-2 border-red-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Total Expenses</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">
                ${totalExpenses.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                From {filteredExpenses.length} transactions
              </p>
              <div className="mt-3 flex items-center text-sm">
                <ArrowUpRight className="h-4 w-4 text-red-500 mr-1" />
                <span className="text-red-500">12% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-orange-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Average Expense</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">
                ${filteredExpenses.length > 0 ? (totalExpenses / filteredExpenses.length).toFixed(2) : '0.00'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Per transaction
              </p>
              <div className="mt-3 flex items-center text-sm">
                <ArrowDownRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-500">8% decrease</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">Top Category</CardTitle>
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <PieChart className="h-4 w-4 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-purple-600">
                {Object.keys(categoryTotals).length > 0 
                  ? Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0][0]
                  : 'None'
                }
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Highest spending category
              </p>
              {Object.keys(categoryTotals).length > 0 && (
                <div className="mt-3 text-sm font-medium text-purple-600">
                  ${Object.entries(categoryTotals).sort(([, a], [, b]) => b - a)[0][1].toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Search and Filter */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-200/50 p-4 sm:p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search expenses by description, category, or amount..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setSelectedCategory('all')}
              className={cn(
                "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Categories
            </button>
            {expenseCategories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200",
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                <span className="mr-1">{categoryIcons[category]}</span>
                <span className="hidden sm:inline">{category}</span>
                <span className="sm:hidden">
                  {category.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Expense List */}
        <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg font-semibold text-gray-800">Expense Records</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <BarChart3 className="h-4 w-4" />
              <span>{filteredExpenses.length} transactions</span>
            </div>
          </CardHeader>
          <CardContent>
            {filteredExpenses.length === 0 ? (
              <div className="text-center py-16">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center">
                    <CreditCard className="h-10 w-10 text-red-400" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No expense records</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'No expenses found matching your filters. Try adjusting your search or filter criteria.' 
                    : 'Start by adding your first expense record to begin tracking your finances.'
                  }
                </p>
                <Link href="/expenses/add">
                  <Button className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 shadow-lg transform transition-all duration-200 hover:scale-105">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Expense
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-3 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredExpenses.map((expense: Expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          <div className="flex flex-col">
                            <span className="text-xs sm:text-sm">{format(new Date(expense.date), 'MMM dd, yyyy')}</span>
                            <span className="text-xs text-gray-500 sm:hidden">{format(new Date(expense.date), 'h:mm a')}</span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold ${categoryColors[expense.category]?.bg || 'bg-gray-100'} ${categoryColors[expense.category]?.text || 'text-gray-800'}`}>
                            <span className="mr-1">{categoryIcons[expense.category]}</span>
                            <span className="hidden sm:inline">{expense.category}</span>
                            <span className="sm:hidden">{expense.category.split(' ')[0]}</span>
                          </span>
                        </td>
                        <td className="hidden md:table-cell px-6 py-4 text-sm text-gray-600">
                          <div className="max-w-xs truncate">
                            {expense.description || <span className="text-gray-400 italic">No description</span>}
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col sm:block">
                            <span className="text-lg sm:text-xl font-bold text-red-600">
                              -${expense.amount.toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500 sm:hidden">
                              {expense.category.split(' ')[0]}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                          <div className="flex justify-end space-x-1 sm:space-x-2">
                            <Link href={`/expenses/${expense.id}/edit`}>
                              <Button variant="outline" size="sm" className="border-blue-300 hover:bg-blue-50 text-blue-600 h-8 w-8 sm:h-auto sm:w-auto sm:px-3">
                                <Edit className="h-4 w-4" />
                                <span className="hidden sm:inline ml-1">Edit</span>
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(expense.id)}
                              className="border-red-300 hover:bg-red-50 text-red-600 h-8 w-8 sm:h-auto sm:w-auto sm:px-3"
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Delete</span>
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
  )
}
