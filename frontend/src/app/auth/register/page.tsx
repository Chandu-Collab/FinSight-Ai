'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { authService } from '@/lib/auth'
import { passwordUtils } from '@/lib/password'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('')
  const [gender, setGender] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    // Validate password
    const passwordValidation = passwordUtils.validate(password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0] || 'Invalid password')
      setLoading(false)
      return
    }

    // Validate required fields
    if (!fullName || !phoneNumber || !dateOfBirth || !gender) {
      toast.error('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      // Send password as plain text (backend will handle hashing)
      const password_hash = password
      
      // Initiate registration with OTP
      const result = await authService.register({ 
        email, 
        password_hash, 
        name: fullName,
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth,
        gender: gender
      })
      
      toast.success('Registration initiated! Please check your email for OTP.')
      
      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?email=${encodeURIComponent(email)}&type=register`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-foreground">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We'll send a verification code to your email
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleRegister}>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-foreground">
              Full Name
            </label>
            <div className="mt-1">
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter your full name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-foreground">
              Phone Number
            </label>
            <div className="mt-1">
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
                placeholder="Enter your phone number"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-foreground">
              Date of Birth
            </label>
            <div className="mt-1">
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
              />
            </div>
          </div>

          <div>
            <label htmlFor="gender" className="block text-sm font-medium text-foreground">
              Gender
            </label>
            <div className="mt-1">
              <select
                id="gender"
                name="gender"
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="appearance-none block w-full px-3 py-2 border border-input rounded-md placeholder-muted-foreground text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary sm:text-sm bg-background"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

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
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
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
                placeholder="Create a password (min. 6 characters)"
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground">
              Confirm Password
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
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending OTP...' : 'Send OTP'}
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
            <span className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-primary hover:text-primary/80">
                Sign in
              </Link>
            </span>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-xs text-muted-foreground text-center">
            By creating an account, you agree to our{' '}
            <a href="#" className="text-primary hover:text-primary/80">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary hover:text-primary/80">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
