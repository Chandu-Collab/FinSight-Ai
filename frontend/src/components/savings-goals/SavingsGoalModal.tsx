'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, DollarSign, Calendar, Target, FileText, Upload } from 'lucide-react'
import { format } from 'date-fns'
import { SavingsGoal } from '@/lib/api/savings-goals'
import { useAuth } from '@/contexts/AuthContext'

interface SavingsGoalModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (goalData: any) => Promise<void>
  editingGoal?: SavingsGoal | null
  isLoading?: boolean
}

const goalCategories = [
  'Emergency Fund',
  'Vacation',
  'Home Purchase',
  'Education',
  'Retirement',
  'Vehicle',
  'Wedding',
  'Investment',
  'Health',
  'Travel',
  'Other'
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'cancelled', label: 'Cancelled' }
]

const priorityOptions = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' }
]

export function SavingsGoalModal({ isOpen, onClose, onSubmit, editingGoal, isLoading }: SavingsGoalModalProps) {
  const { user } = useAuth()
  const [formData, setFormData] = useState({
    user_id: user?.id || 'demo-user-001',
    name: '',
    category: '',
    target_amount: '',
    current_amount: '',
    target_date: '',
    description: '',
    status: 'active',
    priority: 'medium',
    image_url: '',
    notes: '',
    recurring_contribution: '',
    last_contribution_date: '',
    is_public: false,
    motivation: ''
  })

  useEffect(() => {
    if (editingGoal) {
      setFormData({
        user_id: editingGoal.user_id || user?.id || 'demo-user-001',
        name: editingGoal.name || '',
        category: editingGoal.category || '',
        target_amount: editingGoal.target_amount?.toString() || '',
        current_amount: editingGoal.current_amount?.toString() || '',
        target_date: editingGoal.target_date || '',
        description: editingGoal.description || '',
        status: editingGoal.status || 'active',
        priority: editingGoal.priority || 'medium',
        image_url: editingGoal.image_url || '',
        notes: editingGoal.notes || '',
        recurring_contribution: editingGoal.recurring_contribution?.toString() || '',
        last_contribution_date: editingGoal.last_contribution_date || '',
        is_public: editingGoal.is_public || false,
        motivation: editingGoal.motivation || ''
      })
    } else {
      // Reset form for new goal
      setFormData({
        user_id: user?.id || 'demo-user-001',
        name: '',
        category: '',
        target_amount: '',
        current_amount: '',
        target_date: '',
        description: '',
        status: 'active',
        priority: 'medium',
        image_url: '',
        notes: '',
        recurring_contribution: '',
        last_contribution_date: '',
        is_public: false,
        motivation: ''
      })
    }
  }, [editingGoal, user, isOpen])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const submitData = {
      ...formData,
      target_amount: parseFloat(formData.target_amount) || 0,
      current_amount: parseFloat(formData.current_amount) || 0,
      recurring_contribution: parseFloat(formData.recurring_contribution) || undefined,
      progress_percentage: formData.target_amount && formData.current_amount 
        ? (parseFloat(formData.current_amount) / parseFloat(formData.target_amount)) * 100 
        : 0
    }

    await onSubmit(submitData)
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card/95 backdrop-blur-sm border-2 border-border/50 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            {editingGoal ? 'Edit Savings Goal' : 'Create New Savings Goal'}
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Target className="h-5 w-5 mr-2 text-emerald-600" />
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Goal Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Vacation Fund"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {goalCategories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your savings goal..."
                  rows={3}
                />
              </div>
            </div>

            {/* Financial Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
                Financial Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_amount">Target Amount *</Label>
                  <Input
                    id="target_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.target_amount}
                    onChange={(e) => handleInputChange('target_amount', e.target.value)}
                    placeholder="2000.00"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="current_amount">Current Amount</Label>
                  <Input
                    id="current_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.current_amount}
                    onChange={(e) => handleInputChange('current_amount', e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="recurring_contribution">Monthly Contribution</Label>
                <Input
                  id="recurring_contribution"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.recurring_contribution}
                  onChange={(e) => handleInputChange('recurring_contribution', e.target.value)}
                  placeholder="100.00"
                />
              </div>
            </div>

            {/* Timeline */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-emerald-600" />
                Timeline
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="target_date">Target Date *</Label>
                  <Input
                    id="target_date"
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => handleInputChange('target_date', e.target.value)}
                    min={format(new Date(), 'yyyy-MM-dd')}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="last_contribution_date">Last Contribution Date</Label>
                  <Input
                    id="last_contribution_date"
                    type="date"
                    value={formData.last_contribution_date}
                    onChange={(e) => handleInputChange('last_contribution_date', e.target.value)}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
            </div>

            {/* Status and Priority */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Status & Priority
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Additional Details
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="motivation">Motivation</Label>
                <Textarea
                  id="motivation"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  placeholder="What motivates you to achieve this goal?"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Additional notes or reminders..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => handleInputChange('is_public', checked)}
                />
                <Label htmlFor="is_public">Make this goal public</Label>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : (editingGoal ? 'Update Goal' : 'Create Goal')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
