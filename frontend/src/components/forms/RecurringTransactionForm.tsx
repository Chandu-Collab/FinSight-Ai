'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { recurringApi, type RecurringTransaction, type CreateRecurringTransactionData } from '@/lib/api/production'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import toast from 'react-hot-toast'
import { Calendar, DollarSign, Repeat, Info } from 'lucide-react'
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns'

const recurringTransactionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  frequency: z.string().min(1, 'Frequency is required'),
  category: z.string().optional(),
  source: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
  max_occurrences: z.number().optional(),
  is_active: z.boolean().default(true),
  notes: z.string().optional(),
  occurrence_count: z.number().optional(),
  last_run_date: z.string().optional(),
  run_count: z.number().optional(),
  skip_count: z.number().optional(),
  failure_count: z.number().optional(),
  last_status: z.string().optional(),
  timezone: z.string().optional(),
  parent_transaction_id: z.string().optional(),
})

type RecurringTransactionFormData = z.infer<typeof recurringTransactionSchema>

interface RecurringTransactionFormProps {
  transaction?: RecurringTransaction
  onSuccess?: (transaction: RecurringTransaction) => void
  onCancel?: () => void
}

const FREQUENCIES = [
  { value: 'daily', label: 'Daily', description: 'Every day' },
  { value: 'weekly', label: 'Weekly', description: 'Every week' },
  { value: 'biweekly', label: 'Bi-weekly', description: 'Every 2 weeks' },
  { value: 'monthly', label: 'Monthly', description: 'Every month' },
  { value: 'bimonthly', label: 'Bi-monthly', description: 'Every 2 months' },
  { value: 'quarterly', label: 'Quarterly', description: 'Every 3 months' },
  { value: 'yearly', label: 'Yearly', description: 'Every year' },
]

const INCOME_CATEGORIES = [
  'Salary', 'Freelance', 'Investment', 'Rental', 'Business', 'Pension', 'Other'
]

const EXPENSE_CATEGORIES = [
  'Housing', 'Food', 'Transportation', 'Utilities', 'Healthcare', 'Entertainment',
  'Shopping', 'Education', 'Insurance', 'Debt', 'Savings', 'Other'
]

