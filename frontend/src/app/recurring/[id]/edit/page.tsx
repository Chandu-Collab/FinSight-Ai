'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import RecurringTransactionForm from '@/components/forms/RecurringTransactionForm'
import { recurringApi, type RecurringTransaction } from '@/lib/api/production'
import { AppLayout } from '@/components/layout/AppLayout'
import toast from 'react-hot-toast'

export default function EditRecurringPage() {
  const router = useRouter()
  const params = useParams()
  const [transaction, setTransaction] = useState<RecurringTransaction | null>(null)
  const [loading, setLoading] = useState(true)
  const id = params.id as string

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        // Get current user ID from localStorage
        const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
        const userId = userData ? JSON.parse(userData).id : null
        
        console.log('🔍 Fetching recurring transaction for userId:', userId)
        console.log('🔍 Transaction ID:', id)
        
        if (!userId) {
          console.warn('⚠️ No user ID found - user might not be logged in')
          toast.error('Please log in to view recurring transactions')
          router.push('/recurring')
          return
        }
        
        // Call GET by ID endpoint to load existing data
        const response = await recurringApi.getById(id)
        console.log('📊 GET by ID Response:', response)
        
        if (response.data) {
          // Verify the transaction belongs to the current user
          if (response.data.user_id && response.data.user_id !== userId) {
            toast.error('Access denied: This transaction does not belong to you')
            router.push('/recurring')
            return
          }
          
          console.log('✅ Transaction loaded successfully:', response.data)
          setTransaction(response.data)
        } else {
          toast.error('Recurring transaction not found')
          router.push('/recurring')
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to fetch recurring transaction'
        toast.error(errorMessage)
        console.error('❌ Error fetching transaction:', error)
        router.push('/recurring')
      } finally {
        setLoading(false)
      }
    }

    if (id) {
      fetchTransaction()
    }
  }, [id, router])

  const handleSuccess = async (updatedTransaction: RecurringTransaction) => {
    try {
      console.log('🔄 Updating transaction with data:', updatedTransaction)
      
      // Call PUT endpoint to update the transaction
      const response = await recurringApi.update(id, updatedTransaction)
      console.log('📊 PUT Response:', response)
      
      if (response.data) {
        toast.success('Recurring transaction updated successfully!')
        router.push('/recurring')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update recurring transaction'
      toast.error(errorMessage)
      console.error('❌ Error updating transaction:', error)
    }
  }

  const handleCancel = () => {
    router.push('/recurring')
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this recurring transaction?')) {
      return
    }

    try {
      console.log('🗑️ Deleting transaction with ID:', id)
      
      // Call DELETE endpoint to remove the transaction
      const response = await recurringApi.delete(id)
      console.log('📊 DELETE Response:', response)
      
      if (response.status === 'success' || response.data) {
        toast.success('Recurring transaction deleted successfully!')
        router.push('/recurring')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete recurring transaction'
      toast.error(errorMessage)
      console.error('❌ Error deleting transaction:', error)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground font-medium">Loading transaction...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  if (!transaction) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Transaction Not Found</h2>
            <p className="text-muted-foreground mb-4">The recurring transaction you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/recurring')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Back to Recurring Transactions
            </button>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/recurring')}
            className="text-muted-foreground hover:text-foreground mb-4 flex items-center space-x-2"
          >
            ← Back to Recurring Transactions
          </button>
        </div>
        
        <RecurringTransactionForm
          transaction={transaction}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
        
        <div className="mt-6 flex justify-center">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90"
          >
            Delete Transaction
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
