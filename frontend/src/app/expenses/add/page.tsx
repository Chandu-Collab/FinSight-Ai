'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { expenseApi } from '@/lib/api/production'
import toast from 'react-hot-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Calendar, CreditCard, Tag, FileText, Repeat, X } from 'lucide-react'
import Link from 'next/link'

const expenseCategories = [
  'Food', 'Transportation', 'Shopping', 'Entertainment', 
  'Bills & Utilities', 'Healthcare', 'Education', 'Travel',
  'Subscriptions', 'Other'
]

const paymentMethods = [
  'Credit Card', 'Debit Card', 'Cash', 'Bank Transfer',
  'Digital Wallet', 'Check', 'Other'
]

const statuses = [
  'pending', 'cleared', 'declined'
]

export default function AddExpensePage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payment_method: '',
    merchant: '',
    receipt_url: '',
    recurring: false,
    tags: '',
    status: 'pending',
    notes: ''
  })
  const router = useRouter()

  useEffect(() => {
    setShowModal(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      if (!userId) {
        toast.error('Please log in to add expense')
        return
      }
      
      await expenseApi.create({
        user_id: userId,
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description || undefined,
        date: formData.date,
        payment_method: formData.payment_method || undefined,
        merchant: formData.merchant || undefined,
        receipt_url: formData.receipt_url || undefined,
        recurring: formData.recurring,
        tags: formData.tags || undefined,
        status: formData.status || 'pending',
        notes: formData.notes || undefined
      })

      toast.success('Expense added successfully!')
      router.push('/expenses')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add expense')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    setShowModal(false)
    setTimeout(() => router.push('/expenses'), 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Add Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Add New Expense</h2>
              <Button variant="ghost" size="sm" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Amount *</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input type="number" step="0.01" required value={formData.amount} 
                        onChange={(e) => handleChange('amount', e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        placeholder="0.00" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input type="date" required value={formData.date} 
                        onChange={(e) => handleChange('date', e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category *</label>
                    <select required value={formData.category} onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      <option value="">Select category</option>
                      {expenseCategories.map((category) => <option key={category} value={category}>{category}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <select value={formData.payment_method} onChange={(e) => handleChange('payment_method', e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                        <option value="">Select payment method</option>
                        {paymentMethods.map((method) => <option key={method} value={method}>{method}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Merchant</label>
                    <input type="text" value={formData.merchant} onChange={(e) => handleChange('merchant', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                      placeholder="e.g., Walmart, Amazon" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      {statuses.map((status) => <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Receipt URL</label>
                    <input type="url" value={formData.receipt_url} onChange={(e) => handleChange('receipt_url', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                      placeholder="https://example.com/receipt.jpg" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="checkbox" id="recurring" checked={formData.recurring} 
                      onChange={(e) => handleChange('recurring', e.target.checked)}
                      className="w-4 h-4 text-primary border-input rounded focus:ring-primary" />
                    <label htmlFor="recurring" className="flex items-center text-sm font-medium text-foreground">
                      <Repeat className="h-4 w-4 mr-1" />
                      Recurring Expense
                    </label>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tags</label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input type="text" value={formData.tags} onChange={(e) => handleChange('tags', e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        placeholder="e.g., dinner,weekend" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={3}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                    placeholder="Brief description of expense" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Notes</label>
                  <div className="relative">
                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={3}
                      className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                      placeholder="Additional notes or details" />
                  </div>
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={handleClose} className="border-border hover:bg-accent">Cancel</Button>
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105">
                    {loading ? 'Adding...' : 'Add Expense'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </div>
        </div>
      )}
    </div>
  )
}
