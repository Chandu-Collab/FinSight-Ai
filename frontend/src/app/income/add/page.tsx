'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TransactionForm from '@/components/forms/TransactionForm'
import { IncomeFormData } from '@/lib/validations/transaction'
import toast from 'react-hot-toast'

export default function AddIncomePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: IncomeFormData) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('income')
        .insert({
          amount: parseFloat(data.amount),
          source: data.source,
          description: data.description || null,
          date: data.date
        })

      if (error) throw error

      toast.success('Income added successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add income')
      console.error('Error adding income:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/income')
  }

  return (
    <TransactionForm
      type="income"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      title="Add Income"
    />
  )
}
