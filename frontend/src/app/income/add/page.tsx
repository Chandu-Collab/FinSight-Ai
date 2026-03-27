'use client'

import { useState, useEffect } from 'react'
import { incomeApi } from '@/lib/api/production'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DollarSign, Calendar, X } from 'lucide-react'
import Link from 'next/link'

const incomeSources = [
  'Salary', 'Freelance', 'Business', 'Investments',
  'Rentals', 'Dividends', 'Side Hustle', 'Gifts', 'Refunds', 'Other'
]

export default function AddIncomePage() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    amount: '', source: '', description: '', date: new Date().toISOString().split('T')[0],
    category: '', currency: 'USD', status: 'confirmed', frequency: '', tax_deducted: ''
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
        toast.error('Please log in to add income')
        return
      }
      
      await incomeApi.create({
        user_id: userId, amount: parseFloat(formData.amount), source: formData.source,
        description: formData.description || undefined, date: formData.date,
        category: formData.category || undefined, currency: formData.currency || 'USD',
        status: formData.status || 'confirmed', frequency: formData.frequency || undefined,
        tax_deducted: formData.tax_deducted ? parseFloat(formData.tax_deducted) : undefined
      })

      toast.success('Income added successfully!')
      router.push('/income')
    } catch (error: any) {
      toast.error(error.message || 'Failed to add income')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleClose = () => {
    router.push('/income')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
      {/* Add Income Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Add New Income</h2>
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
                    <label className="block text-sm font-medium text-foreground mb-2">Source *</label>
                    <select required value={formData.source} onChange={(e) => handleChange('source', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      <option value="">Select source</option>
                      {incomeSources.map((source) => <option key={source} value={source}>{source}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                    <input type="text" value={formData.category} onChange={(e) => handleChange('category', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                      placeholder="e.g., Job, Business" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Currency</label>
                    <select value={formData.currency} onChange={(e) => handleChange('currency', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="GBP">GBP (£)</option>
                      <option value="RUPEE">RUPEE (₹)</option>
                      <option value="JPY">JPY (¥)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Status</label>
                    <select value={formData.status} onChange={(e) => handleChange('status', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      <option value="confirmed">Confirmed</option>
                      <option value="pending">Pending</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Frequency</label>
                    <select value={formData.frequency} onChange={(e) => handleChange('frequency', e.target.value)}
                      className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background">
                      <option value="">One-time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Tax Deducted</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <input type="number" step="0.01" value={formData.tax_deducted} 
                        onChange={(e) => handleChange('tax_deducted', e.target.value)}
                        className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background"
                        placeholder="0.00" />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                  <textarea value={formData.description} onChange={(e) => handleChange('description', e.target.value)} rows={4}
                    className="w-full px-4 py-3 border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-background resize-none"
                    placeholder="Add any additional notes..." />
                </div>
                <div className="flex justify-end space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={handleClose} className="border-border hover:bg-accent">Cancel</Button>
                  <Button type="submit" disabled={loading} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105">
                    {loading ? 'Adding...' : 'Add Income'}
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
