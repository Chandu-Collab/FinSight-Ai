'use client'

import { useRouter } from 'next/navigation'
import RecurringTransactionForm from '@/components/forms/RecurringTransactionForm'
import { AppLayout } from '@/components/layout/AppLayout'
import { type RecurringTransaction } from '@/lib/api/production'
import toast from 'react-hot-toast'

export default function CreateRecurringPage() {
  const router = useRouter()

  const handleSuccess = (transaction: RecurringTransaction) => {
    toast.success('Recurring transaction created successfully!')
    router.push('/recurring')
  }

  const handleCancel = () => {
    router.push('/recurring')
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <RecurringTransactionForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </AppLayout>
  )
}
