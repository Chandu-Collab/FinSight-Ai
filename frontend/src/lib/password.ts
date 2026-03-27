// Password utilities for FinSight AI
// Using bcrypt for secure password hashing

import bcrypt from 'bcryptjs'

export const passwordUtils = {
  // Hash password using bcrypt
  hash: async (password: string): Promise<string> => {
    const saltRounds = 10
    return await bcrypt.hash(password, saltRounds)
  },

  // Compare password with hash
  compare: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
  },

  // For backward compatibility during transition (remove after migration)
  encode: (password: string): string => {
    // This is deprecated - use hash() instead
    console.warn('⚠️ Using deprecated encode() method. Please migrate to hash()')
    return btoa(password)
  },

  // For backward compatibility during transition (remove after migration)
  decode: (encodedPassword: string): string => {
    // This is deprecated - use compare() instead
    console.warn('⚠️ Using deprecated decode() method. Please migrate to compare()')
    try {
      return atob(encodedPassword)
    } catch {
      return ''
    }
  },

  // Basic password validation
  validate: (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = []

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long')
    }

    if (password.length > 128) {
      errors.push('Password must be less than 128 characters long')
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter')
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  },

  // Generate a secure random password (for demo/testing)
  generate: (length: number = 12): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
    let password = ''
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return password
  }
}

export default passwordUtils
