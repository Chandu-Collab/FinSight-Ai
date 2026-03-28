const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export interface SavingsGoal {
  id?: string
  user_id?: string
  name: string
  category: string
  target_amount: number
  current_amount: number
  target_date: string
  description?: string
  status: string
  priority: string
  progress_percentage?: number
  image_url?: string
  notes?: string
  recurring_contribution?: number
  last_contribution_date?: string
  is_public: boolean
  completion_date?: string
  motivation?: string
  created_at?: string
  updated_at?: string
}

class SavingsGoalsAPI {
  private getAuthHeaders() {
    // Try to get token from both possible storage keys
    const token = localStorage.getItem('jwt_token') || localStorage.getItem('auth_token')
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    }
  }

  async getAllSavingsGoals(userId: string = 'demo-user-001'): Promise<{ data: SavingsGoal[], status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goals?user_id=${userId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Convert string amounts to numbers for consistency
      if (result.data && Array.isArray(result.data)) {
        result.data = result.data.map((goal: any) => ({
          ...goal,
          current_amount: typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount) || 0 : goal.current_amount,
          target_amount: typeof goal.target_amount === 'string' ? parseFloat(goal.target_amount) || 0 : goal.target_amount,
          recurring_contribution: goal.recurring_contribution ? (typeof goal.recurring_contribution === 'string' ? parseFloat(goal.recurring_contribution) || 0 : goal.recurring_contribution) : undefined,
        }))
      }
      
      return result
    } catch (error) {
      console.error('Error fetching savings goals:', error)
      throw error
    }
  }

  async getSavingsGoalById(goalId: string): Promise<{ data: SavingsGoal, status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goals/${goalId}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const result = await response.json()
      
      // Convert string amounts to numbers for consistency
      if (result.data) {
        result.data = {
          ...result.data,
          current_amount: typeof result.data.current_amount === 'string' ? parseFloat(result.data.current_amount) || 0 : result.data.current_amount,
          target_amount: typeof result.data.target_amount === 'string' ? parseFloat(result.data.target_amount) || 0 : result.data.target_amount,
          recurring_contribution: result.data.recurring_contribution ? (typeof result.data.recurring_contribution === 'string' ? parseFloat(result.data.recurring_contribution) || 0 : result.data.recurring_contribution) : undefined,
        }
      }
      
      return result
    } catch (error) {
      console.error('Error fetching savings goal:', error)
      throw error
    }
  }

  async createSavingsGoal(goalData: Omit<SavingsGoal, 'id' | 'created_at' | 'updated_at'>): Promise<{ data: SavingsGoal, status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(goalData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error creating savings goal:', error)
      throw error
    }
  }

  async updateSavingsGoal(goalId: string, goalData: Partial<SavingsGoal>): Promise<{ data: SavingsGoal, status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goals/${goalId}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(goalData),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error updating savings goal:', error)
      throw error
    }
  }

  async deleteSavingsGoal(goalId: string): Promise<{ status: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/savings-goals/${goalId}`, {
        method: 'DELETE',
        headers: this.getAuthHeaders(),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      return await response.json()
    } catch (error) {
      console.error('Error deleting savings goal:', error)
      throw error
    }
  }
}

export const savingsGoalsAPI = new SavingsGoalsAPI()
