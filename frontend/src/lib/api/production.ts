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
  
  // Get JWT token from localStorage with validation
  const token = typeof window !== 'undefined' && typeof localStorage !== 'undefined' 
    ? localStorage.getItem('jwt_token') 
    : null
  
  // Debug token presence
  if (token) {
    console.log(`🔐 API Request: ${endpoint} - Token present: ${token.substring(0, 20)}...`)
  } else {
    console.log(`🔓 API Request: ${endpoint} - No token`)
  }
  
  for (let attempt = 0; attempt < config.retries; attempt++) {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), config.timeout)
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'FinSight-AI-Frontend/1.0',
        ...options.headers as Record<string, string>,
      }
      
      // Add Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        ...options,
      })
      
      clearTimeout(timeoutId)
      
      // Handle 401 Unauthorized (token expired/invalid)
      if (response.status === 401) {
        console.warn('🚫 401 Unauthorized - Clearing invalid token')
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          localStorage.removeItem('jwt_token')
          localStorage.removeItem('user_data')
        }
        throw new Error('Authentication required. Please login again.')
      }
      
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

// Authentication API
export const authApi = {
  // Register new user
  register: (data: {
    email: string
    password_hash: string
    name?: string
    phone_number?: string
    date_of_birth?: string
    gender?: string
  }) =>
    apiRequest<{ message: string }>('/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Verify email OTP
  verifyEmail: (data: { email: string; otp: string }) =>
    apiRequest<{ message: string }>('/users/verify-email', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Login initiate (send OTP)
  loginInitiate: (data: { email: string; password_hash: string }) =>
    apiRequest<{ message: string }>('/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Login verify OTP
  loginVerifyOtp: (data: { email: string; otp: string }) =>
    apiRequest<{ message: string; token: string; user?: { id: string; email: string; name?: string } }>('/login/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Protected endpoint test
  protected: () =>
    apiRequest<{ message: string }>('/protected', { method: 'GET' }),
}

// ==================== INCOME API ====================

export interface Income {
  id: string
  user_id: string
  amount: number
  source: string
  description?: string
  frequency?: string
  date: string
  currency?: string
  status?: string
  category?: string
  recurring_id?: string
  tax_deducted?: number
  attachment_url?: string
  created_at?: string
  updated_at?: string
}

export interface CreateIncomeData {
  user_id?: string
  amount: number
  source: string
  description?: string
  frequency?: string
  date: string
  currency?: string
  status?: string
  category?: string
  recurring_id?: string
  tax_deducted?: number
  attachment_url?: string
}

export const incomeApi = {
  // Get all income records
  getAll: (userId?: string) => 
    apiRequest<Income[]>(`/income${userId ? `?user_id=${userId}` : ''}`),

  // Get income by ID
  getById: (id: string) =>
    apiRequest<Income>(`/income/${id}`, { method: 'GET' }),

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
  payment_method?: string
  merchant?: string
  receipt_url?: string
  recurring?: boolean
  tags?: string
  status?: string
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface CreateExpenseData {
  user_id?: string
  amount: number
  category: string
  description?: string
  date: string
  payment_method?: string
  merchant?: string
  receipt_url?: string
  recurring?: boolean
  tags?: string
  status?: string
  notes?: string
}

export const expenseApi = {
  // Get all expense records
  getAll: (userId?: string) => 
    apiRequest<Expense[]>(`/expenses${userId ? `?user_id=${userId}` : ''}`),

  // Get expense by ID
  getById: (id: string) =>
    apiRequest<Expense>(`/expenses/${id}`, { method: 'GET' }),

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
  description?: string
  is_active?: boolean
  rollover?: boolean
  spent?: number
  created_at?: string
  updated_at?: string
}

export interface CreateBudgetData {
  user_id?: string
  name: string
  category: string
  amount: number
  month: string
  alert_threshold?: number
  description?: string
  is_active?: boolean
  rollover?: boolean
  spent?: number
}

export const budgetApi = {
  // Get all budgets
  getAll: (userId?: string, month?: string) => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId)
    if (month) params.append('month', month)
    return apiRequest<Budget[]>(`/budgets?${params.toString()}`)
  },

  // Get budget by ID
  getById: (id: string) =>
    apiRequest<Budget>(`/budgets/${id}`, { method: 'GET' }),

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
  description?: string
  status?: string
  priority?: string
  progress_percentage?: number
  image_url?: string
  notes?: string
  recurring_contribution?: number
  last_contribution_date?: string
  is_public?: boolean
  completion_date?: string
  motivation?: string
  created_at?: string
  updated_at?: string
}

export interface CreateSavingsGoalData {
  user_id?: string
  name: string
  category: string
  target_amount: number
  current_amount?: number
  target_date: string
  description?: string
  status?: string
  priority?: string
  progress_percentage?: number
  image_url?: string
  notes?: string
  recurring_contribution?: number
  last_contribution_date?: string
  is_public?: boolean
  completion_date?: string
  motivation?: string
}

export const savingsApi = {
  // Get all savings goals
  getAll: (userId?: string) => 
    apiRequest<SavingsGoal[]>(`/savings-goals${userId ? `?user_id=${userId}` : ''}`),

  // Get savings goal by ID
  getById: (id: string) =>
    apiRequest<SavingsGoal>(`/savings-goals/${id}`, { method: 'GET' }),

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
  source?: string
  is_active: boolean
  next_date?: string
  start_date?: string
  end_date?: string
  occurrence_count?: number
  description?: string
  last_run_date?: string
  run_count?: number
  max_occurrences?: number
  skip_count?: number
  failure_count?: number
  last_status?: string
  notes?: string
  timezone?: string
  parent_transaction_id?: string
  created_at?: string
  updated_at?: string
}

export interface CreateRecurringTransactionData {
  user_id?: string
  name: string
  type: 'income' | 'expense'
  amount: number
  frequency: string
  category?: string
  source?: string
  is_active?: boolean
  next_date?: string
  start_date?: string
  end_date?: string
  occurrence_count?: number
  description?: string
  last_run_date?: string
  run_count?: number
  max_occurrences?: number
  skip_count?: number
  failure_count?: number
  last_status?: string
  notes?: string
  timezone?: string
  parent_transaction_id?: string
}

export const recurringApi = {
  // Get all recurring transactions
  getAll: (userId?: string) => 
    apiRequest<RecurringTransaction[]>(`/recurring-transactions${userId ? `?user_id=${userId}` : ''}`),

  // Get recurring transaction by ID
  getById: (id: string) =>
    apiRequest<RecurringTransaction>(`/recurring-transactions/${id}`, { method: 'GET' }),

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
  is_acknowledged: boolean
  action_url?: string
  priority?: string
  expires_at?: string
  icon?: string
  channel?: string
  related_entity_id?: string
  scheduled_at?: string
  delivered_at?: string
  sender_id?: string
  group_id?: string
  created_at?: string
  updated_at?: string
}

export const notificationApi = {
  // Get all notifications
  getAll: (userId?: string) => 
    apiRequest<Notification[]>(`/notifications${userId ? `?user_id=${userId}` : ''}`),

  // Get notification by ID
  getById: (id: string) =>
    apiRequest<Notification>(`/notifications/${id}`, { method: 'GET' }),

  // Create new notification
  create: (data: Partial<Notification>) =>
    apiRequest<Notification>('/notifications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Update notification (mark as read/unread)
  update: (id: string, data: Partial<Notification>) =>
    apiRequest<Notification>(`/notifications/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Mark notification as seen
  markSeen: (id: string) =>
    apiRequest<Notification>(`/notifications/${id}/seen`, {
      method: 'PATCH',
    }),

  // Delete notification
  delete: (id: string) =>
    apiRequest(`/notifications/${id}`, {
      method: 'DELETE',
    }),
}

// ==================== TRANSACTIONS API ====================

export interface Transaction {
  id: string
  user_id: string
  amount: number
  type: 'income' | 'expense'
  source?: string
  category?: string
  description?: string
  date: string
  created_at?: string
  updated_at?: string
}

export const transactionApi = {
  // Get all transactions (income + expenses)
  getAll: (userId?: string) => 
    apiRequest<Transaction[]>(`/transactions${userId ? `?user_id=${userId}` : ''}`),

  // Create new transaction (auto-detect type)
  create: (data: {
    type: 'income' | 'expense'
    [key: string]: any
  }) =>
    apiRequest<Transaction>('/transactions', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ==================== REPORTS API ====================

export interface Report {
  id: string
  user_id: string
  report_type: string
  date_range: string
  format: string
  generated_at: string
  data: any
  status: string
  file_url?: string
  error_message?: string
  requested_at?: string
  completed_at?: string
  name?: string
  description?: string
  is_public?: boolean
  template_id?: string
  tags?: string
  created_at?: string
}

export const reportApi = {
  // Get all reports
  getAll: (userId?: string) => 
    apiRequest<Report[]>(`/reports${userId ? `?user_id=${userId}` : ''}`),

  // Get report by ID
  getById: (id: string) =>
    apiRequest<Report>(`/reports/${id}`, { method: 'GET' }),

  // Generate new report
  generate: (data: {
    user_id?: string
    report_type?: string
    date_range?: { start: string; end: string }
    format?: string
    name?: string
    description?: string
  }) =>
    apiRequest<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
}

// ==================== DASHBOARD API ====================

export interface DashboardSummary {
  total_income: number
  total_expenses: number
  net_income: number
  total_savings: number
  total_budget: number
  recent_transactions: Transaction[]
  budget_alerts: Array<{
    budget_name: string
    category: string
    spent: number
    budget: number
    utilization: number
    alert_threshold: number
  }>
  savings_progress: Array<{
    goal_name: string
    target_amount: number
    current_amount: number
    progress: number
    days_remaining: number
  }>
  income_count: number
  expense_count: number
  budget_count: number
  savings_goals_count: number
  recurring_count: number
  unread_notifications: number
  user_id: string
  month: string
}

export const dashboardApi = {
  // Get dashboard summary
  getSummary: (userId?: string, month?: string) => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId)
    if (month) params.append('month', month)
    return apiRequest<DashboardSummary>(`/dashboard?${params.toString()}`)
  },
}

// ==================== ANALYTICS API ====================

export interface AnalyticsSummary {
  monthly_income: Record<string, number>
  monthly_expenses: Record<string, number>
  category_breakdown: Record<string, number>
  source_breakdown: Record<string, number>
  budget_breakdown: Record<string, number>
  total_income: number
  total_expenses: number
  transaction_count: number
}

export const analyticsApi = {
  // Get analytics summary
  getSummary: (userId?: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId)
    if (startDate) params.append('start_date', startDate)
    if (endDate) params.append('end_date', endDate)
    return apiRequest<AnalyticsSummary>(`/analytics/summary?${params.toString()}`)
  },
}

// ==================== ML API ====================

export interface ExpenseData {
  amount: number
  category: string
  date: string
  description?: string
}

export interface PredictionRequest {
  target_month?: string
}

export interface PredictionResponse {
  prediction: {
    id: string
    user_id: string
    predicted_value: number
    month: string
    prediction_type: string
    confidence_score?: number
    status: string
    created_at: string
  }
  enhanced_prediction?: {
    predictions?: Array<{
      category: string
      predicted_amount: number
      month: string
    }>
    total_predicted?: number
    month?: string
    prediction_type?: string
    confidence_score?: number
  }
  status: string
}

export interface InsightsResponse {
  insights: string[]
  total_expenses: number
  average_expense: number
  category_breakdown: Record<string, number>
  transaction_count: number
  monthly_trend: Record<string, number>
  status: string
}

export interface TrainingResponse {
  mae: number
  mse: number
  r2: number
  status: string
  message: string
  features_used: string[]
  training_samples: number
}

export interface HealthResponse {
  status: string
  service: string
  version: string
  data_counts: {
    users: number
    income: number
    expenses: number
    budgets: number
    savings_goals: number
    recurring_transactions: number
    notifications: number
    transactions: number
    reports: number
  }
}

export const mlApi = {
  // Health check
  health: () => apiRequest<HealthResponse>('/health', { method: 'GET' }),

  // Train ML model
  trainModel: () =>
    apiRequest<TrainingResponse>('/train-model', {
      method: 'POST',
    }),

  // Linear regression prediction
  predictLinear: (data: {
    features?: number[]
    prediction_type?: string
    category?: string
    target_date?: string
    month?: string
    model_version?: string
    notes?: string
  }) =>
    apiRequest<{ prediction: any; status: string }>('/predict/linear', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Gemini AI insights
  getGeminiInsights: (data: any) =>
    apiRequest<{ insights: any; status: string }>('/insights/gemini', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Enhanced expense prediction
  predict: (data: PredictionRequest) =>
    apiRequest<PredictionResponse>('/predict', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Generate insights (local ML)
  insights: (data: { expenses?: ExpenseData[] }) =>
    apiRequest<InsightsResponse>('/insights', {
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
    transactions: number
    reports: number
  }
  user_id: string
}

export interface Category {
  id: string
  name: string
  type: string
}

export interface IncomeSource {
  id: string
  name: string
}

export const utilityApi = {
  // Get data status
  getDataStatus: (userId?: string) => 
    apiRequest<DataStatus>(`/data-status${userId ? `?user_id=${userId}` : ''}`),

  // Clear all data (for testing)
  clearAllData: () =>
    apiRequest('/clear-data', { method: 'DELETE' }),

  // Get categories
  getCategories: () =>
    apiRequest<Category[]>('/categories', { method: 'GET' }),

  // Get income sources
  getIncomeSources: () =>
    apiRequest<IncomeSource[]>('/income-sources', { method: 'GET' }),

  // Export data
  exportData: (userId?: string) => {
    const params = new URLSearchParams()
    if (userId) params.append('user_id', userId)
    return apiRequest<any>(`/export/data?${params.toString()}`)
  },
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
  authApi,
  incomeApi,
  expenseApi,
  budgetApi,
  savingsApi,
  recurringApi,
  notificationApi,
  transactionApi,
  reportApi,
  dashboardApi,
  analyticsApi,
  mlApi,
  utilityApi,
  handleApiCall,
  isApiAvailable,
  getApiConfig,
}
