'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Filter,
  Settings,
  Eye,
  Share2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

interface ReportOptions {
  type: 'financial-summary' | 'income-expense' | 'budget-analysis' | 'savings-progress' | 'recurring-transactions' | 'predictions-report' | 'custom-insights'
  dateRange: 'current-month' | 'last-3-months' | 'last-6-months' | 'last-year' | 'custom' | 'last-12-months'
  customStart?: string
  customEnd?: string
  includeCharts: boolean
  includeDetails: boolean
  includePredictions?: boolean
  categories?: string[]
  emailReport?: boolean
}

interface ReportData {
  income?: any[]
  expenses?: any[]
  budgets?: any[]
  savingsGoals?: any[]
  predictions?: any[]
  recurringTransactions?: any[]
  dateRange: {
    start: string
    end: string
  }
}

export default function EnhancedReportGenerator() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [reportOptions, setReportOptions] = useState<ReportOptions>({
    type: 'financial-summary',
    dateRange: 'last-6-months',
    includeCharts: true,
    includeDetails: true,
    includePredictions: false,
    categories: [],
    emailReport: false
  })

  const [customDateRange, setCustomDateRange] = useState({
    start: '',
    end: ''
  })

  const reportTypes = [
    { value: 'financial-summary', label: 'Financial Summary', icon: DollarSign, description: 'Complete overview of income, expenses, and net worth' },
    { value: 'income-expense', label: 'Income & Expenses', icon: BarChart3, description: 'Detailed breakdown of all income and expense transactions' },
    { value: 'budget-analysis', label: 'Budget Analysis', icon: PieChart, description: 'Budget vs actual spending analysis' },
    { value: 'savings-progress', label: 'Savings Progress', icon: TrendingUp, description: 'Progress towards all savings goals' },
    { value: 'recurring-transactions', label: 'Recurring Transactions', icon: Calendar, description: 'Overview of all recurring income and expenses' },
    { value: 'predictions-report', label: 'Predictions Report', icon: Settings, description: 'ML predictions and forecasting insights' },
    { value: 'custom-insights', label: 'Custom Insights', icon: Eye, description: 'Custom analysis with AI-powered insights' }
  ]

  const dateRangeOptions = [
    { value: 'current-month', label: 'Current Month' },
    { value: 'last-3-months', label: 'Last 3 Months' },
    { value: 'last-6-months', label: 'Last 6 Months' },
    { value: 'last-12-months', label: 'Last 12 Months' },
    { value: 'last-year', label: 'Last Year' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [categoriesLoading, setCategoriesLoading] = useState(false)

  // Fetch available categories from API
  const fetchCategories = async () => {
    setCategoriesLoading(true)
    try {
      const response = await fetch('/api/categories', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setAvailableCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to empty array if API fails
      setAvailableCategories([])
    } finally {
      setCategoriesLoading(false)
    }
  }

  // Fetch categories on component mount
  useEffect(() => {
    fetchCategories()
  }, [])

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    
    try {
      // Prepare report data
      const reportData: ReportData = {
        dateRange: reportOptions.dateRange === 'custom' 
          ? { start: customDateRange.start, end: customDateRange.end }
          : { start: '', end: '' } // Will be calculated by backend
      }

      console.log('📊 Generating report with options:', reportOptions)
      console.log('📊 Report data:', reportData)

      // Call backend API to generate report
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify({
          ...reportOptions,
          ...reportData
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate report')
      }

      const result = await response.json()
      
      toast.success('Report generated successfully!')

    } catch (error) {
      console.error('❌ Error generating report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEmailReport = async () => {
    if (!reportOptions.emailReport) {
      toast.error('Please enable email option to send report')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('jwt_token')}`,
        },
        body: JSON.stringify({
          ...reportOptions,
          dateRange: reportOptions.dateRange === 'custom' 
            ? { start: customDateRange.start, end: customDateRange.end }
            : { start: '', end: '' }
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to email report')
      }

      toast.success('Report emailed successfully!')
      
    } catch (error) {
      console.error('❌ Error emailing report:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to email report')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleCategory = (category: string) => {
    setReportOptions(prev => ({
      ...prev,
      categories: prev.categories?.includes(category) 
        ? prev.categories.filter(c => c !== category)
        : [...(prev.categories || []), category]
    }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            Enhanced Report Generator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Report Type Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2">Report Type</label>
              <Select value={reportOptions.type} onValueChange={(value) => setReportOptions(prev => ({ ...prev, type: value as ReportOptions['type'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center space-x-2">
                        <type.icon className="h-4 w-4" />
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2">Date Range</label>
              <Select value={reportOptions.dateRange} onValueChange={(value) => setReportOptions(prev => ({ ...prev, dateRange: value as ReportOptions['dateRange'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRangeOptions.map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {reportOptions.dateRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2">Start Date</label>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2">End Date</label>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                />
              </div>
            </div>
          )}

          {/* Category Filter for Expense Reports */}
          {(reportOptions.type === 'income-expense' || reportOptions.type === 'budget-analysis') && (
            <div>
              <label className="text-sm font-medium mb-2">Filter Categories (Optional)</label>
              <div className="flex flex-wrap gap-2">
                {categoriesLoading ? (
                  <div className="text-sm text-muted-foreground">Loading categories...</div>
                ) : availableCategories.length > 0 ? (
                  availableCategories.map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        checked={reportOptions.categories?.includes(category) || false}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <label className="text-sm">{category}</label>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground">No categories available</div>
                )}
              </div>
              {reportOptions.categories && reportOptions.categories.length > 0 && (
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportOptions(prev => ({ ...prev, categories: [] }))}
                  >
                    Clear All Categories
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Include Options */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={reportOptions.includeCharts}
                  onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, includeCharts: checked === true }))}
                />
                <label className="text-sm">Include Charts</label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={reportOptions.includeDetails}
                  onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, includeDetails: checked === true }))}
                />
                <label className="text-sm">Include Detailed Breakdown</label>
              </div>

              {reportOptions.type === 'financial-summary' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={reportOptions.includePredictions}
                    onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, includePredictions: checked === true }))}
                  />
                  <label className="text-sm">Include ML Predictions</label>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={reportOptions.emailReport}
                  onCheckedChange={(checked) => setReportOptions(prev => ({ ...prev, emailReport: checked === true }))}
                />
                <label className="text-sm">Email Report</label>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleGenerateReport}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent border-r-transparent mr-2"></div>
                  Generating Report...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>

            {reportOptions.emailReport && (
              <Button
                onClick={handleEmailReport}
                disabled={isGenerating}
                variant="outline"
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary border-t-transparent border-r-transparent mr-2"></div>
                    Emailing Report...
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Email Report
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Report Preview */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Report Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium">Selected Options:</h4>
                <div className="space-y-1">
                  <div><strong>Type:</strong> {reportTypes.find(t => t.value === reportOptions.type)?.label}</div>
                  <div><strong>Date Range:</strong> {dateRangeOptions.find(d => d.value === reportOptions.dateRange)?.label}</div>
                  {reportOptions.categories && reportOptions.categories.length > 0 && (
                    <div><strong>Categories:</strong> {reportOptions.categories.join(', ')}</div>
                  )}
                  <div><strong>Include Charts:</strong> {reportOptions.includeCharts ? 'Yes' : 'No'}</div>
                  <div><strong>Include Details:</strong> {reportOptions.includeDetails ? 'Yes' : 'No'}</div>
                  {reportOptions.includePredictions && (
                    <div><strong>Include Predictions:</strong> {reportOptions.includePredictions ? 'Yes' : 'No'}</div>
                  )}
                  <div><strong>Email Report:</strong> {reportOptions.emailReport ? 'Yes' : 'No'}</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Features Available:</h4>
                <div className="space-y-1">
                  <div>✅ <strong>Multiple Report Types:</strong> Financial Summary, Income & Expenses, Budget Analysis, Savings Progress</div>
                  <div>✅ <strong>Flexible Date Ranges:</strong> Current month, last 3/6/12 months, last year, custom range</div>
                  <div>✅ <strong>Category Filtering:</strong> Filter expense reports by specific categories</div>
                  <div>✅ <strong>Chart Integration:</strong> Include visual charts and graphs in reports</div>
                  <div>✅ <strong>ML Predictions:</strong> Include AI-powered predictions and forecasting</div>
                  <div>✅ <strong>Email Delivery:</strong> Send reports directly to email</div>
                  <div>✅ <strong>Custom Insights:</strong> AI-powered analysis with custom parameters</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
