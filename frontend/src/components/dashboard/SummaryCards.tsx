'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DollarSign, TrendingUp, TrendingDown, PiggyBank, ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function SummaryCards() {
  const [summary, setSummary] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    savings: 0,
    budgetUsage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading state
    setTimeout(() => {
      setSummary({
        totalIncome: 5000,
        totalExpenses: 3200,
        savings: 1800,
        budgetUsage: 64
      })
      setLoading(false)
    }, 1000)
  }, [])

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) return <ArrowUp className="h-3 w-3" />
    if (trend.startsWith('-')) return <ArrowDown className="h-3 w-3" />
    return <Minus className="h-3 w-3" />
  }

  const getTrendColor = (trend: string) => {
    if (trend.startsWith('+')) return 'text-green-600'
    if (trend.startsWith('-')) return 'text-red-600'
    return 'text-gray-600'
  }

  const cards = [
    {
      title: "Total Income",
      value: `$${summary.totalIncome.toLocaleString()}`,
      icon: DollarSign,
      trend: "+12%",
      color: "from-green-500 to-emerald-600",
      bgColor: "from-green-50 to-emerald-50",
      borderColor: "border-green-200"
    },
    {
      title: "Total Expenses",
      value: `$${summary.totalExpenses.toLocaleString()}`,
      icon: TrendingDown,
      trend: "+8%",
      color: "from-red-500 to-pink-600",
      bgColor: "from-red-50 to-pink-50",
      borderColor: "border-red-200"
    },
    {
      title: "Savings",
      value: `$${summary.savings.toLocaleString()}`,
      icon: PiggyBank,
      trend: "+15%",
      color: "from-blue-500 to-indigo-600",
      bgColor: "from-blue-50 to-indigo-50",
      borderColor: "border-blue-200"
    },
    {
      title: "Budget Usage",
      value: `${summary.budgetUsage}%`,
      icon: TrendingUp,
      trend: "-2%",
      color: "from-orange-500 to-amber-600",
      bgColor: "from-orange-50 to-amber-50",
      borderColor: "border-orange-200"
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-16 sm:w-20"></div>
            </CardHeader>
            <CardContent>
              <div className="h-6 sm:h-8 bg-gray-200 rounded w-20 sm:w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-12 sm:w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={cn(
            "relative overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-105 cursor-pointer",
            card.borderColor,
            "bg-white/70 backdrop-blur-sm"
          )}
        >
          {/* Gradient Background */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-5",
            card.bgColor
          )} />
          
          {/* Card Content */}
          <CardHeader className="relative pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs sm:text-sm font-medium text-gray-700">{card.title}</CardTitle>
              <div className={cn(
                "w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center bg-gradient-to-r",
                card.color
              )}>
                <card.icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              {card.value}
            </div>
            <div className="flex items-center space-x-1">
              <span className={cn("flex items-center", getTrendColor(card.trend))}>
                {getTrendIcon(card.trend)}
                <span className="text-xs font-medium ml-1">{card.trend}</span>
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">from last month</span>
              <span className="text-xs text-gray-500 sm:hidden">vs last</span>
            </div>
            
            {/* Progress Bar for Budget Usage */}
            {card.title === "Budget Usage" && (
              <div className="mt-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500",
                      summary.budgetUsage > 80 ? "bg-red-500" : 
                      summary.budgetUsage > 60 ? "bg-orange-500" : "bg-green-500"
                    )}
                    style={{ width: `${summary.budgetUsage}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
          
          {/* Hover Effect Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-transparent to-white/20 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </Card>
      ))}
    </div>
  )
}
