'use client'

import React from 'react'

interface TransactionFormProps {
  type: 'income' | 'expense'
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
}

export default function TransactionForm({ type, onSubmit, onCancel }: TransactionFormProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900">
          {type === 'income' ? 'Add Income' : 'Add Expense'}
        </h1>
        <div className="mt-8">
          <p>Transaction form placeholder - build working</p>
          <button onClick={onCancel} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
