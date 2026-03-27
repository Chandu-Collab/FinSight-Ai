'use client'

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBudget } from "@/lib/api/budgets";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AppLayout } from '@/components/layout/AppLayout'
import { ArrowLeft, Target, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { getCurrentUserId, isAuthenticated, setupDemoUser } from '@/lib/utils/user'

export default function CreateBudgetPage() {
  const [form, setForm] = useState({
    user_id: "", // Will be set dynamically
    name: "",
    category: "",
    amount: "",
    month: format(new Date(), 'yyyy-MM'),
    alert_threshold: "80",
    description: "",
    is_active: true,
    rollover: false,
    spent: "0",
  });
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Check authentication and get user ID
  useEffect(() => {
    if (!isAuthenticated()) {
      // For development, set up demo user automatically
      setupDemoUser();
      toast.success('Demo user set up for development');
    }
    
    const userId = getCurrentUserId();
    setForm(prev => ({ ...prev, user_id: userId }));
  }, [router]);

  const expenseCategories = [
    'Food & Dining',
    'Transportation',
    'Shopping',
    'Entertainment',
    'Bills & Utilities',
    'Healthcare',
    'Education',
    'Travel',
    'Subscriptions',
    'Other'
  ];

  const categoryIcons: Record<string, string> = {
    'Food & Dining': '🍔',
    'Transportation': '🚗',
    'Shopping': '🛍',
    'Entertainment': '🎬',
    'Bills & Utilities': '📄',
    'Healthcare': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Subscriptions': '📱',
    'Other': '📌'
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createBudget({
        user_id: form.user_id,
        name: form.name,
        category: form.category,
        amount: Number(form.amount),
        month: form.month,
        alert_threshold: Number(form.alert_threshold),
        description: form.description,
        is_active: form.is_active,
        rollover: form.rollover,
        spent: Number(form.spent),
      });
      toast.success('Budget created successfully!');
      router.push("/budgets");
    } catch (err: any) {
      toast.error(err.message || "Failed to create budget");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
        {/* Header */}
        <header className="bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-4">
                <Link href="/budgets">
                  <Button variant="outline" size="sm" className="flex items-center space-x-2">
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Budgets</span>
                  </Button>
                </Link>
                <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-amber-600 rounded-xl flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                    Create New Budget
                  </h1>
                  <p className="text-sm text-muted-foreground">Set up a new budget to track your spending</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <Card className="bg-card/80 backdrop-blur-sm border-2 border-border/50 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="h-5 w-5" />
                  <span>Budget Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Budget Name */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Budget Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={form.name}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                      placeholder="e.g., Monthly Groceries"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-foreground mb-2">
                      Category *
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      value={form.category}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                    >
                      <option value="">Select a category...</option>
                      {expenseCategories.map((category) => (
                        <option key={category} value={category}>
                          {categoryIcons[category]} {category}
                        </option>
                      ))}
                    </select>
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Quick select:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {expenseCategories.map((category) => (
                          <button
                            key={category}
                            type="button"
                            onClick={() => setForm(prev => ({ ...prev, category }))}
                            className={`p-2 text-xs rounded-lg transition-colors flex flex-col items-center ${
                              form.category === category
                                ? 'bg-primary/20 text-primary border border-primary/30'
                                : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                            }`}
                          >
                            <span className="text-lg">{categoryIcons[category]}</span>
                            <span>{category}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Amount */}
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-foreground mb-2">
                      Budget Amount *
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="amount"
                        name="amount"
                        step="0.01"
                        min="0"
                        required
                        value={form.amount}
                        onChange={handleChange}
                        className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Month */}
                  <div>
                    <label htmlFor="month" className="block text-sm font-medium text-foreground mb-2">
                      Budget Period *
                    </label>
                    <div className="mt-1">
                      <input
                        type="month"
                        id="month"
                        name="month"
                        required
                        value={form.month}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                        min="2020-01"
                        max="2030-12"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Select the month and year for this budget period
                    </p>
                  </div>

                  {/* Alert Threshold */}
                  <div>
                    <label htmlFor="alert_threshold" className="block text-sm font-medium text-foreground mb-2">
                      Alert Threshold
                    </label>
                    <select
                      id="alert_threshold"
                      name="alert_threshold"
                      value={form.alert_threshold}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                    >
                      <option value="50">50% - Early Warning</option>
                      <option value="75">75% - Warning</option>
                      <option value="80">80% - Standard Warning</option>
                      <option value="90">90% - Critical Warning</option>
                      <option value="95">95% - Urgent Alert</option>
                    </select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Send alerts when spending reaches this percentage of the budget
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-foreground mb-2">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      value={form.description}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-input rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                      placeholder="Optional description for this budget..."
                    />
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-3">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        name="is_active"
                        type="checkbox"
                        checked={form.is_active}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Active Budget</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        name="rollover"
                        type="checkbox"
                        checked={form.rollover}
                        onChange={handleChange}
                        className="w-4 h-4 text-primary border-input rounded focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Rollover Unused Amount</span>
                    </label>
                  </div>

                  {/* Initial Spent (optional) */}
                  <div>
                    <label htmlFor="spent" className="block text-sm font-medium text-foreground mb-2">
                      Initial Spent Amount
                    </label>
                    <div className="relative rounded-xl shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-muted-foreground sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        id="spent"
                        name="spent"
                        step="0.01"
                        min="0"
                        value={form.spent}
                        onChange={handleChange}
                        className="block w-full pl-8 pr-12 py-3 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-card/50 backdrop-blur-sm"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      If you've already spent money on this category, enter the amount here
                    </p>
                  </div>

                  {/* Form Actions */}
                  <div className="flex justify-end space-x-3 pt-6 border-t border-border/50">
                    <Link href="/budgets">
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </Link>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg transform transition-all duration-200 hover:scale-105"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Budget
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}
