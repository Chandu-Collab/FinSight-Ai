'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import TransactionForm from '@/components/forms/TransactionForm'
import { ExpenseFormData } from '@/lib/validations/transaction'
import toast from 'react-hot-toast'

export default function AddExpensePage() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (data: ExpenseFormData) => {
    setLoading(true)

    try {
      const { error } = await supabase
        .from('expenses')
        .insert({
          amount: parseFloat(data.amount),
          category: data.category,
          description: data.description || null,
          date: data.date
        })

      if (error) throw error

      toast.success('Expense added successfully!')
      router.push('/expenses')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add expense')
      console.error('Error adding expense:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/expenses')
  }

  return (
    <TransactionForm
      type="expense"
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      loading={loading}
      title="Add Expense"
    />
  )
}
