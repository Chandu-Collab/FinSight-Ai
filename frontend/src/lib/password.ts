// Password utilities for FinSight AI
// NOTE: This is a simple implementation for demo purposes
// In production, use proper password hashing libraries like bcrypt, scrypt, or Argon2

export const passwordUtils = {
  // Simple encoding for demo (NOT SECURE for production)
  encode: (password: string): string => {
    return btoa(password)
  },

  // Simple decoding for demo (NOT SECURE for production)
  decode: (encodedPassword: string): string => {
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
