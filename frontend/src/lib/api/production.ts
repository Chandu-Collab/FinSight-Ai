// Production Backend API Service for FinSight AI
// This service connects to the production Flask backend

// API Configuration
const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8000/api',
    timeout: 10000,
    retries: 3
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.finsight.ai/api',
    timeout: 15000,
    retries: 2
  }
}

const config = API_CONFIG[process.env.NODE_ENV as keyof typeof API_CONFIG] || API_CONFIG.development

export interface ApiResponse<T = any> {
  data?: T
  status: string
  error?: string
}

// Generic API request helper with retry logic
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${config.baseUrl}${endpoint}`
  let lastError: Error
  
  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FinSight-AI-Frontend/1.0',
          ...options.headers,
        },
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }
      
      return data
    } catch (error) {
      lastError = error as Error
      console.warn(`API request failed (attempt ${attempt + 1}/${config.retries}):`, error.message)
      
      if (attempt < config.retries - 1) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000))
      }
    }
  }
  
  throw lastError!
}

// ==================== INCOME API ====================

export interface Income {
  id: string
  user_id: string
  amount: number
  source: string
  description?: string
  date: string
  created_at?: string
}

export interface CreateIncomeData {
  user_id?: string
  amount: number
  source: string
  description?: string
  date: string
}

export const incomeApi = {
  // Get all income records
  getAll: (userId?: string) => 
    apiRequest<Income[]>(`/income${userId ? `?user_id=${userId}` : ''}`),

  // Create new income
  create: (data: CreateIncomeData) =>
    apiRequest<Income>('/income', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update income
  update: (id: string, data: Partial<Income>) =>
    apiRequest<Income>(`/income/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete income
  delete: (id: string) =>
    apiRequest(`/income/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== EXPENSES API ====================

export interface Expense {
  id: string
  user_id: string
  amount: number
  category: string
  description?: string
  date: string
  created_at?: string
}

export interface CreateExpenseData {
  user_id?: string
  amount: number
  category: string
  description?: string
  date: string
}

export const expenseApi = {
  // Get all expense records
  getAll: (userId?: string) => 
    apiRequest<Expense[]>(`/expenses${userId ? `?user_id=${userId}` : ''}`),

  // Create new expense
  create: (data: CreateExpenseData) =>
    apiRequest<Expense>('/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update expense
  update: (id: string, data: Partial<Expense>) =>
    apiRequest<Expense>(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete expense
  delete: (id: string) =>
    apiRequest(`/expenses/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== BUDGETS API ====================

export interface Budget {
  id: string
  user_id: string
  name: string
  category: string
  amount: number
  month: string
  alert_threshold: number
  created_at?: string
}

export interface CreateBudgetData {
  user_id?: string
  name: string
  category: string
  amount: number
  month: string
  alert_threshold?: number
}

export const budgetApi = {
  // Get all budgets
  getAll: (userId?: string, month?: string) => 
    apiRequest<Budget[]>(`/budgets?user_id=${userId || 'demo-user-001'}&month=${month || '2024-03'}`),

  // Create new budget
  create: (data: CreateBudgetData) =>
    apiRequest<Budget>('/budgets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update budget
  update: (id: string, data: Partial<Budget>) =>
    apiRequest<Budget>(`/budgets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete budget
  delete: (id: string) =>
    apiRequest(`/budgets/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== SAVINGS GOALS API ====================

export interface SavingsGoal {
  id: string
  user_id: string
  name: string
  category: string
  target_amount: number
  current_amount: number
  target_date: string
  created_at?: string
}

export interface CreateSavingsGoalData {
  user_id?: string
  name: string
  category: string
  target_amount: number
  current_amount?: number
  target_date: string
}

export const savingsApi = {
  // Get all savings goals
  getAll: (userId?: string) => 
    apiRequest<SavingsGoal[]>(`/savings-goals${userId ? `?user_id=${userId}` : ''}`),

  // Create new savings goal
  create: (data: CreateSavingsGoalData) =>
    apiRequest<SavingsGoal>('/savings-goals', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update savings goal
  update: (id: string, data: Partial<SavingsGoal>) =>
    apiRequest<SavingsGoal>(`/savings-goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete savings goal
  delete: (id: string) =>
    apiRequest(`/savings-goals/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== RECURRING TRANSACTIONS API ====================

export interface RecurringTransaction {
  id: string
  user_id: string
  name: string
  type: 'income' | 'expense'
  amount: number
  frequency: string
  category?: string
  is_active: boolean
  next_date?: string
  created_at?: string
}

export interface CreateRecurringTransactionData {
  user_id?: string
  name: string
  type: 'income' | 'expense'
  amount: number
  frequency: string
  category?: string
  is_active?: boolean
  next_date?: string
}

export const recurringApi = {
  // Get all recurring transactions
  getAll: (userId?: string) => 
    apiRequest<RecurringTransaction[]>(`/recurring-transactions${userId ? `?user_id=${userId}` : ''}`),

  // Create new recurring transaction
  create: (data: CreateRecurringTransactionData) =>
    apiRequest<RecurringTransaction>('/recurring-transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update recurring transaction
  update: (id: string, data: Partial<RecurringTransaction>) =>
    apiRequest<RecurringTransaction>(`/recurring-transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete recurring transaction
  delete: (id: string) =>
    apiRequest(`/recurring-transactions/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== NOTIFICATIONS API ====================

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  is_read: boolean
}

export const notificationApi = {
  // Get all notifications
  getAll: (userId?: string) => 
    apiRequest<Notification[]>(`/notifications${userId ? `?user_id=${userId}` : ''}`),

  // Update notification (mark as read/unread)
  update: (id: string, data: Partial<Notification>) =>
    apiRequest<Notification>(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Delete notification
  delete: (id: string) =>
    apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== DASHBOARD API ====================

export interface DashboardSummary {
  total_income: number
  total_expenses: number
  net_income: number
  total_savings: number
  total_budget: number
  recent_transactions: (Income | Expense)[]
  budget_alerts: Array<{
    budget_name: string
    category: string
    spent: number
    budget: number
    utilization: number
    alert_threshold: number
  }>
  income_count: number
  expense_count: number
  budget_count: number
  savings_goals_count: number
}

export const dashboardApi = {
  // Get dashboard summary
  getSummary: (userId?: string, month?: string) => 
    apiRequest<DashboardSummary>(`/dashboard/summary?user_id=${userId || 'demo-user-001'}&month=${month || '2024-03'}`),
}

// ==================== ML API ====================

export interface ExpenseData {
  amount: number
  category: string
  date: string
  description?: string
}

export interface PredictionRequest {
  expenses: ExpenseData[]
  target_month: string
}

export interface PredictionResponse {
  predictions: Array<{
    category: string
    predicted_amount: number
    month: string
  }>
  total_predicted: number
  month: string
  status: string
}

export interface InsightsResponse {
  insights: string[]
  total_expenses: number
  average_expense: number
  category_breakdown: Record<string, number>
  status: string
}

export interface TrainingResponse {
  mae: number
  mse: number
  r2: number
  status: string
}

export const mlApi = {
  // Health check
  health: () => apiRequest('/health', { method: 'GET' }),

  // Predict expenses
  predict: (data: PredictionRequest) =>
    apiRequest<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate insights
  insights: (data: { expenses: ExpenseData[] }) =>
    apiRequest<InsightsResponse>('/insights', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Train model
  train: (data: { expenses: ExpenseData[] }) =>
    apiRequest<TrainingResponse>('/train', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ==================== UTILITY API ====================

export interface DataStatus {
  status: string
  data_counts: {
    income: number
    expenses: number
    budgets: number
    savings_goals: number
    recurring_transactions: number
    notifications: number
  }
  user_id: string
}

export const utilityApi = {
  // Get data status
  getDataStatus: (userId?: string) => 
    apiRequest<DataStatus>(`/data-status${userId ? `?user_id=${userId}` : ''}`),

  // Clear all data (for testing)
  clearAllData: () =>
    apiRequest('/clear-data', { method: 'DELETE' }),
}

// ==================== UTILITY FUNCTIONS ====================

// Error handling wrapper with toast notifications
export async function handleApiCall<T>(
  apiCall: () => Promise<T>,
  options?: {
    successMessage?: string
    errorMessage?: string
    onError?: (error: Error) => void
  }
): Promise<T | null> {
  try {
    const result = await apiCall()
    if (options?.successMessage) {
      // You can add toast notifications here
      console.log(options.successMessage)
    }
    return result
  } catch (error) {
    console.error('API call failed:', error)
    if (options?.onError) {
      options.onError(error as Error)
    }
    if (options?.errorMessage) {
      // You can add toast notifications here
      console.error(options.errorMessage)
    }
    return null
  }
}

// Check if API is available
export async function isApiAvailable(): Promise<boolean> {
  try {
    await mlApi.health()
    return true
  } catch {
    return false
  }
}

// Get API configuration
export function getApiConfig() {
  return config
}

// Export all APIs as a single object
export default {
  incomeApi,
  expenseApi,
  budgetApi,
  savingsApi,
  recurringApi,
  notificationApi,
  dashboardApi,
  mlApi,
  utilityApi,
  handleApiCall,
  isApiAvailable,
  getApiConfig,
}
