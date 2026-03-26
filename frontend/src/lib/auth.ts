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

export interface AuthResponse {
  message: string
  token?: string
}

export interface User {
  id: string
  email: string
  name?: string
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
    const response = await fetch(`${config.baseUrl}/api/login/verify-otp`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'OTP verification failed')
    }

    const result: AuthResponse = await response.json()
    
    // Store JWT token if provided
    if (result.token) {
      this.setToken(result.token, { id: '', email: data.email })
    }
    
    return result
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
}

export const authService = new AuthService()
export default authService
