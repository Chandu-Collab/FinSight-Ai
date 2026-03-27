// Report type definitions for FinSight AI

export interface Report {
  id: string
  user_id: string
  report_type: 'monthly' | 'quarterly' | 'yearly' | 'custom'
  date_range: {
    start: string
    end: string
  }
  format: string
  generated_at: string
  data: {
    income: any[]
    expenses: any[]
    budgets: any[]
    savings_goals: any[]
    total_income: number
    total_expenses: number
    net_income: number
    budget_count: number
    savings_count: number
  }
  status: string
  file_url?: string
  error_message?: string
  requested_at: string
  completed_at?: string
  name: string
  description?: string
  is_public: boolean
  template_id?: string
  tags?: string
  created_at: string
}

export interface ReportGenerateData {
  report_type: 'monthly' | 'quarterly' | 'yearly'
  date_range?: {
    start: string
    end: string
  }
  format?: string
  name?: string
  description?: string
}
