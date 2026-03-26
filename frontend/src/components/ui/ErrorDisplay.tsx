'use client'

import { AlertTriangle, RefreshCw, X, AlertCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ErrorDisplayProps {
  error?: Error | string
  title?: string
  message?: string
  onRetry?: () => void
  onDismiss?: () => void
  variant?: 'error' | 'warning' | 'info'
  className?: string
  showRetry?: boolean
  showDismiss?: boolean
}

export function ErrorDisplay({
  error,
  title,
  message,
  onRetry,
  onDismiss,
  variant = 'error',
  className = '',
  showRetry = true,
  showDismiss = true
}: ErrorDisplayProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message
  const displayTitle = title || (variant === 'error' ? 'Error' : variant === 'warning' ? 'Warning' : 'Info')
  const displayMessage = message || errorMessage || 'An unexpected error occurred'

  const getIcon = () => {
    switch (variant) {
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />
      default:
        return <AlertTriangle className="h-5 w-5 text-red-500" />
    }
  }

  const getVariantStyles = () => {
    switch (variant) {
      case 'error':
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20'
      case 'info':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
      default:
        return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
    }
  }

  return (
    <div className={`rounded-lg border p-4 ${getVariantStyles()} ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-foreground">
            {displayTitle}
          </h3>
          <div className="mt-2 text-sm text-muted-foreground">
            {displayMessage}
          </div>
          
          {process.env.NODE_ENV === 'development' && error && typeof error === 'object' && error.stack && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                Technical Details
              </summary>
              <pre className="mt-2 text-xs text-foreground bg-muted p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="ml-auto pl-3">
          <div className="flex space-x-2">
            {showRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
                className="h-8 px-2"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            {showDismiss && onDismiss && (
              <Button
                onClick={onDismiss}
                variant="ghost"
                size="sm"
                className="h-8 px-2"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Inline error display for forms
export function FormError({ error }: { error?: string }) {
  if (!error) return null

  return (
    <div className="flex items-center space-x-2 text-destructive text-sm mt-1">
      <AlertTriangle className="h-4 w-4" />
      <span>{error}</span>
    </div>
  )
}

// Network error display
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorDisplay
      title="Network Error"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
      variant="error"
    />
  )
}

// Data not found error
export function NotFoundError({ onRetry, entityType = 'data' }: { onRetry?: () => void; entityType?: string }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {entityType} Not Found
      </h3>
      <p className="text-muted-foreground mb-4">
        The {entityType.toLowerCase()} you're looking for doesn't exist or has been removed.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Permission error display
export function PermissionError() {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Access Denied
      </h3>
      <p className="text-muted-foreground">
        You don't have permission to access this resource.
      </p>
    </div>
  )
}

// Server error display
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="text-center py-12">
      <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        Server Error
      </h3>
      <p className="text-muted-foreground mb-4">
        Something went wrong on our end. Our team has been notified and is working to fix this issue.
      </p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  )
}

// Empty state with optional error
export function EmptyState({
  title = 'No data available',
  message = 'There are no items to display at this time.',
  icon,
  action,
  actionLabel,
  onAction
}: {
  title?: string
  message?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="text-center py-12">
      {icon && (
        <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium text-foreground mb-2">
        {title}
      </h3>
      <p className="text-muted-foreground mb-4">
        {message}
      </p>
      {(action || onAction) && (
        <Button onClick={onAction} variant="outline">
          {action || actionLabel}
        </Button>
      )}
    </div>
  )
}
