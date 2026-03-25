import { z } from 'zod'

// Income validation schema
export const incomeSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)), 'Amount must be a valid number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => parseFloat(val) <= 999999999, 'Amount is too large'),
  source: z
    .string()
    .min(1, 'Income source is required')
    .max(100, 'Income source must be less than 100 characters')
    .refine((val) => val.trim().length > 0, 'Income source cannot be empty'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime()) && date <= new Date()
    }, 'Date must be a valid date and cannot be in the future')
})

// Expense validation schema
export const expenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)), 'Amount must be a valid number')
    .refine((val) => parseFloat(val) > 0, 'Amount must be greater than 0')
    .refine((val) => parseFloat(val) <= 999999999, 'Amount is too large'),
  category: z
    .string()
    .min(1, 'Category is required')
    .max(50, 'Category must be less than 50 characters')
    .refine((val) => val.trim().length > 0, 'Category cannot be empty'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((val) => {
      const date = new Date(val)
      return !isNaN(date.getTime()) && date <= new Date()
    }, 'Date must be a valid date and cannot be in the future')
})

// Type definitions
export type IncomeFormData = z.infer<typeof incomeSchema>
export type ExpenseFormData = z.infer<typeof expenseSchema>

// Validation error types
export type ValidationError = {
  field: string
  message: string
}

// Common income sources for validation
export const validIncomeSources = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Rental Income',
  'Side Hustle',
  'Gift',
  'Other'
]

// Valid expense categories for validation
export const validExpenseCategories = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Travel',
  'Subscriptions',
  'Other'
]

// Custom validation functions
export const validateIncomeSource = (source: string): boolean => {
  return validIncomeSources.includes(source) || source.trim().length > 0
}

export const validateExpenseCategory = (category: string): boolean => {
  return validExpenseCategories.includes(category)
}

export const validateAmount = (amount: string): boolean => {
  const num = parseFloat(amount)
  return !isNaN(num) && num > 0 && num <= 999999999
}

export const validateDate = (date: string): boolean => {
  const parsedDate = new Date(date)
  return !isNaN(parsedDate.getTime()) && parsedDate <= new Date()
}

// Form field validation messages
export const validationMessages = {
  amount: {
    required: 'Amount is required',
    invalid: 'Amount must be a valid number',
    positive: 'Amount must be greater than 0',
    tooLarge: 'Amount is too large'
  },
  source: {
    required: 'Income source is required',
    tooLong: 'Income source must be less than 100 characters',
    empty: 'Income source cannot be empty'
  },
  category: {
    required: 'Category is required',
    tooLong: 'Category must be less than 50 characters',
    empty: 'Category cannot be empty',
    invalid: 'Please select a valid category'
  },
  description: {
    tooLong: 'Description must be less than 500 characters'
  },
  date: {
    required: 'Date is required',
    invalid: 'Date must be a valid date',
    future: 'Date cannot be in the future'
  }
}
