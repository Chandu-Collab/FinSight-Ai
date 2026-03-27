// User types matching the backend API response
export interface User {
  id: string
  email: string
  name?: string
  profile_picture?: string
  phone_number?: string
  address?: string
  date_of_birth?: string
  gender?: string
  status?: string
  role?: string
  preferences?: any
  last_login?: string
  email_verified?: boolean
  two_factor_enabled?: boolean
  bio?: string
  created_at?: string
  updated_at?: string
}

export interface UserUpdateData {
  name?: string
  profile_picture?: string
  phone_number?: string
  address?: string
  date_of_birth?: string
  gender?: string
  status?: string
  role?: string
  preferences?: any
  last_login?: string
  email_verified?: boolean
  two_factor_enabled?: boolean
  bio?: string
}
