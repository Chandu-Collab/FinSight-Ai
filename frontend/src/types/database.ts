export interface Database {
  public: {
    Tables: {
      income: {
        Row: {
          id: string
          user_id: string
          amount: number
          source: string
          description?: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          source: string
          description?: string
          date: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          source?: string
          description?: string
          date?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          amount: number
          category: string
          description?: string
          date: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          category: string
          description?: string
          date: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          category?: string
          description?: string
          date?: string
        }
      }
      budgets: {
        Row: {
          id: string
          user_id: string
          category: string
          limit: number
          spent: number
          month: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: string
          limit: number
          spent?: number
          month: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: string
          limit?: number
          spent?: number
          month?: string
        }
      }
      goals: {
        Row: {
          id: string
          user_id: string
          title: string
          target_amount: number
          current_amount: number
          deadline?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          target_amount: number
          current_amount?: number
          deadline?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          target_amount?: number
          current_amount?: number
          deadline?: string
        }
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          predicted_amount: number
          month: string
          confidence_score: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          predicted_amount: number
          month: string
          confidence_score: number
        }
        Update: {
          id?: string
          user_id?: string
          predicted_amount?: number
          month?: string
          confidence_score?: number
        }
      }
    }
  }
}

export type Income = Database['public']['Tables']['income']['Row']
export type Expense = Database['public']['Tables']['expenses']['Row']
export type Budget = Database['public']['Tables']['budgets']['Row']
export type Goal = Database['public']['Tables']['goals']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
