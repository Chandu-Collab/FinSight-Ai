'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Brain, TrendingUp, BarChart3 } from 'lucide-react'
import { AppLayout } from '@/components/layout/AppLayout'
import { ExpensePredictionForm } from '@/components/predictions/ExpensePredictionForm'
import { LinearPredictionForm } from '@/components/predictions/LinearPredictionForm'

export default function PredictionsPage() {
  return (
    <AppLayout>
      <div className="bg-gradient-to-br from-background to-accent/20">
        {/* Modern Header */}
        <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    AI Predictions
                  </h1>
                  <p className="text-sm text-muted-foreground">Use machine learning models to predict expenses and financial trends</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="expense-prediction" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border border-border/50 p-1 rounded-xl">
              <TabsTrigger 
                value="expense-prediction" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Expense Prediction</span>
              </TabsTrigger>
              <TabsTrigger 
                value="linear-prediction" 
                className="flex items-center space-x-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white rounded-lg transition-all duration-200"
              >
                <TrendingUp className="h-4 w-4" />
                <span>Linear Prediction</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="expense-prediction">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                    <span>Expense Prediction</span>
                  </CardTitle>
                  <CardDescription>
                    Predict future expenses based on historical expense data. 
                    Provide past expenses and target month to get AI-powered predictions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ExpensePredictionForm />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="linear-prediction">
              <Card className="bg-card/80 backdrop-blur-sm border-2 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                    <span>Linear Regression Prediction</span>
                  </CardTitle>
                  <CardDescription>
                    Use linear regression to predict values based on numerical features.
                    Provide features like income, family size, year, etc. to get predictions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <LinearPredictionForm />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </AppLayout>
  )
}
