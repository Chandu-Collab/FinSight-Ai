'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { reportsService } from '@/lib/reports'
import { Report } from '@/types/report'
import EnhancedReportGenerator from '@/components/reports/EnhancedReportGenerator'
import { 
  FileText, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  Filter,
  Search,
  Eye,
  Trash2,
  Share2,
  Settings
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function ReportsPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'monthly' | 'quarterly' | 'yearly'>('all')
  const [generating, setGenerating] = useState(false)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      console.log('🔍 Fetching reports for user...')
      const response = await reportsService.getReports()
      console.log('🔍 Reports API response:', response)
      setReports(response.data)
      console.log('🔍 Reports set:', response.data)
    } catch (error) {
      console.error('❌ Error fetching reports:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateReport = async (type: 'monthly' | 'quarterly' | 'yearly') => {
    try {
      setGenerating(true)
      
      // Calculate date range based on report type
      const now = new Date()
      let start: Date, end: Date, reportName: string
      
      switch (type) {
        case 'monthly':
          start = new Date(now.getFullYear(), now.getMonth(), 1)
          end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
          reportName = `${format(now, 'MMMM yyyy')} Financial Report`
          break
        case 'quarterly':
          const quarter = Math.floor(now.getMonth() / 3)
          start = new Date(now.getFullYear(), quarter * 3, 1)
          end = new Date(now.getFullYear(), quarter * 3 + 3, 0)
          reportName = `Q${quarter + 1} ${now.getFullYear()} Financial Report`
          break
        case 'yearly':
          start = new Date(now.getFullYear(), 0, 1)
          end = new Date(now.getFullYear(), 11, 31)
          reportName = `${now.getFullYear()} Annual Financial Report`
          break
      }

      const reportData = {
        report_type: type,
        date_range: {
          start: format(start, 'yyyy-MM-dd'),
          end: format(end, 'yyyy-MM-dd')
        },
        name: reportName
      }

      const response = await reportsService.generateReport(reportData)
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} report generated successfully!`)
      
      // Refresh reports list
      await fetchReports()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate report')
    } finally {
      setGenerating(false)
    }
  }

  const handleViewReport = (report: Report) => {
    // Navigate to report detail page
    router.push(`/reports/${report.id}`)
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return
    }

    try {
      await reportsService.deleteReport(reportId)
      toast.success('Report deleted successfully')
      await fetchReports()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete report')
    }
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = report.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         report.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || report.report_type === filterType
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">Reports</h1>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-foreground">Financial Reports</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button 
              onClick={() => handleGenerateReport('monthly')} 
              disabled={generating}
            >
              <FileText className="h-4 w-4 mr-2" />
              {generating ? 'Generating...' : 'Generate Monthly Report'}
            </Button>
            <Button 
              onClick={() => handleGenerateReport('quarterly')} 
              variant="outline"
              disabled={generating}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Generate Quarterly Report
            </Button>
            <Button 
              onClick={() => handleGenerateReport('yearly')} 
              variant="outline"
              disabled={generating}
            >
              <PieChart className="h-4 w-4 mr-2" />
              Generate Annual Report
            </Button>
          </div>
        </div>

        {/* Enhanced Report Generator */}
        <Tabs defaultValue="existing-reports" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="existing-reports">Existing Reports</TabsTrigger>
            <TabsTrigger value="enhanced-generator">Enhanced Generator</TabsTrigger>
          </TabsList>
          
          <TabsContent value="existing-reports">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={filterType === 'all' ? 'default' : 'outline'}
                      onClick={() => setFilterType('all')}
                      size="sm"
                    >
                      All
                    </Button>
                    <Button
                      variant={filterType === 'monthly' ? 'default' : 'outline'}
                      onClick={() => setFilterType('monthly')}
                      size="sm"
                    >
                      Monthly
                    </Button>
                    <Button
                      variant={filterType === 'quarterly' ? 'default' : 'outline'}
                      onClick={() => setFilterType('quarterly')}
                      size="sm"
                    >
                      Quarterly
                    </Button>
                    <Button
                      variant={filterType === 'yearly' ? 'default' : 'outline'}
                      onClick={() => setFilterType('yearly')}
                      size="sm"
                    >
                      Yearly
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reports Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredReports.map((report) => (
                <Card key={report.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`p-2 rounded-full ${
                          report.report_type === 'monthly' ? 'bg-blue-100 text-blue-600' :
                          report.report_type === 'quarterly' ? 'bg-green-100 text-green-600' :
                          'bg-purple-100 text-purple-600'
                        }`}>
                          {report.report_type === 'monthly' ? <Calendar className="h-4 w-4" /> :
                           report.report_type === 'quarterly' ? <BarChart3 className="h-4 w-4" /> :
                           <PieChart className="h-4 w-4" />}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground text-sm">
                            {report.report_type.charAt(0).toUpperCase() + report.report_type.slice(1)}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(report.date_range.start), 'MMM dd, yyyy')} - {format(new Date(report.date_range.end), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewReport(report)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteReport(report.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium text-foreground mb-2">{report.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          Generated on {format(new Date(report.generated_at), 'MMM dd, yyyy')}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Income</p>
                            <p className="font-semibold text-foreground">
                              ${report.data.total_income?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <TrendingDown className="h-4 w-4 text-red-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Expenses</p>
                            <p className="font-semibold text-foreground">
                              ${report.data.total_expenses?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Net Income</p>
                            <p className="font-semibold text-foreground">
                              ${report.data.net_income?.toLocaleString() || 0}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <BarChart3 className="h-4 w-4 text-purple-500" />
                          <div>
                            <p className="text-xs text-muted-foreground">Budgets</p>
                            <p className="font-semibold text-foreground">
                              ${report.data.budget_count || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {report.data.savings_count || 0} savings goals
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewReport(report)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View Report
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredReports.length === 0 && !loading && (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No reports found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your search or filter criteria' 
                      : 'Generate your first financial report to get started'}
                  </p>
                  {!searchTerm && filterType === 'all' && (
                    <Button onClick={() => handleGenerateReport('monthly')} disabled={generating}>
                      <FileText className="h-4 w-4 mr-2" />
                      {generating ? 'Generating...' : 'Generate Monthly Report'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="enhanced-generator">
            <EnhancedReportGenerator />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
