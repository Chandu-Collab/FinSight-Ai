'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [isNavigating, setIsNavigating] = useState(false)
  const [email, setEmail] = useState('')
  const [type, setType] = useState('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setAuthState } = useAuth()
  
  // Get URL parameters on client side only
  useEffect(() => {
    const emailParam = searchParams.get('email') || ''
    const typeParam = searchParams.get('type') || 'login'
    
    setEmail(emailParam)
    setType(typeParam)
  }, [searchParams])

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)

    try {
      let result
      
      if (type === 'register') {
        // Complete registration
        result = await authService.verifyEmail({ email, otp })
        toast.success('Registration successful! Redirecting to login...')
        
        // Auto-login after successful registration
        setTimeout(() => {
          router.push(`/auth/login?email=${encodeURIComponent(email)}&autoLogin=true`)
        }, 1500)
        
      } else {
        // Login OTP verification
        result = await authService.loginVerifyOtp({ email, otp })
        console.log('🔍 OTP Verification Result:', result)
        console.log('🔍 Result token:', result.token)
        console.log('🔍 Result user:', result.user)
        console.log('🔍 Result keys:', Object.keys(result))
        
        // Only proceed if backend provides real user data - no fallbacks
        if (result.token && result.user) {
          toast.success('Login successful! Redirecting to dashboard...')
          
          // Use AuthContext to properly set auth state with real API data
          setAuthState(result.token, result.user)
          console.log('🔍 Auth state set via AuthContext with real API data')
          
          // Set navigation state to prevent hydration issues
          setIsNavigating(true)
          
          // Navigate using Next.js router for proper state management
          setTimeout(() => {
            console.log('🔍 Navigating to dashboard...')
            router.push('/') // Use Next.js router instead of direct navigation
          }, 1500) // Reduced delay since we're using proper state management
        } else {
          console.error('❌ No token or user data from API:', result)
          console.error('❌ Available keys:', Object.keys(result))
          toast.error('Invalid response from server. Please try again.')
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'OTP verification failed')
    } finally {
      setLoading(false)
    }
  }

  const handleResendOtp = async () => {
    setLoading(true)
    
    try {
      if (type === 'register') {
        // For registration, we need to show a message that user needs to re-register
        toast.error('Please go back and complete registration again to resend OTP')
      } else {
        // For login, we would need the password hash
        toast.error('Please go back to login page to resend OTP')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      {/* Navigation loading overlay */}
      {isNavigating && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-lg shadow-lg border border-border">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-foreground font-medium">Redirecting to dashboard...</p>
              <p className="text-sm text-muted-foreground">Please wait while we set up your session</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {type === 'register' 
              ? 'Complete your registration by entering the OTP sent to your email'
              : 'Enter the OTP sent to your email to complete login'
            }
          </p>
          <p className="mt-1 text-sm font-medium text-primary">
            {email}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleVerifyOtp}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-foreground">
              One-Time Password (OTP)
            </label>
            <div className="mt-1">
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                pattern="[0-9]{6}"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm text-center text-lg tracking-widest bg-background"
                placeholder="000000"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm text-primary hover:text-primary/80 disabled:opacity-50"
            >
              Didn't receive the code? Resend OTP
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to {type === 'register' ? 'Registration' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
