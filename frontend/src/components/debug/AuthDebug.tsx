'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AuthDebug() {
  const { user, token, isAuthenticated } = useAuth()

  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <Card className="mb-4 border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-yellow-800">
          🔍 Debug: Authentication Status
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div><strong>Authenticated:</strong> {isAuthenticated ? '✅ Yes' : '❌ No'}</div>
        <div><strong>User ID:</strong> {user?.id || 'Not found'}</div>
        <div><strong>Email:</strong> {user?.email || 'Not found'}</div>
        <div><strong>Token:</strong> {token ? '✅ Present' : '❌ Missing'}</div>
        <div><strong>Token Preview:</strong> {token ? `${token.substring(0, 20)}...` : 'N/A'}</div>
      </CardContent>
    </Card>
  )
}
