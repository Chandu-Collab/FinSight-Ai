'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TransactionForm from '@/components/forms/TransactionForm'
import { IncomeFormData } from '@/lib/validations/transaction'
import toast from 'react-hot-toast'

interface Income {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at: string
}

export default function EditIncomePage() {
  const [income, setIncome] = useState<Income | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  useEffect(() => {
    fetchIncome()
  }, [id])

  const fetchIncome = async () => {
    try {
      const { data, error } = await supabase
        .from('income')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error

      if (data) {
        setIncome({
          ...data,
          date: data.date ? data.date.split('T')[0] : ''
        })
      }
    } catch (error: any) {
      toast.error('Failed to fetch income record')
      console.error('Error fetching income:', error)
      router.push('/income')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: IncomeFormData) => {
    setSaving(true)

    try {
      const { error } = await supabase
        .from('income')
        .update({
          amount: parseFloat(data.amount),
          source: data.source,
          description: data.description || null,
          date: data.date
        })
        .eq('id', id)

      if (error) throw error

      toast.success('Income updated successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update income')
      console.error('Error updating income:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/income')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this income record?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('income')
        .delete()
        .eq('id', id)

      if (error) throw error

      toast.success('Income deleted successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error('Failed to delete income')
      console.error('Error deleting income:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!income) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Income not found</h2>
          <p className="mt-2 text-gray-500">The income record you're looking for doesn't exist.</p>
          <button
            onClick={() => router.push('/income')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Income
          </button>
        </div>
      </div>
    )
  }

  const initialData: Partial<IncomeFormData> = {
    amount: income.amount.toString(),
    source: income.source,
    description: income.description || '',
    date: income.date
  }

  return (
    <div>
      <TransactionForm
        type="income"
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={saving}
        title="Edit Income"
      />
      
      {/* Delete Section */}
      <div className="max-w-2xl mx-auto mt-6">
        <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
          <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Once you delete an income record, there is no going back. Please be certain.
            </p>
            <button
              onClick={handleDelete}
              className="px-4 py-2 border border-red-300 text-red-600 rounded-md hover:bg-red-50 transition-colors"
            >
              Delete Income Record
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
