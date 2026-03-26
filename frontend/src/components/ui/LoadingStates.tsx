'use client'

import { Loader2, RefreshCw } from 'lucide-react'

// Full page loading spinner
export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
        <p className="text-muted-foreground text-sm font-medium">{message}</p>
      </div>
    </div>
  )
}

// Card loading skeleton
export function CardSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-3/4 animate-pulse"></div>
        <div className="h-8 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  )
}

// List item skeleton
export function ListItemSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4 border-b border-border">
      <div className="h-10 w-10 bg-muted rounded-full animate-pulse"></div>
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
      <div className="h-6 bg-muted rounded w-16 animate-pulse"></div>
    </div>
  )
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="border-b border-border p-4">
        <div className="h-4 bg-muted rounded w-1/3 animate-pulse"></div>
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="p-4">
            <div className="grid grid-cols-4 gap-4">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-4 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Button loading state
export function LoadingButton({ 
  children, 
  loading, 
  disabled,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  [key: string]: any
}) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}

// Form loading overlay
export function FormLoadingOverlay({ loading }: { loading: boolean }) {
  if (!loading) return null

  return (
    <div className="absolute inset-0 bg-background/75 flex items-center justify-center z-50 rounded-lg">
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Processing...</p>
      </div>
    </div>
  )
}

// Dashboard card skeleton
export function DashboardCardSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 w-6 bg-muted rounded animate-pulse"></div>
        <div className="h-4 w-16 bg-muted rounded animate-pulse"></div>
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-muted rounded w-1/3 animate-pulse"></div>
        <div className="h-3 bg-muted rounded w-1/2 animate-pulse"></div>
      </div>
    </div>
  )
}

// Chart skeleton
export function ChartSkeleton() {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="space-y-4">
        <div className="h-4 bg-muted rounded w-1/4 animate-pulse"></div>
        <div className="h-48 bg-muted rounded animate-pulse"></div>
        <div className="flex justify-between">
          <div className="h-3 bg-muted rounded w-1/6 animate-pulse"></div>
          <div className="h-3 bg-muted rounded w-1/6 animate-pulse"></div>
          <div className="h-3 bg-muted rounded w-1/6 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

// Progress loading bar
export function ProgressBar({ progress = 0 }: { progress?: number }) {
  return (
    <div className="w-full bg-muted rounded-full h-2">
      <div 
        className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      ></div>
    </div>
  )
}

// Inline loading spinner
export function InlineSpinner({ size = 'sm', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin text-primary ${className}`} />
  )
}

// Empty state with loading
export function EmptyStateLoading({ message = 'Loading data...' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">
        {message}
      </h3>
      <p className="text-muted-foreground">
        Please wait while we fetch your data...
      </p>
    </div>
  )
}

// Retry button with loading
export function RetryButton({ 
  onRetry, 
  loading, 
  children = 'Retry',
  className = ''
}: {
  onRetry: () => void
  loading?: boolean
  children?: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onRetry}
      disabled={loading}
      className={`inline-flex items-center justify-center px-4 py-2 border border-input text-sm font-medium rounded-md text-foreground bg-card hover:bg-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : (
        <RefreshCw className="h-4 w-4 mr-2" />
      )}
      {children}
    </button>
  )
}
