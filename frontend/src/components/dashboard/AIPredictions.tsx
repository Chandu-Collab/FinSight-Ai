'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, AlertCircle, RefreshCw, Sparkles, Target, Zap } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts'
import { cn } from '@/lib/utils'

interface Prediction {
  month: string
  actual?: number
  predicted: number
  confidence: number
  category?: string
}

interface Insight {
  id: string
  type: 'warning' | 'info' | 'success' | 'critical'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  actionable?: boolean
}

interface MonthlyForecast {
  month: string
  total_predicted: number
  category_breakdown: {
    [category: string]: number
  }
  confidence_score: number
}

export default function AIPredictions() {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [insights, setInsights] = useState<Insight[]>([])
  const [forecast, setForecast] = useState<MonthlyForecast | null>(null)
  const [loading, setLoading] = useState(false)
  const [trainingModel, setTrainingModel] = useState(false)

  useEffect(() => {
    fetchPredictions()
    fetchInsights()
    fetchForecast()
  }, [])

  const fetchPredictions = async () => {
    // Mock API call - replace with actual backend API
    const mockPredictions: Prediction[] = [
      { month: 'Jan', actual: 2800, predicted: 2900, confidence: 0.85 },
      { month: 'Feb', actual: 3200, predicted: 3100, confidence: 0.82 },
      { month: 'Mar', actual: 2900, predicted: 3000, confidence: 0.88 },
      { month: 'Apr', actual: 3500, predicted: 3400, confidence: 0.79 },
      { month: 'May', actual: 3100, predicted: 3200, confidence: 0.86 },
      { month: 'Jun', actual: 3300, predicted: 3250, confidence: 0.84 },
      { month: 'Jul', actual: undefined, predicted: 3400, confidence: 0.81 },
      { month: 'Aug', actual: undefined, predicted: 3500, confidence: 0.78 }
    ]
    setPredictions(mockPredictions)
  }

  const fetchInsights = async () => {
    const mockInsights: Insight[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Spending Trend Alert',
        description: 'Your entertainment spending has increased by 25% this month',
        impact: 'high',
        actionable: true
      },
      {
        id: '2',
        type: 'warning',
        title: 'Budget Optimization',
        description: 'Consider reducing food budget by 10% to meet savings goals',
        impact: 'medium',
        actionable: true
      },
      {
        id: '3',
        type: 'success',
        title: 'Good Progress',
        description: 'You\'re on track to save $500 more than last month',
        impact: 'low',
        actionable: false
      },
      {
        id: '4',
        type: 'info',
        title: 'Investment Opportunity',
        description: 'Based on your savings pattern, consider investing $200/month',
        impact: 'medium',
        actionable: true
      }
    ]
    setInsights(mockInsights)
  }

  const fetchForecast = async () => {
    const mockForecast: MonthlyForecast = {
      month: 'September',
      total_predicted: 3600,
      category_breakdown: {
        'Housing': 1500,
        'Food': 600,
        'Transport': 400,
        'Entertainment': 300,
        'Utilities': 200,
        'Other': 600
      },
      confidence_score: 0.83
    }
    setForecast(mockForecast)
  }

  const handleRefreshPredictions = async () => {
    setLoading(true)
    await fetchPredictions()
    await fetchInsights()
    await fetchForecast()
    setTimeout(() => setLoading(false), 1000)
  }

  const handleTrainModel = async () => {
    setTrainingModel(true)
    // Simulate model training API call
    setTimeout(() => {
      setTrainingModel(false)
    }, 3000)
  }

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'critical':
        return <AlertCircle className="h-4 w-4 text-red-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      default:
        return <Sparkles className="h-4 w-4 text-blue-600" />
    }
  }

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'success':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-blue-200 bg-blue-50'
    }
  }

  const getImpactBadgeColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-2 border-gray-200/50 shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Predictions & Insights
          </span>
        </CardTitle>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTrainModel}
            disabled={trainingModel}
            className="flex items-center space-x-1 border-purple-300 hover:bg-purple-50"
          >
            <Zap className={`h-4 w-4 ${trainingModel ? 'animate-pulse' : ''}`} />
            <span>{trainingModel ? 'Training...' : 'Train Model'}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshPredictions}
            disabled={loading}
            className="flex items-center space-x-1 border-blue-300 hover:bg-blue-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enhanced Prediction Chart */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Expense Predictions</h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Target className="h-4 w-4" />
              <span>ML Powered</span>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictions}>
                <defs>
                  <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis dataKey="month" stroke="#666" />
                <YAxis stroke="#666" />
                <Tooltip 
                  formatter={(value: any) => [`$${value}`, '']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="actual"
                  stroke="#8884d8"
                  fillOpacity={1}
                  fill="url(#colorActual)"
                  strokeWidth={2}
                  name="Actual"
                />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  stroke="#82ca9d"
                  fillOpacity={1}
                  fill="url(#colorPredicted)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Predicted"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Enhanced AI Insights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-800">Smart Insights</h3>
            <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 rounded-full">
              <Sparkles className="h-3 w-3 text-green-600" />
              <span className="text-xs font-medium text-green-800">AI Generated</span>
            </div>
          </div>
          <div className="space-y-3">
            {insights.map((insight) => (
              <div
                key={insight.id}
                className={`p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${getInsightColor(insight.type)}`}
              >
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    {getInsightIcon(insight.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getImpactBadgeColor(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                        {insight.actionable && (
                          <Button size="sm" variant="outline" className="h-6 px-2 text-xs">
                            Act
                          </Button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Monthly Forecast */}
        {forecast && (
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>{forecast.month} Forecast</span>
                </h3>
                <p className="text-blue-100 text-sm mt-1">
                  Based on your spending patterns
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">
                  ${forecast.total_predicted.toLocaleString()}
                </div>
                <div className="text-sm text-blue-100">
                  {Math.round(forecast.confidence_score * 100)}% confidence
                </div>
              </div>
            </div>
            
            {/* Category Breakdown */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-blue-100 mb-3">Category Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(forecast.category_breakdown).map(([category, amount]) => (
                  <div key={category} className="flex justify-between items-center bg-white/20 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium">{category}</span>
                    <span className="text-sm font-bold">${amount}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
