'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plus, Trash2, TrendingUp, DollarSign } from 'lucide-react'
import { mlApi, ExpensePredictionRequest, ExpensePredictionResponse, ExpenseItem } from '@/lib/api/production'
import { formatCurrency } from '@/lib/utils'

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "secondary" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    variant === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
  }`}>
    {children}
  </span>
)

const expenseItemSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional()
})

const expensePredictionSchema = z.object({
  target_month: z.string().min(1, 'Target month is required'),
  expenses: z.array(expenseItemSchema).optional() // Optional since backend fetches from DB
})

type ExpensePredictionFormData = z.infer<typeof expensePredictionSchema>

export function ExpensePredictionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ExpensePredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<ExpensePredictionFormData>({
    resolver: zodResolver(expensePredictionSchema),
    defaultValues: {
      target_month: new Date().toISOString().slice(0, 7), // Current month as default
      expenses: [] // Start empty - backend fetches from database
    }
  })

  const expenses = form.watch('expenses')

  const addExpense = () => {
    const currentExpenses = form.getValues('expenses')
    form.setValue('expenses', [...currentExpenses, { amount: 0, category: '', date: '' }])
  }

  const removeExpense = (index: number) => {
    const currentExpenses = form.getValues('expenses')
    if (currentExpenses.length > 1) {
      form.setValue('expenses', currentExpenses.filter((_, i) => i !== index))
    }
  }

  const updateExpense = (index: number, field: keyof ExpenseItem, value: any) => {
    const currentExpenses = form.getValues('expenses')
    currentExpenses[index] = { ...currentExpenses[index], [field]: value }
    form.setValue('expenses', currentExpenses)
  }

  const onSubmit = async (data: ExpensePredictionFormData) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Backend ignores input expenses and fetches user's actual expense data from database
      const requestData: ExpensePredictionRequest = {
        target_month: data.target_month,
        expenses: [] // Backend ignores this and fetches from DB
      }
      console.log('📤 Sending request data (backend will fetch expenses from database):', requestData)
      const response = await mlApi.predictExpenses(requestData)
      console.log('🔍 Backend response:', response)
      
      // Handle backend response structure - returns {'prediction': db_record, 'enhanced_prediction': ml_result, 'status': 'success'}
      if (response.enhanced_prediction) {
        const enhanced = response.enhanced_prediction
        // Transform enhanced_prediction to match ExpensePredictionResponse interface
        const transformedResult: ExpensePredictionResponse = {
          prediction: enhanced.predictions || [],
          total_predicted: enhanced.total_predicted || 0,
          month: enhanced.month || data.target_month,
          status: enhanced.status || 'success',
          message: `Prediction using your actual expense data from database (${enhanced.predictions?.length || 0} categories)`
        }
        setResult(transformedResult)
      } 
      else if (response.prediction) {
        throw new Error('Enhanced prediction not available')
      }
      else {
        throw new Error(`No valid prediction data found. Status: ${response.status}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during prediction')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Information Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">i</span>
            </div>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">AI-Powered Expense Prediction</p>
              <p>Our system analyzes your historical expense data from the database to predict future spending patterns. Simply select a target month and get accurate predictions based on your actual financial behavior.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="target_month"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Target Month</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="e.g., 2024-04" 
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Historical Expenses</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addExpense}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Expense</span>
              </Button>
            </div>

            {expenses.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-muted-foreground mb-2">Ready for prediction</p>
                <p className="text-sm text-muted-foreground">
                  The backend will use your actual expense data from the database to generate predictions.
                  Just select a target month and click "Generate Prediction" - no need to add expenses manually.
                </p>
              </div>
            ) : (
              expenses.map((expense, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium">Expense {index + 1}</h4>
                    {expenses.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExpense(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={expense.amount}
                        onChange={(e) => updateExpense(index, 'amount', parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <Input
                        placeholder="e.g., Food, Transport"
                        value={expense.category}
                        onChange={(e) => updateExpense(index, 'category', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Date</label>
                      <Input
                        type="date"
                        value={expense.date}
                        onChange={(e) => updateExpense(index, 'date', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Input
                      placeholder="Optional description"
                      value={expense.description || ''}
                      onChange={(e) => updateExpense(index, 'description', e.target.value)}
                    />
                  </div>
                </Card>
              ))
            )}
          </div>

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <TrendingUp className="mr-2 h-4 w-4" />
                Generate Prediction
              </>
            )}
          </Button>
        </form>
      </Form>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <DollarSign className="h-5 w-5" />
              <span>Prediction Results</span>
            </CardTitle>
            <CardDescription>
              AI-powered expense predictions for {result.month}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Predicted Expenses</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(result.total_predicted)}
                </p>
              </div>

              {(result.prediction && result.prediction.length > 0) && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Category Breakdown</h4>
                  <div className="grid gap-2">
                    {result.prediction.map((pred, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary">{pred.category}</Badge>
                          {pred.confidence_score && (
                            <span className="text-xs text-muted-foreground">
                              Confidence: {(pred.confidence_score * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                        <span className="font-semibold">
                          {formatCurrency(pred.predicted_amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.message && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">{result.message}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
