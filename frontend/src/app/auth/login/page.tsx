'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { authService } from '@/lib/auth'
import { passwordUtils } from '@/lib/password'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [autoLogin, setAutoLogin] = useState(false)
  const [prefilledEmail, setPrefilledEmail] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Check if user is coming from successful registration (client-side only)
  useEffect(() => {
    const autoLoginParam = searchParams.get('autoLogin') === 'true'
    const emailParam = searchParams.get('email') || ''
    
    setAutoLogin(autoLoginParam)
    setPrefilledEmail(emailParam)
    
    // Auto-fill email if coming from registration
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [searchParams])

  // Auto-login for newly registered users (they need to enter password)
  const handleAutoLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      toast.error('Please enter your password to complete login')
      return
    }
    handleLogin(e)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Hash password (in production, use proper hashing)
      const password_hash = passwordUtils.encode(password)
      
      console.log('🔍 Login Debug Info:')
      console.log('  Email:', email)
      console.log('  Password:', password)
      console.log('  Password Hash:', password_hash)
      console.log('  API URL:', `http://localhost:8000/api/login`)
      
      // Initiate login with OTP
      const result = await authService.loginInitiate({ email, password_hash })
      
      console.log('✅ Login Response:', result)
      toast.success('OTP sent to your email!')
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&type=login`)
    } catch (error: any) {
      console.error('❌ Login Error:', error)
      toast.error(error.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {autoLogin ? 'Complete Your Registration' : 'Sign in to your account'}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {autoLogin 
              ? 'Enter your password to complete login and access your dashboard'
              : 'We\'ll send a verification code to your email'
            }
          </p>
          {autoLogin && (
            <p className="mt-1 text-sm font-medium text-green-600">
              ✓ Registration successful! Just enter your password below
            </p>
          )}
        </div>

        <form className="space-y-6" onSubmit={autoLogin ? handleAutoLogin : handleLogin}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={autoLogin}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            {!autoLogin && (
              <div className="text-sm">
                <Link href="/auth/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Forgot your password?
                </Link>
              </div>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || (autoLogin && !password)}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (autoLogin ? 'Logging in...' : 'Sending OTP...') 
                : (autoLogin ? 'Complete Login' : 'Send OTP')
              }
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Sign up
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
