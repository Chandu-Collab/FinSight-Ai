'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { passwordUtils } from '@/lib/password'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await authService.forgotPassword({ email })
      setSubmitted(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          <div className="text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h3 className="mt-4 text-lg font-medium text-foreground">Check your email</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              We've sent a password reset token to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              The token will expire in 1 hour. Check your spam folder if you don't see it.
            </p>
            <div className="mt-6">
              <Link
                href="/auth/reset-password"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Reset your password
              </Link>
            </div>
            <div className="mt-4 text-center">
              <span className="text-sm text-muted-foreground">
                Didn't receive the email?{' '}
                <button
                  onClick={() => setSubmitted(false)}
                  className="font-medium text-primary hover:text-primary/80"
                >
                  Try again
                </button>
              </span>
            </div>
            <div className="mt-4 text-center">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Reset your password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we'll send you a token to reset your password.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
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
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending...' : 'Send reset token'}
            </button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">Or</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
