'use client'

import { useState, useCallback } from 'react'
import toast from 'react-hot-toast'

interface ErrorState {
  hasError: boolean
  error: Error | string | null
  errorInfo: any
}

interface UseErrorHandlerReturn {
  errorState: ErrorState
  handleError: (error: Error | string, errorInfo?: any) => void
  clearError: () => void
  retry: () => void
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

export function useErrorHandler(): UseErrorHandlerReturn {
  const [errorState, setErrorState] = useState<ErrorState>({
    hasError: false,
    error: null,
    errorInfo: null
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleError = useCallback((error: Error | string, errorInfo?: any) => {
    console.error('Error handled by useErrorHandler:', error, errorInfo)
    
    setErrorState({
      hasError: true,
      error,
      errorInfo
    })

    // Show toast notification for user feedback
    const errorMessage = typeof error === 'string' ? error : error.message
    toast.error(errorMessage || 'An error occurred')

    // Log error details for debugging
    if (typeof window !== 'undefined') {
      console.error('Error details:', {
        message: errorMessage,
        stack: typeof error === 'object' ? error.stack : undefined,
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }
  }, [])

  const clearError = useCallback(() => {
    setErrorState({
      hasError: false,
      error: null,
      errorInfo: null
    })
  }, [])

  const retry = useCallback(() => {
    clearError()
    setIsLoading(true)
  }, [clearError])

  return {
    errorState,
    handleError,
    clearError,
    retry,
    isLoading,
    setIsLoading
  }
}

// Hook for async operations with error handling
interface UseAsyncOperationOptions<T> {
  onSuccess?: (data: T) => void
  onError?: (error: Error | string) => void
  onComplete?: () => void
}

interface UseAsyncOperationReturn<T> {
  execute: (operation: () => Promise<T>) => Promise<T | null>
  data: T | null
  isLoading: boolean
  error: Error | string | null
  reset: () => void
}

export function useAsyncOperation<T = any>(options?: UseAsyncOperationOptions<T>): UseAsyncOperationReturn<T> {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | string | null>(null)

  const execute = useCallback(async (operation: () => Promise<T>): Promise<T | null> => {
    try {
      setIsLoading(true)
      setError(null)
      
      const result = await operation()
      setData(result)
      
      if (options?.onSuccess) {
        options.onSuccess(result)
      }
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      
      if (options?.onError) {
        options.onError(error)
      }
      
      toast.error(error.message || 'An error occurred')
      return null
    } finally {
      setIsLoading(false)
      if (options?.onComplete) {
        options.onComplete()
      }
    }
  }, [options])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return {
    execute,
    data,
    isLoading,
    error,
    reset
  }
}

// Hook for retrying failed operations
interface UseRetryOptions {
  maxRetries?: number
  retryDelay?: number
  onRetry?: (attempt: number) => void
  shouldRetry?: (error: Error) => boolean
}

export function useRetry(options: UseRetryOptions = {}) {
  const { maxRetries = 3, retryDelay = 1000, onRetry, shouldRetry } = options

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> => {
    try {
      return await operation()
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      
      // Check if we should retry
      if (attempt <= maxRetries && (!shouldRetry || shouldRetry(err))) {
        if (onRetry) {
          onRetry(attempt)
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt))
        
        return executeWithRetry(operation, attempt + 1)
      }
      
      throw err
    }
  }, [maxRetries, retryDelay, onRetry, shouldRetry])

  return { executeWithRetry }
}

// Hook for network error detection
export function useNetworkError() {
  const [isOnline, setIsOnline] = useState(true)
  const [lastError, setLastError] = useState<Error | null>(null)

  const handleNetworkError = useCallback((error: Error | string) => {
    const err = typeof error === 'string' ? new Error(error) : error
    
    setLastError(err)
    
    // Check if it's a network error
    if (err.message.includes('Network') || 
        err.message.includes('fetch') || 
        err.message.includes('connection') ||
        err.message.includes('timeout')) {
      setIsOnline(false)
      toast.error('Network error. Please check your connection.')
    } else {
      setIsOnline(true)
    }
  }, [])

  const clearNetworkError = useCallback(() => {
    setLastError(null)
    setIsOnline(true)
  }, [])

  return {
    isOnline,
    lastError,
    handleNetworkError,
    clearNetworkError
  }
}

// Hook for form validation errors
interface FormErrors {
  [key: string]: string | undefined
}

export function useFormErrors() {
  const [errors, setErrors] = useState<FormErrors>({})

  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({
      ...prev,
      [field]: message
    }))
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  const hasErrors = useCallback((field?: string) => {
    if (field) {
      return !!errors[field]
    }
    return Object.keys(errors).length > 0
  }, [errors])

  const getError = useCallback((field: string) => {
    return errors[field]
  }, [errors])

  return {
    errors,
    setError,
    clearError,
    clearAllErrors,
    hasErrors,
    getError
  }
}
