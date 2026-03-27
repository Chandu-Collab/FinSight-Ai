// Authentication Service for FinSight AI
// Handles OTP-based authentication with JWT tokens

// API Configuration - same as production.ts
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

export interface RegisterData {
  email: string
  password_hash: string
  name?: string
  phone_number?: string
  date_of_birth?: string
  gender?: string
}

export interface LoginCredentials {
  email: string
  password_hash: string
}

export interface VerifyOtpData {
  email: string
  otp: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  email: string
  token: string
  new_password_hash: string
}

export interface AuthResponse {
  message: string
  token?: string
  user?: User
}

export interface User {
  id: string
  email: string
  name?: string
  profile_picture?: string
  phone_number?: string
  address?: string
  date_of_birth?: string
  gender?: string
  status?: string
  role?: string
  preferences?: any
  last_login?: string
  email_verified?: boolean
  two_factor_enabled?: boolean
  bio?: string
  created_at?: string
  updated_at?: string
}

class AuthService {
  private tokenKey = 'jwt_token'
  private userKey = 'user_data'

  // Register user (initiates OTP verification)
  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${config.baseUrl}/api/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Registration failed')
    }

    return await response.json()
  }

  // Verify email OTP and complete registration
  async verifyEmail(data: VerifyOtpData): Promise<AuthResponse> {
    const response = await fetch(`${config.baseUrl}/api/users/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Email verification failed')
    }

    return await response.json()
  }

  // Login initiate (sends OTP)
  async loginInitiate(credentials: LoginCredentials): Promise<AuthResponse> {
    console.log('🔍 authService.loginInitiate Debug:')
    console.log('  Credentials:', credentials)
    console.log('  API URL:', `${config.baseUrl}/api/login`)
    
    const response = await fetch(`${config.baseUrl}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    })

    console.log('🔍 Response Status:', response.status)
    console.log('🔍 Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Login Response Error:', error)
      throw new Error(error.error || 'Login failed')
    }

    const result = await response.json()
    console.log('✅ Login Response Success:', result)
    return result
  }

  // Login verify OTP and get JWT token
  async loginVerifyOtp(data: VerifyOtpData): Promise<AuthResponse> {
    console.log('🔍 authService.loginVerifyOtp Debug:')
    console.log('  Data:', data)
    console.log('  API URL:', `${config.baseUrl}/api/login/verify-otp`)
    
    const response = await fetch(`${config.baseUrl}/api/login/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    console.log('🔍 Response Status:', response.status)
    console.log('🔍 Response Headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error Response:', error)
      throw new Error(error.error || 'OTP verification failed')
    }

    const result: AuthResponse = await response.json()
    console.log('🔍 Response Body:', result)
    
    // Store JWT token and user data if provided
    if (result.token && result.user) {
      // Only proceed if real user data is provided by API
      this.setToken(result.token, result.user)
      console.log('✅ Token and real user data stored successfully:', { 
        token: result.token.substring(0, 20) + '...', 
        user: {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name
        }
      })
      
      // Return the complete result with user data
      return result
    } else {
      console.error('❌ No token or user data in response:', result)
      throw new Error('Invalid response from server: missing token or user data')
    }
  }

  // Logout user
  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
    }
  }

  // Get current token
  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.tokenKey)
    }
    return null
  }

  // Get current user
  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.userKey)
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Set token manually (useful for social login, etc.)
  setToken(token: string, user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token)
      localStorage.setItem(this.userKey, JSON.stringify(user))
      console.log('✅ Token stored successfully', { token: token.substring(0, 20) + '...', user })
    }
  }

  // Get token with validation
  getTokenWithValidation(): string | null {
    const token = this.getToken()
    if (token) {
      try {
        // Basic JWT validation (check if it has 3 parts)
        const parts = token.split('.')
        if (parts.length !== 3) {
          console.warn('⚠️ Invalid JWT format')
          this.logout()
          return null
        }
        
        // Check if token is expired (basic check)
        const payload = JSON.parse(atob(parts[1]))
        const now = Math.floor(Date.now() / 1000)
        if (payload.exp && payload.exp < now) {
          console.warn('⚠️ Token expired')
          this.logout()
          return null
        }
        
        return token
      } catch (error) {
        console.error('❌ Token validation error:', error)
        this.logout()
        return null
      }
    }
    return null
  }

  // Test protected endpoint
  async testProtected(): Promise<any> {
    const token = this.getToken()
    if (!token) {
      throw new Error('No authentication token found')
    }

    const response = await fetch(`${config.baseUrl}/api/protected`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Authentication failed')
    }

    return await response.json()
  }

  // Forgot password - send reset token to email
  async forgotPassword(data: ForgotPasswordData): Promise<any> {
    console.log('🔍 authService.forgotPassword Debug:')
    console.log('  Email:', data.email)
    console.log('  API URL:', `${config.baseUrl}/api/forgot-password`)
    
    const response = await fetch(`${config.baseUrl}/api/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    console.log('🔍 Response Status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Forgot Password Response Error:', error)
      throw new Error(error.error || 'Failed to send reset email')
    }

    const result = await response.json()
    console.log('✅ Forgot Password Response Success:', result)
    return result
  }

  // Reset password - use token to set new password
  async resetPassword(data: ResetPasswordData): Promise<any> {
    console.log('🔍 authService.resetPassword Debug:')
    console.log('  Email:', data.email)
    console.log('  Token:', data.token)
    console.log('  API URL:', `${config.baseUrl}/api/reset-password`)
    
    const response = await fetch(`${config.baseUrl}/api/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    console.log('🔍 Response Status:', response.status)

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Reset Password Response Error:', error)
      throw new Error(error.error || 'Failed to reset password')
    }

    const result = await response.json()
    console.log('✅ Reset Password Response Success:', result)
    return result
  }
}

export const authService = new AuthService()
export default authService
