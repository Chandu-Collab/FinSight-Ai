'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { passwordUtils } from '@/lib/password'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email || !token || !password) {
      toast.error('All fields are required')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    // Validate password
    const passwordValidation = passwordUtils.validate(password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors.join(', '))
      return
    }

    setLoading(true)

    try {
      // Hash the password using the same utility as registration
      const passwordHash = passwordUtils.encode(password)
      
      await authService.resetPassword({
        email,
        token,
        new_password_hash: passwordHash
      })

      toast.success('Password reset successfully!')
      router.push('/auth/login')
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">Set new password</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email, reset token, and new password below.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleResetPassword}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email Address
            </label>
            <div className="mt-1">
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div>
            <label htmlFor="token" className="block text-sm font-medium text-foreground">
              Reset Token
            </label>
            <div className="mt-1">
              <input
                id="token"
                name="token"
                type="text"
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter the reset token from your email"
              />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Check your email for the 43-character reset token
            </p>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="mt-1">
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter your new password (min. 6 characters)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <div className="mt-1">
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Confirm your new password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Resetting...' : 'Reset password'}
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

          <div className="mt-6 space-y-2 text-center">
            <Link href="/auth/forgot-password" className="block text-sm text-primary hover:text-primary/80">
              Request new reset token
            </Link>
            <Link href="/auth/login" className="block text-sm text-muted-foreground hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
