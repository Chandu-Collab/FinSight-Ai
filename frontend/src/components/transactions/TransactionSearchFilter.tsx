'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Search, Filter, X, Calendar, IndianRupee, Tag, ChevronDown, ChevronUp } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, addMonths, isWithinInterval } from 'date-fns'

interface Transaction {
  id: string
  type: 'income' | 'expense'
  amount: number
  source?: string
  category?: string
  description: string
  date: string
  created_at: string
}

interface FilterState {
  searchTerm: string
  dateRange: 'all' | 'thisMonth' | 'lastMonth' | 'last3Months' | 'last6Months' | 'lastYear' | 'custom'
  customStartDate: string
  customEndDate: string
  amountRange: 'all' | 'under100' | '100to500' | '500to1000' | '1000to5000' | 'over5000'
  minAmount: string
  maxAmount: string
  categories: string[]
  sources: string[]
  type: 'all' | 'income' | 'expense'
  sortBy: 'date' | 'amount' | 'description'
  sortOrder: 'asc' | 'desc'
}

interface TransactionSearchFilterProps {
  transactions: Transaction[]
  onFilteredTransactions: (filtered: Transaction[]) => void
  onFilterChange?: (filters: FilterState) => void
}

const incomeSources = [
  'Salary',
  'Freelance',
  'Investment',
  'Business',
  'Rental Income',
  'Side Hustle',
  'Gift',
  'Other'
]

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

