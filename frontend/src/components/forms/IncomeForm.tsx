'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { IndianRupee, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

const incomeSchema = z.object({
  amount: z.string().min(1, 'Amount is required').refine(
    (val) => !isNaN(Number(val)) && Number(val) > 0,
    'Amount must be a positive number'
  ),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
})

type IncomeFormData = z.infer<typeof incomeSchema>

interface IncomeFormProps {
  initialData?: Partial<IncomeFormData>
  onSubmit?: (data: IncomeFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
  title?: string
}

const incomeSources = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental',
  'Gift',
  'Other',
]

export function IncomeForm({ initialData, onSubmit, onCancel, loading, title }: IncomeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<IncomeFormData>({
    resolver: zodResolver(incomeSchema),
    defaultValues: {
      amount: initialData?.amount || '',
      source: initialData?.source || '',
      description: initialData?.description || '',
      date: initialData?.date || new Date().toISOString().split('T')[0],
    },
  })

  const onFormSubmit = async (data: IncomeFormData) => {
    if (onSubmit) {
      await onSubmit(data)
    } else {
      // Default behavior if no onSubmit provided
      try {
        setIsSubmitting(true)
        
        // Mock API call - replace with actual implementation
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        console.log('Income data:', {
          ...data,
          amount: Number(data.amount),
        })
        
        toast.success('Income added successfully!')
        form.reset()
        
      } catch (error) {
        toast.error('Failed to add income')
        console.error('Error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{title || 'Add Income'}</h2>
        <p className="text-gray-600 mt-1">Record your income sources</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="0.00"
                        className="pl-10"
                        {...field}
                        type="number"
                        step="0.01"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        className="pl-10"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="source"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Source</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select income source" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {incomeSources.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
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
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any additional notes..."
                    className="resize-none"
                    rows={3}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel || (() => form.reset())}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? 'Adding...' : 'Add Income'}
            </Button>
          </div>
        </form>
      </Form>
    </Card>
  )
}





