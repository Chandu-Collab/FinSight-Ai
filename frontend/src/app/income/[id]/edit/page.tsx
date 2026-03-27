'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { incomeApi, Income } from '@/lib/api/production'
import { IncomeForm } from '@/components/forms/IncomeForm'
import { IncomeFormData } from '@/lib/validations/transaction'
import toast from 'react-hot-toast'

interface IncomeData {
  id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at: string
}

export default function EditIncomePage() {
  const [income, setIncome] = useState<IncomeData | null>(null)
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
      const response = await incomeApi.getById(id)
      
      if (response.data) {
        setIncome({
          id: response.data.id,
          amount: response.data.amount,
          source: response.data.source,
          description: response.data.description,
          date: response.data.date ? response.data.date.split('T')[0] : '',
          created_at: response.data.created_at || response.data.date
        })
      } else {
        toast.error('Income record not found')
        router.push('/income')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch income record')
      console.error('Error fetching income:', error)
      router.push('/income')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: IncomeFormData) => {
    setSaving(true)

    try {
      const response = await incomeApi.update(id, {
        amount: parseFloat(data.amount),
        source: data.source,
        description: data.description || undefined,
        date: data.date
      })

      if (response.data) {
        toast.success('Income updated successfully!')
        router.push('/income')
      }
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
      await incomeApi.delete(id)
      toast.success('Income deleted successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete income')
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <IncomeForm
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
    </div>
  )
}