export default function RecurringTransactionForm({ transaction, onSuccess, onCancel }: RecurringTransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const isEditing = !!transaction

  const form = useForm<RecurringTransactionFormData>({
    resolver: zodResolver(recurringTransactionSchema),
    defaultValues: {
      name: transaction?.name || '',
      type: transaction?.type || 'expense',
      amount: transaction?.amount || 0,
      frequency: transaction?.frequency || 'monthly',
      category: transaction?.category || '',
      source: transaction?.source || '',
      description: transaction?.description || '',
      start_date: transaction?.start_date || format(new Date(), 'yyyy-MM-dd'),
      end_date: transaction?.end_date || '',
      max_occurrences: transaction?.max_occurrences || undefined,
      is_active: transaction?.is_active ?? true,
      notes: transaction?.notes || '',
      occurrence_count: transaction?.occurrence_count || 0,
      last_run_date: transaction?.last_run_date || '',
      run_count: transaction?.run_count || 0,
      skip_count: transaction?.skip_count || 0,
      failure_count: transaction?.failure_count || 0,
      last_status: transaction?.last_status || 'pending',
      timezone: transaction?.timezone || 'UTC',
      parent_transaction_id: transaction?.parent_transaction_id || '',
    },
  })

  const watchedType = form.watch('type')
  const watchedFrequency = form.watch('frequency')
  const watchedEndDate = form.watch('end_date')
  const watchedMaxOccurrences = form.watch('max_occurrences')

  const calculateNextDate = (startDate: string, frequency: string): string => {
    if (!startDate) return format(new Date(), 'yyyy-MM-dd')
    
    const date = new Date(startDate)
    if (isNaN(date.getTime())) return format(new Date(), 'yyyy-MM-dd')
    
    try {
      switch (frequency) {
        case 'daily':
          return format(addDays(date, 1), 'yyyy-MM-dd')
        case 'weekly':
          return format(addWeeks(date, 1), 'yyyy-MM-dd')
        case 'biweekly':
          return format(addWeeks(date, 2), 'yyyy-MM-dd')
        case 'monthly':
          return format(addMonths(date, 1), 'yyyy-MM-dd')
        case 'bimonthly':
          return format(addMonths(date, 2), 'yyyy-MM-dd')
        case 'quarterly':
          return format(addMonths(date, 3), 'yyyy-MM-dd')
        case 'yearly':
          return format(addYears(date, 1), 'yyyy-MM-dd')
        default:
          return startDate
      }
    } catch (error) {
      console.error('Error calculating next date:', error)
      return startDate
    }
  }

  const onSubmit = async (data: RecurringTransactionFormData) => {
    setLoading(true)
    try {
      // Get current user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      console.log('🔍 Submitting recurring transaction for userId:', userId)
      
      if (!userId) {
        toast.error('Please log in to create recurring transactions')
        setLoading(false)
        return
      }
      
      // Validate amount
      const amount = Number(data.amount)
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount greater than 0')
        setLoading(false)
        return
      }
      
      // Validate dates
      const startDate = new Date(data.start_date)
      const endDate = data.end_date ? new Date(data.end_date) : null
      
      if (isNaN(startDate.getTime())) {
        toast.error('Please enter a valid start date')
        setLoading(false)
        return
      }
      
      if (endDate && isNaN(endDate.getTime())) {
        toast.error('Please enter a valid end date')
        setLoading(false)
        return
      }
      
      if (endDate && endDate <= startDate) {
        toast.error('End date must be after start date')
        setLoading(false)
        return
      }
      
      // Calculate next date
      const next_date = calculateNextDate(data.start_date, data.frequency)
      
      const submitData: CreateRecurringTransactionData = {
        name: data.name,
        type: data.type,
        amount: amount,
        frequency: data.frequency,
        category: data.category,
        source: data.source,
        description: data.description,
        start_date: data.start_date,
        end_date: data.end_date,
        max_occurrences: data.max_occurrences,
        is_active: data.is_active,
        notes: data.notes,
        next_date,
        user_id: userId, // Explicitly set user ID
        occurrence_count: data.occurrence_count || 0,
        last_run_date: data.last_run_date || null,
        run_count: data.run_count || 0,
        skip_count: data.skip_count || 0,
        failure_count: data.failure_count || 0,
        last_status: data.last_status || 'pending',
        timezone: data.timezone || 'UTC',
        parent_transaction_id: data.parent_transaction_id || null,
      }

      let response
      if (isEditing && transaction) {
        response = await recurringApi.update(transaction.id, submitData)
        if (response.data) {
          toast.success('Recurring transaction updated successfully')
        }
      } else {
        response = await recurringApi.create(submitData)
        if (response.data) {
          toast.success('Recurring transaction created successfully')
        }
      }

      if (response.data && onSuccess) {
        onSuccess(response.data)
      }
    } catch (error: any) {
      const errorMessage = error?.message || (isEditing ? 'Failed to update recurring transaction' : 'Failed to create recurring transaction')
      toast.error(errorMessage)
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Repeat className="h-5 w-5" />
            <span>{isEditing ? 'Edit' : 'Create'} Recurring Transaction</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly Rent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="income">📈 Income</SelectItem>
                          <SelectItem value="expense">📉 Expense</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Amount and Frequency */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-10"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              <div>
                                <div className="font-medium">{freq.label}</div>
                                <div className="text-sm text-muted-foreground">{freq.description}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Category and Source */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(watchedType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map((category) => (
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

                {watchedType === 'income' && (
                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="start_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        First occurrence of this transaction
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="end_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} min={form.getValues('start_date')} />
                      </FormControl>
                      <FormDescription>
                        Leave empty for ongoing transactions
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Max Occurrences */}
              <FormField
                control={form.control}
                name="max_occurrences"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Occurrences (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 12"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Stop after this many occurrences
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional details..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Internal Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Private notes for your reference..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Active Status */}
              <FormField
                control={form.control}
                name="is_active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Enable this recurring transaction
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Advanced Settings */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Advanced Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="occurrence_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Occurrence Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Total expected occurrences
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="run_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Run Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Times this has run
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="skip_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Skip Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Times this was skipped
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="failure_count"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Failure Count</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormDescription>
                          Times this failed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="last_run_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Run Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormDescription>
                          When this last ran
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="failed">Failed</SelectItem>
                            <SelectItem value="skipped">Skipped</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <FormField
                    control={form.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="UTC">UTC</SelectItem>
                            <SelectItem value="Asia/Kolkata">Asia/Kolkata</SelectItem>
                            <SelectItem value="America/New_York">America/New_York</SelectItem>
                            <SelectItem value="Europe/London">Europe/London</SelectItem>
                            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="parent_transaction_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Parent Transaction ID</FormLabel>
                        <FormControl>
                          <Input placeholder="Optional parent ID" {...field} />
                        </FormControl>
                        <FormDescription>
                          Link to parent transaction if applicable
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Preview Information */}
              <Card className="border-dashed">
                <CardContent className="pt-6">
                  <div className="flex items-start space-x-2">
                    <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium text-foreground mb-2">Transaction Preview:</p>
                      <ul className="space-y-1">
                        <li>• Next occurrence: {calculateNextDate(form.getValues('start_date'), watchedFrequency)}</li>
                        <li>• Amount: ${typeof form.getValues('amount') === 'number' ? form.getValues('amount').toFixed(2) : '0.00'} ({watchedType})</li>
                        <li>• Frequency: {FREQUENCIES.find(f => f.value === watchedFrequency)?.label}</li>
                        <li>• Status: {form.getValues('is_active') ? 'Active' : 'Inactive'}</li>
                        <li>• Timezone: {form.getValues('timezone') || 'UTC'}</li>
                        {watchedEndDate && <li>• Ends: {format(new Date(watchedEndDate), 'MMM d, yyyy')}</li>}
                        {form.getValues('max_occurrences') && <li>• Max occurrences: {form.getValues('max_occurrences')}</li>}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-4">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'} Recurring Transaction
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