export default function TransactionSearchFilter({ 
  transactions, 
  onFilteredTransactions, 
  onFilterChange 
}: TransactionSearchFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: '',
    dateRange: 'all',
    customStartDate: '',
    customEndDate: '',
    amountRange: 'all',
    minAmount: '',
    maxAmount: '',
    categories: [],
    sources: [],
    type: 'all',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const [showAdvanced, setShowAdvanced] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    applyFilters()
  }, [filters, transactions])

  useEffect(() => {
    // Count active filters
    let count = 0
    if (filters.searchTerm) count++
    if (filters.dateRange !== 'all') count++
    if (filters.amountRange !== 'all') count++
    if (filters.categories.length > 0) count++
    if (filters.sources.length > 0) count++
    if (filters.type !== 'all') count++
    setActiveFiltersCount(count)
  }, [filters])

  const applyFilters = () => {
    let filtered = [...transactions]

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(transaction =>
        transaction.description.toLowerCase().includes(searchLower) ||
        (transaction.source && transaction.source.toLowerCase().includes(searchLower)) ||
        (transaction.category && transaction.category.toLowerCase().includes(searchLower)) ||
        transaction.amount.toString().includes(searchLower)
      )
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date()
      let startDate: Date
      let endDate: Date

      switch (filters.dateRange) {
        case 'thisMonth':
          startDate = startOfMonth(now)
          endDate = endOfMonth(now)
          break
        case 'lastMonth':
          startDate = startOfMonth(subMonths(now, 1))
          endDate = endOfMonth(subMonths(now, 1))
          break
        case 'last3Months':
          startDate = startOfMonth(subMonths(now, 3))
          endDate = endOfMonth(now)
          break
        case 'last6Months':
          startDate = startOfMonth(subMonths(now, 6))
          endDate = endOfMonth(now)
          break
        case 'lastYear':
          startDate = startOfMonth(subMonths(now, 12))
          endDate = endOfMonth(now)
          break
        case 'custom':
          if (filters.customStartDate && filters.customEndDate) {
            startDate = new Date(filters.customStartDate)
            endDate = new Date(filters.customEndDate)
          } else {
            startDate = new Date(0)
            endDate = now
          }
          break
        default:
          startDate = new Date(0)
          endDate = now
      }

      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        return isWithinInterval(transactionDate, { start: startDate, end: endDate })
      })
    }

    // Amount range filter
    if (filters.amountRange !== 'all') {
      filtered = filtered.filter(transaction => {
        switch (filters.amountRange) {
          case 'under100':
            return transaction.amount < 100
          case '100to500':
            return transaction.amount >= 100 && transaction.amount < 500
          case '500to1000':
            return transaction.amount >= 500 && transaction.amount < 1000
          case '1000to5000':
            return transaction.amount >= 1000 && transaction.amount < 5000
          case 'over5000':
            return transaction.amount >= 5000
          default:
            return true
        }
      })
    }

    // Custom amount range
    if (filters.minAmount || filters.maxAmount) {
      filtered = filtered.filter(transaction => {
        if (filters.minAmount && transaction.amount < parseFloat(filters.minAmount)) {
          return false
        }
        if (filters.maxAmount && transaction.amount > parseFloat(filters.maxAmount)) {
          return false
        }
        return true
      })
    }

    // Categories filter
    if (filters.categories.length > 0) {
      filtered = filtered.filter(transaction =>
        transaction.category && filters.categories.includes(transaction.category)
      )
    }

    // Sources filter
    if (filters.sources.length > 0) {
      filtered = filtered.filter(transaction =>
        transaction.source && filters.sources.includes(transaction.source)
      )
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filters.type)
    }

    // Sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'description':
          comparison = a.description.localeCompare(b.description)
          break
      }

      return filters.sortOrder === 'asc' ? comparison : -comparison
    })

    onFilteredTransactions(filtered)
    onFilterChange?.(filters)
  }

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      dateRange: 'all',
      customStartDate: '',
      customEndDate: '',
      amountRange: 'all',
      minAmount: '',
      maxAmount: '',
      categories: [],
      sources: [],
      type: 'all',
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const toggleSource = (source: string) => {
    setFilters(prev => ({
      ...prev,
      sources: prev.sources.includes(source)
        ? prev.sources.filter(s => s !== source)
        : [...prev.sources, source]
    }))
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            Search & Filter
            {activeFiltersCount > 0 && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {activeFiltersCount} active
              </span>
            )}
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center space-x-1"
            >
              <Filter className="h-4 w-4" />
              <span>Advanced</span>
              {showAdvanced ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="flex items-center space-x-1"
              >
                <X className="h-4 w-4" />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <input
            type="text"
            placeholder="Search by description, category, source, or amount..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
          />
        </div>

        {/* Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Transaction Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expenses Only</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
            >
              <option value="all">All Time</option>
              <option value="thisMonth">This Month</option>
              <option value="lastMonth">Last Month</option>
              <option value="last3Months">Last 3 Months</option>
              <option value="last6Months">Last 6 Months</option>
              <option value="lastYear">Last Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {/* Amount Range Filter */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Amount Range</label>
            <select
              value={filters.amountRange}
              onChange={(e) => handleFilterChange('amountRange', e.target.value)}
              className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
            >
              <option value="all">All Amounts</option>
              <option value="under100">Under ₹100</option>
              <option value="100to500">₹100 - ₹500</option>
              <option value="500to1000">₹500 - ₹1,000</option>
              <option value="1000to5000">₹1,000 - ₹5,000</option>
              <option value="over5000">Over ₹5,000</option>
            </select>
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="space-y-4 border-t pt-4">
            {/* Custom Date Range */}
            {filters.dateRange === 'custom' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Start Date</label>
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">End Date</label>
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                    className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Custom Amount Range */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Min Amount</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Max Amount</label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-muted-foreground sm:text-sm">₹</span>
                  </div>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="block w-full pl-8 pr-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Categories Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Categories</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
                {expenseCategories.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      filters.categories.includes(category)
                        ? 'bg-blue-100 text-blue-800 border border-blue-300'
                        : 'bg-muted hover:bg-accent text-foreground'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Sources Filter */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Sources</label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {incomeSources.map((source) => (
                  <button
                    key={source}
                    type="button"
                    onClick={() => toggleSource(source)}
                    className={`px-3 py-2 text-xs rounded-lg transition-colors ${
                      filters.sources.includes(source)
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-muted hover:bg-accent text-foreground'
                    }`}
                  >
                    {source}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                  className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                >
                  <option value="date">Date</option>
                  <option value="amount">Amount</option>
                  <option value="description">Description</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sort Order</label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                  className="block w-full px-3 py-2 border border-input rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}





