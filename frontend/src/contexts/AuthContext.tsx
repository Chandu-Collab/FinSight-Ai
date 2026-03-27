'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService, User } from '@/lib/auth'
import toast from 'react-hot-toast'

interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  refreshToken: () => Promise<void>
  setAuthState: (token: string, user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const storedToken = localStorage.getItem('jwt_token')
        const storedUser = localStorage.getItem('user_data')

        if (storedToken && storedUser) {
          // Validate token
          const validatedToken = authService.getTokenWithValidation()
          if (validatedToken) {
            setToken(validatedToken)
            setUser(JSON.parse(storedUser))
            console.log('✅ User authenticated from storage')
          } else {
            // Token invalid, clear storage
            localStorage.removeItem('jwt_token')
            localStorage.removeItem('user_data')
            console.log('❌ Invalid token, cleared storage')
          }
        }
      } catch (error) {
        console.error('❌ Auth check error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Log user state changes for debugging (remove in production)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && user) {
      console.log('🔍 User state updated:', {
        id: user.id,
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
        email_verified: user.email_verified,
        isAuthenticated: !!token && !!user
      })
    }
  }, [user, token])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const password_hash = btoa(password) // Use same encoding as login page
      
      // Initiate login with OTP
      await authService.loginInitiate({ email, password_hash })
      toast.success('OTP sent to your email!')
      
      // The actual login completion happens in the OTP verification flow
      return Promise.resolve()
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    authService.logout()
    setUser(null)
    setToken(null)
    toast.success('Logged out successfully')
  }

  const refreshToken = async () => {
    // This would be used to refresh the token if needed
    // For now, just validate the current token
    const validatedToken = authService.getTokenWithValidation()
    if (validatedToken) {
      setToken(validatedToken)
    } else {
      logout()
    }
  }

  const setAuthState = (token: string, user: User) => {
    // Update React state first
    setToken(token)
    setUser(user)
    
    // Then store in localStorage (this prevents hydration issues)
    if (typeof window !== 'undefined') {
      localStorage.setItem('jwt_token', token)
      localStorage.setItem('user_data', JSON.stringify(user))
    }
  }

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
    refreshToken,
    setAuthState,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
