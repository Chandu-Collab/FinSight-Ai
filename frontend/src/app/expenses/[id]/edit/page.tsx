'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TransactionForm from '@/components/forms/TransactionForm'
import { ExpenseFormData } from '@/lib/validations/transaction'
import toast from 'react-hot-toast'

interface Expense {
  id: string
  amount: number
  category: string
  description?: string
  date: string
  created_at: string
}

export default function EditExpensePage() {
  const [expense, setExpense] = useState<Expense | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchExpense()
  }, [id])

  const fetchExpense = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setExpense({
          ...data,
          date: data.date ? data.date.split('T')[0] : ''
        })
      }
    } catch (error: any) {
      toast.error('Failed to fetch expense record')
      console.error('Error fetching expense:', error)
      router.push('/expenses')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: ExpenseFormData) => {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('expenses')
        .update({
          amount: parseFloat(data.amount),
          category: data.category,
          description: data.description || null,
          date: data.date
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Expense updated successfully!')
      router.push('/expenses')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update expense')
      console.error('Error updating expense:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/expenses')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this expense record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Expense deleted successfully!')
      router.push('/expenses')
    } catch (error: any) {
      toast.error('Failed to delete expense')
      console.error('Error deleting expense:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!expense) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Expense not found</h2>
          <p className="mt-2 text-gray-500">The expense record you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/expenses')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Expenses
          </button>
        </div>
      </div>
    )
  }

  const initialData: Partial<ExpenseFormData> = {
    amount: expense.amount.toString(),
    category: expense.category,
    description: expense.description || '',
    date: expense.date
  }

  return (
    <div>
      <TransactionForm
        type="expense"
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        title="Edit Expense"
      />
      
      {/* Delete Section */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Once you delete an expense record, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete Expense Record
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
