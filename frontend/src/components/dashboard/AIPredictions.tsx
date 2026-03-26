'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, TrendingUp, AlertTriangle, Info } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface Prediction {
  month: string
  predicted: number
  confidence: number
}

interface AIPredictionsProps {
  predictions: Prediction[]
}

export function AIPredictions({ predictions }: AIPredictionsProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600 bg-green-100'
    if (confidence >= 60) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getInsightIcon = (type: 'warning' | 'info' | 'success') => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'success':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const insights = [
    {
      type: 'warning' as const,
      title: 'Spending Alert',
      description: 'Your entertainment spending increased by 25% this month',
    },
    {
      type: 'success' as const,
      title: 'Great Progress',
      description: 'You saved 15% more than last month',
    },
    {
      type: 'info' as const,
      title: 'Budget Tip',
      description: 'Consider reducing food expenses by cooking more at home',
    },
  ]

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400 mr-2" />
          <h3 className="text-lg font-semibold text-card-foreground">AI Insights</h3>
        </div>
        <Button variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Predictions */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Next Month's Prediction</h4>
        <div className="space-y-3">
          {predictions.map((prediction, index) => (
            <div key={index} className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-card-foreground">{prediction.month}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getConfidenceColor(prediction.confidence)}`}>
                  {prediction.confidence}% confidence
                </span>
              </div>
              <p className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                {formatCurrency(prediction.predicted)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Predicted expenses based on your spending patterns
              </p>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Insights */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Smart Insights</h4>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-card rounded-lg text-card-foreground">
              <div className="mt-0.5">
                {getInsightIcon(insight.type)}
              </div>
              <div className="flex-1">
                <h5 className="font-medium text-base text-card-foreground">{insight.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{insight.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button variant="outline" className="w-full" size="sm">
          View Detailed Analysis
        </Button>
      </div>
    </Card>
  )
}
