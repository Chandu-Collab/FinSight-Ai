'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { reportsService } from '@/lib/reports'
import { Report } from '@/types/report'
import { 
  FileText, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  ArrowLeft,
  Eye,
  Trash2,
  Edit,
  Share2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useParams } from 'next/navigation'

export default function ReportDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Get report ID from route parameters
  useEffect(() => {
    const reportId = params.id as string
    
    if (!reportId) {
      setError('Report ID not provided')
      setLoading(false)
      return
    }

    fetchReport(reportId)
  }, [params.id])

  const fetchReport = async (reportId: string) => {
    try {
      setLoading(true)
      setError(null)
      console.log('ðŸ” Fetching report details for ID:', reportId)
      
      const response = await reportsService.getReportById(reportId)
      console.log('ðŸ” Report details response:', response)
      setReport(response.data)
    } catch (error) {
      console.error('âŒ Error fetching report details:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch report details')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadReport = () => {
    if (report?.file_url) {
      // Create download link for PDF
      const link = document.createElement('a')
      link.href = report.file_url
      link.download = `${report.name}.pdf`
      link.target = '_blank' // Open in new tab for better UX
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Report downloaded successfully')
      
      // Also copy the report data to clipboard as JSON
      try {
        const reportData = {
          ...report,
          downloaded_at: new Date().toISOString(),
          download_url: report.file_url
        }
        navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
        toast.success('Report data copied to clipboard')
      } catch (error) {
        console.error('Failed to copy to clipboard:', error)
        toast.error('Failed to copy report data to clipboard')
      }
    } else {
      // If no file URL, try to generate a downloadable report from data
      handleGenerateAndDownload()
    }
  }

  const handleGenerateAndDownload = () => {
    if (!report) return
    
    try {
      // Create a simple text representation of the report
      const reportText = generateReportText(report)
      
      // Create blob and download
      const blob = new Blob([reportText], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${report.name}.txt`
      link.target = '_blank'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast.success('Report text file downloaded successfully')
      
      // Also copy to clipboard
      navigator.clipboard.writeText(reportText)
      toast.success('Report data copied to clipboard')
    } catch (error) {
      console.error('Failed to generate download:', error)
      toast.error('Failed to generate report file')
    }
  }

  const generateReportText = (report: Report): string => {
    const lines = [
      `=====================================`,
      `           ${report.name}`,
      `=====================================`,
      ``,
      `Report Type: ${report.report_type}`,
      `Period: ${format(new Date(report.date_range.start), 'MMMM dd, yyyy')} - ${format(new Date(report.date_range.end), 'MMMM dd, yyyy')}`,
      `Generated: ${format(new Date(report.generated_at), 'MMMM dd, yyyy HH:mm:ss')}`,
      `Status: ${report.status}`,
      `Format: ${report.format}`,
      ``,
      `FINANCIAL SUMMARY`,
      `---------------`,
      `Total Income: ₹${report.data.total_income?.toLocaleString() || 0}`,
      `Total Expenses: ₹${report.data.total_expenses?.toLocaleString() || 0}`,
      `Net Income: ₹${report.data.net_income?.toLocaleString() || 0}`,
      `Budgets: ${report.data.budget_count || 0}`,
      `Savings Goals: ${report.data.savings_count || 0}`,
      ``,
      `INCOME TRANSACTIONS (${report.data.income?.length || 0})`,
      `------------------`,
      report.data.income?.slice(0, 10).map((income: any, index: number) => 
        `${index + 1}. ${income.source}: ₹${income.amount?.toLocaleString()} - ${income.description || 'No description'}`
      ).join('\n') || 'No income transactions found',
      ``,
      `EXPENSE TRANSACTIONS (${report.data.expenses?.length || 0})`,
      `-------------------`,
      report.data.expenses?.slice(0, 10).map((expense: any, index: number) => 
        `${index + 1}. ${expense.category}: ₹${expense.amount?.toLocaleString()} - ${expense.description || 'No description'}`
      ).join('\n') || 'No expense transactions found',
      ``,
      `BUDGETS (${report.data.budgets?.length || 0})`,
      `--------`,
      report.data.budgets?.slice(0, 5).map((budget: any, index: number) => 
        `${budget.name}: ₹${budget.spent?.toLocaleString()} / ₹${budget.amount?.toLocaleString()} (${Math.round((budget.spent / budget.amount) * 100)}%)`
      ).join('\n') || 'No budgets found',
      ``,
      `SAVINGS GOALS (${report.data.savings_goals?.length || 0})`,
      `---------------`,
      report.data.savings_goals?.slice(0, 5).map((goal: any, index: number) => 
        `${goal.name}: ₹${goal.current_amount?.toLocaleString()} / ₹${goal.target_amount?.toLocaleString()} (${Math.round((goal.current_amount / goal.target_amount) * 100)}%)` +
        ` Target: ${format(new Date(goal.target_date), 'MMMM dd, yyyy')}`
      ).join('\n') || 'No savings goals found',
      ``,
      `ADDITIONAL INFORMATION`,
      `--------------------`,
      `Report ID: ${report.id}`,
      `User ID: ${report.user_id}`,
      `Requested: ${format(new Date(report.requested_at), 'MMMM dd, yyyy HH:mm:ss')}`,
      `Completed: ${report.completed_at ? format(new Date(report.completed_at), 'MMMM dd, yyyy HH:mm:ss') : 'Not completed'}`,
      `Created: ${format(new Date(report.created_at), 'MMMM dd, yyyy HH:mm:ss')}`,
      ``,
      `DESCRIPTION: ${report.description || 'No description provided'}`,
      ``,
      `=====================================`
    ]
    
    return lines.join('\n')
  }

  const handleDeleteReport = async () => {
    if (!report || !confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      await reportsService.deleteReport(report.id)
      toast.success('Report deleted successfully')
      router.push('/reports')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete report')
    }
  }

  const handleBack = () => {
    router.push('/reports')
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Loading Report...</h1>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (error) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Error</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Failed to Load Report</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  if (!report) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Reports
            </Button>
            <h1 className="text-3xl font-bold text-foreground">Report Not Found</h1>
          </div>
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Report Not Found</h3>
              <p className="text-muted-foreground mb-4">The requested report could not be found.</p>
              <Button onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Reports
              </Button>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Reports
          </Button>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-bold text-foreground">{report.name}</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              report.status === 'completed' ? 'bg-green-100 text-green-800' :
              report.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {report.status === 'completed' ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Completed
                </>
              ) : report.status === 'processing' ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  Processing
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4 mr-1" />
                  Error
                </>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button onClick={handleDownloadReport} disabled={!report.file_url}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button variant="outline" onClick={() => {
              // Copy report data to clipboard
              const reportData = {
                ...report,
                downloaded_at: new Date().toISOString(),
                download_url: report.file_url || 'No file available'
              }
              navigator.clipboard.writeText(JSON.stringify(reportData, null, 2))
              toast.success('Report data copied to clipboard')
            }}>
              <Share2 className="h-4 w-4 mr-2" />
              Copy
            </Button>
            <Button variant="outline" onClick={handleDeleteReport}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Report Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Report Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Report Type</p>
                <p className="font-semibold text-foreground capitalize">{report.report_type}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Period</p>
                <p className="font-semibold text-foreground">
                  {format(new Date(report.date_range.start), 'MMM dd, yyyy')} - {format(new Date(report.date_range.end), 'MMM dd, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Generated</p>
                <p className="font-semibold text-foreground">
                  {format(new Date(report.generated_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Format</p>
                <p className="font-semibold text-foreground uppercase">{report.format}</p>
              </div>
            </div>
            
            {report.description && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Description</p>
                <p className="text-foreground">{report.description}</p>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-muted-foreground">Requested</p>
                <p className="font-semibold text-foreground">
                  {format(new Date(report.requested_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="font-semibold text-foreground">
                  {report.completed_at ? format(new Date(report.completed_at), 'MMM dd, yyyy HH:mm') : 'Not completed'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-semibold text-foreground">
                  {format(new Date(report.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  ${report.data.total_income?.toLocaleString() || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
                  <TrendingDown className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  ${report.data.total_expenses?.toLocaleString() || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
                  <DollarSign className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  ${report.data.net_income?.toLocaleString() || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Net Income</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  {report.data.budget_count || 0}
                </h3>
                <p className="text-sm text-muted-foreground">Active Budgets</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Data Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                Income Details ({report.data.income?.length || 0} transactions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.data.income && report.data.income.length > 0 ? (
                <div className="space-y-3">
                  {report.data.income.slice(0, 5).map((income: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{income.source}</p>
                        <p className="text-sm text-muted-foreground">{income.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{income.amount?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(income.date), 'MMM dd')}</p>
                      </div>
                    </div>
                  ))}
                  {report.data.income.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {report.data.income.length - 5} more transactions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No income transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expense Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingDown className="h-5 w-5 mr-2 text-red-600" />
                Expense Details ({report.data.expenses?.length || 0} transactions)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report.data.expenses && report.data.expenses.length > 0 ? (
                <div className="space-y-3">
                  {report.data.expenses.slice(0, 5).map((expense: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="font-medium text-foreground">{expense.category}</p>
                        <p className="text-sm text-muted-foreground">{expense.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-foreground">₹{expense.amount?.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(expense.date), 'MMM dd')}</p>
                      </div>
                    </div>
                  ))}
                  {report.data.expenses.length > 5 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {report.data.expenses.length - 5} more transactions
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No expense transactions found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Budgets and Savings Goals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Budgets */}
          <Card>
            <CardHeader>
              <CardTitle>Budgets ({report.data.budgets?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {report.data.budgets && report.data.budgets.length > 0 ? (
                <div className="space-y-3">
                  {report.data.budgets.slice(0, 3).map((budget: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-foreground">{budget.name}</p>
                        <p className="text-sm text-muted-foreground">{budget.category}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((budget.spent / budget.amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Spent: ${budget.spent?.toLocaleString()}</span>
                        <span className="font-medium">Total: ${budget.amount?.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {report.data.budgets.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {report.data.budgets.length - 3} more budgets
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No budgets found</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Savings Goals */}
          <Card>
            <CardHeader>
              <CardTitle>Savings Goals ({report.data.savings_goals?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {report.data.savings_goals && report.data.savings_goals.length > 0 ? (
                <div className="space-y-3">
                  {report.data.savings_goals.slice(0, 3).map((goal: any, index: number) => (
                    <div key={index} className="p-3 bg-muted/50 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-medium text-foreground">{goal.name}</p>
                        <p className="text-sm text-muted-foreground">{goal.category}</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${Math.min((goal.current_amount / goal.target_amount) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current: ${goal.current_amount?.toLocaleString()}</span>
                        <span className="font-medium">Target: ${goal.target_amount?.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Target: {format(new Date(goal.target_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  ))}
                  {report.data.savings_goals.length > 3 && (
                    <p className="text-sm text-muted-foreground text-center">
                      ... and {report.data.savings_goals.length - 3} more goals
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No savings goals found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
