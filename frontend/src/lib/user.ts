// User API Service for FinSight AI
// Handles user-related API calls

const API_CONFIG = {
  development: {
    baseUrl: 'http://localhost:8000',
    timeout: 10000,
  },
  production: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'https://api.finsight.ai',
    timeout: 15000,
  }
}

const config = API_CONFIG[process.env.NODE_ENV as keyof typeof API_CONFIG] || API_CONFIG.development

import { User, UserUpdateData } from '@/types/user'

class UserService {
  // Get current user token
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('jwt_token')
    }
    return null
  }

  // Get user by ID
  async getUserById(userId: string): Promise<{ data: User; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch user data')
    }

    return await response.json()
  }

  // Update user by ID
  async updateUser(userId: string, userData: UserUpdateData): Promise<{ data: User; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update user data')
    }

    return await response.json()
  }

  // Get all users (admin only)
  async getAllUsers(): Promise<{ data: User[]; status: string }> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to fetch users')
    }

    return await response.json()
  }
}

export const userService = new UserService()
export default userService
