'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/lib/auth'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

export default function VerifyOtpPage() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [type, setType] = useState('login')
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  
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
        if (result.token) {
          toast.success('Login successful!')
          
          // The AuthContext will automatically detect the token change
          // and update the user state
          setTimeout(() => {
            router.push('/')
            router.refresh()
          }, 500)
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
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Verify Your Email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {type === 'register' 
              ? 'Complete your registration by entering the OTP sent to your email'
              : 'Enter the OTP sent to your email to complete login'
            }
          </p>
          <p className="mt-1 text-sm font-medium text-blue-600">
            {email}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleVerifyOtp}>
          <div>
            <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
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
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-lg tracking-widest"
                placeholder="000000"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Enter the 6-digit code sent to your email
            </p>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-500 disabled:opacity-50"
            >
              Didn't receive the code? Resend OTP
            </button>
          </div>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-gray-600 hover:text-gray-500"
          >
            ← Back to {type === 'register' ? 'Registration' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  )
}
