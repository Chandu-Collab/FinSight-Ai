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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Plus, Trash2, TrendingUp, DollarSign, Brain } from 'lucide-react'
import { mlApi, LinearPredictionRequest, LinearPredictionResponse } from '@/lib/api/production'

const formatCurrencyINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount)
}

const Badge = ({ children, variant = "default" }: { children: React.ReactNode, variant?: "default" | "secondary" }) => (
  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
    variant === "secondary" ? "bg-secondary text-secondary-foreground" : "bg-primary text-primary-foreground"
  }`}>
    {children}
  </span>
)

const linearPredictionSchema = z.object({
  features: z.array(z.number()).min(1, 'At least one feature is required'),
  category: z.string().min(1, 'Category is required'),
  target_date: z.string().min(1, 'Target date is required'),
  month: z.string().min(1, 'Month is required'),
  model_version: z.string().optional(),
  notes: z.string().optional()
})

type LinearPredictionFormData = z.infer<typeof linearPredictionSchema>

const commonCategories = [
  'Groceries',
  'Transport',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Education',
  'Shopping',
  'Dining',
  'Travel',
  'Other'
]

export function LinearPredictionForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<LinearPredictionResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<LinearPredictionFormData>({
    resolver: zodResolver(linearPredictionSchema),
    defaultValues: {
      features: [], // Start completely empty
      category: '',
      target_date: '',
      month: '',
      model_version: '',
      notes: ''
    }
  })

  const features = form.watch('features')

  const addFeature = () => {
    const currentFeatures = form.getValues('features')
    form.setValue('features', [...currentFeatures, null]) // Add null instead of 0
  }

  const removeFeature = (index: number) => {
    const currentFeatures = form.getValues('features')
    if (currentFeatures.length > 1) {
      form.setValue('features', currentFeatures.filter((_, i) => i !== index))
    }
  }

  const updateFeature = (index: number, value: string) => {
    const currentFeatures = form.getValues('features')
    const numValue = parseFloat(value)
    currentFeatures[index] = isNaN(numValue) ? null : numValue
    form.setValue('features', currentFeatures)
  }

  const onSubmit = async (data: LinearPredictionFormData) => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      // Backend ignores user features and uses time-based prediction from month
      const requestData: LinearPredictionRequest = {
        features: [], // Backend ignores this
        category: data.category,
        target_date: data.target_date,
        month: data.month, // This is what backend actually uses
        model_version: data.model_version,
        notes: data.notes
      }
      console.log('� Sending request data (backend will use time-based features):', requestData)
      const response = await mlApi.predictLinear(requestData)
      console.log('🔍 Backend response:', response)
      
      // Handle backend response structure - returns {'prediction': result, 'status': 'success'}
      if (response.prediction && response.prediction.predicted_value) {
        const transformedResult: LinearPredictionResponse = {
          prediction: {
            value: parseFloat(response.prediction.predicted_value),
            category: response.prediction.category || data.category,
            confidence_score: response.prediction.confidence_score ? parseFloat(response.prediction.confidence_score) : undefined,
            model_version: response.prediction.model_version,
            features_used: [parseInt(data.month.split('-')[0]), parseInt(data.month.split('-')[1])] // Backend uses year, month from time features
          },
          status: response.status || 'success',
          message: `Time-based prediction for ${data.month}`
        }
        setResult(transformedResult)
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
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {commonCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="target_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      placeholder="e.g., 2024-04-01" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month</FormLabel>
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

            <FormField
              control={form.control}
              name="model_version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Model Version (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., 1.0" 
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <FormLabel>Numerical Features</FormLabel>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addFeature}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Add Feature</span>
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              Add numerical features like income amount, family size, year, etc. 
              These will be used by the linear regression model to make predictions.
            </div>

            {features.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-muted-foreground mb-2">Ready for time-based prediction</p>
                <p className="text-sm text-muted-foreground">
                  The backend uses time-based features from your target month to generate predictions.
                  Just provide a target month and category - the numerical features are not required.
                </p>
              </div>
            ) : (
              features.map((feature, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium">Feature {index + 1}</h4>
                    {features.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Input
                      type="number"
                      step="any"
                      placeholder="Enter numerical value"
                      value={feature === null ? '' : feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      className="flex-1"
                    />
                    <span className="text-sm text-muted-foreground min-w-[60px]">
                      Value: {feature === null ? 'empty' : feature}
                    </span>
                  </div>
                </Card>
              ))
            )}
          </div>

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Any additional notes about this prediction..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Predicting...
              </>
            ) : (
              <>
                <Brain className="mr-2 h-4 w-4" />
                Generate Linear Prediction
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
              <Brain className="h-5 w-5" />
              <span>Linear Prediction Results</span>
            </CardTitle>
            <CardDescription>
              Linear regression prediction for {result.prediction.category}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Predicted Value</p>
                <p className="text-3xl font-bold text-primary">
                  {!isNaN(result.prediction.value) ? formatCurrencyINR(result.prediction.value) : 'Invalid Value'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium">Category</p>
                  <Badge variant="secondary">
                    {result.prediction.category}
                  </Badge>
                </div>

                {result.prediction.confidence_score && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Confidence Score</p>
                    <p className="text-lg font-semibold">
                      {(result.prediction.confidence_score * 100).toFixed(1)}%
                    </p>
                  </div>
                )}

                {result.prediction.model_version && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Model Version</p>
                    <p className="text-lg font-semibold">
                      {result.prediction.model_version}
                    </p>
                  </div>
                )}

                {result.prediction.features_used && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Features Used</p>
                    <p className="text-sm text-muted-foreground">
                      {result.prediction.features_used.length} features
                    </p>
                  </div>
                )}
              </div>

              {result.prediction.features_used && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Feature Values Used</h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {result.prediction.features_used.map((feature, index) => (
                        <div key={index} className="text-center">
                          <p className="text-xs text-muted-foreground">Feature {index + 1}</p>
                          <p className="font-semibold">{feature}</p>
                        </div>
                      ))}
                    </div>
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
