'use client'

import { useState, useEffect } from 'react'
import { notificationApi, type Notification as NotificationType } from '@/lib/api/production'
import { AppLayout } from '@/components/layout/AppLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Check, X, AlertTriangle, Eye, EyeOff, Trash2, Info, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useTheme } from '@/contexts/ThemeContext'

interface NotificationStats {
  total: number
  unread: number
  unacknowledged: number
  urgent: number
  high: number
  medium: number
  low: number
}

function NotificationsPageContent() {
  const { theme, isDarkMode } = useTheme()
  const [notifications, setNotifications] = useState<NotificationType[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'acknowledged' | 'unacknowledged'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'info' | 'warning' | 'success' | 'error'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>('all')
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    unacknowledged: 0,
    urgent: 0,
    high: 0,
    medium: 0,
    low: 0
  })

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      // Get current user ID from localStorage
      const userData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null
      const userId = userData ? JSON.parse(userData).id : null
      
      console.log('🔍 Fetching notifications for userId:', userId)
      
      if (!userId) {
        console.warn('⚠️ No user ID found - user might not be logged in')
        toast.error('Please log in to view notifications')
        setNotifications([])
        setLoading(false)
        return
      }
      
      // Call notifications API endpoint
      const response = await notificationApi.getAll(userId)
      console.log('📊 Notifications API Response:', response)
      
      if (response.data && Array.isArray(response.data)) {
        console.log('📋 Raw notifications data:', response.data)
        setNotifications(response.data)
        calculateStats(response.data)
        
        if (response.data.length === 0) {
          toast('No notifications found. You\'re all caught up!', {
            icon: '🔔',
            style: {
              background: '#10b981',
              color: 'white',
            }
          })
        }
      } else {
        console.log('⚠️ No notifications data received from API')
        setNotifications([])
        calculateStats([])
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to fetch notifications'
      toast.error(errorMessage)
      console.error('❌ Error fetching notifications:', error)
      setNotifications([])
      calculateStats([])
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (notifications: NotificationType[]) => {
    const newStats = notifications.reduce((acc, notification) => {
      acc.total++
      if (!notification.is_read) acc.unread++
      if (!notification.is_acknowledged) acc.unacknowledged++
      
      switch (notification.priority) {
        case 'urgent':
          acc.urgent++
          break
        case 'high':
          acc.high++
          break
        case 'medium':
          acc.medium++
          break
        case 'low':
          acc.low++
          break
      }
      
      return acc
    }, {
      total: 0,
      unread: 0,
      unacknowledged: 0,
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0
    })
    
    setStats(newStats)
  }

  const markAsRead = async (id: string) => {
    try {
      console.log('📖 Marking notification as read:', id)
      const response = await notificationApi.update(id, { is_read: true })
      console.log('📊 Mark as read response:', response)
      
      if (response.data) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: true } : n)
        )
        calculateStats(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
        toast.success('Marked as read')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mark as read'
      toast.error(errorMessage)
      console.error('❌ Error marking as read:', error)
    }
  }

  const markAsUnread = async (id: string) => {
    try {
      console.log('📕 Marking notification as unread:', id)
      const response = await notificationApi.update(id, { is_read: false })
      console.log('📊 Mark as unread response:', response)
      
      if (response.data) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_read: false } : n)
        )
        calculateStats(notifications.map(n => n.id === id ? { ...n, is_read: false } : n))
        toast.success('Marked as unread')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mark as unread'
      toast.error(errorMessage)
      console.error('❌ Error marking as unread:', error)
    }
  }

  const acknowledgeNotification = async (id: string) => {
    try {
      console.log('✅ Acknowledging notification:', id)
      const response = await notificationApi.update(id, { 
        is_acknowledged: true
      })
      console.log('📊 Acknowledge response:', response)
      
      if (response.data) {
        setNotifications(prev => 
          prev.map(n => n.id === id ? { ...n, is_acknowledged: true } : n)
        )
        calculateStats(notifications.map(n => n.id === id ? { ...n, is_acknowledged: true } : n))
        toast.success('Notification acknowledged')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to acknowledge notification'
      toast.error(errorMessage)
      console.error('❌ Error acknowledging notification:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return
    }

    try {
      console.log('🗑️ Deleting notification:', id)
      const response = await notificationApi.delete(id)
      console.log('📊 Delete response:', response)
      
      if (response.status === 'success' || response.data) {
        setNotifications(prev => prev.filter(n => n.id !== id))
        calculateStats(notifications.filter(n => n.id !== id))
        toast.success('Notification deleted')
      } else {
        toast.error('Failed to delete notification')
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete notification'
      toast.error(errorMessage)
      console.error('❌ Error deleting notification:', error)
    }
  }

  const markNotificationAsReadWhenViewed = async (notificationId: string) => {
    const notification = notifications.find(n => n.id === notificationId)
    if (notification && !notification.is_read) {
      await markAsRead(notificationId)
    }
  }

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      // Filter by type
      if (filterType === 'unread' && notification.is_read) return false
      if (filterType === 'acknowledged' && !notification.is_acknowledged) return false
      if (filterType === 'unacknowledged' && notification.is_acknowledged) return false
      
      // Filter by category
      if (filterCategory !== 'all' && notification.type !== filterCategory) return false
      
      // Filter by priority
      if (filterPriority !== 'all' && notification.priority !== filterPriority) return false
      
      return true
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return isDarkMode 
          ? 'border-red-900 bg-red-900/20' 
          : 'border-red-200 bg-red-50'
      case 'high':
        return isDarkMode 
          ? 'border-orange-900 bg-orange-900/20' 
          : 'border-orange-200 bg-orange-50'
      case 'medium':
        return isDarkMode 
          ? 'border-yellow-900 bg-yellow-900/20' 
          : 'border-yellow-200 bg-yellow-50'
      case 'low':
        return isDarkMode 
          ? 'border-gray-700 bg-gray-700/50' 
          : 'border-gray-200 bg-gray-50'
      default:
        return isDarkMode 
          ? 'border-gray-700 bg-gray-800' 
          : 'border-gray-200 bg-white'
    }
  }

  if (loading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDarkMode 
          ? "bg-gradient-to-br from-gray-900 to-gray-800" 
          : "bg-gradient-to-br from-background to-accent/20"
      )}>
        <div className="text-center">
          <div className={cn(
            "animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4",
            isDarkMode ? "border-primary" : "border-primary"
          )}></div>
          <p className={cn(
            "font-medium",
            isDarkMode ? "text-gray-300" : "text-muted-foreground"
          )}>
            Loading notifications...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen",
      isDarkMode 
        ? "bg-gradient-to-br from-gray-900 to-gray-800" 
        : "bg-gradient-to-br from-background to-accent/20"
    )}>
      {/* Header */}
      <header className={cn(
        "sticky top-0 z-50 shadow-sm border-b",
        isDarkMode 
          ? "bg-gray-800/90 backdrop-blur-lg border-gray-700" 
          : "bg-card/80 backdrop-blur-lg shadow-sm border-b border-border/50"
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                isDarkMode 
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600"
              )}>
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className={cn(
                  "text-2xl font-bold bg-clip-text text-transparent",
                  isDarkMode 
                    ? "bg-gradient-to-r from-blue-400 to-indigo-400" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600"
                )}>
                  Notifications
                </h1>
                <p className={cn(
                  "text-sm",
                  isDarkMode ? "text-gray-300" : "text-muted-foreground"
                )}>
                  {stats.unread} unread • {stats.total} total
                </p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={fetchNotifications}
              className={cn(
                "border hover:bg-accent",
                isDarkMode 
                  ? "border-gray-600 hover:bg-gray-700" 
                  : "border-border hover:bg-accent"
              )}
            >
              <BellOff className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className={cn(
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-200" : "text-muted-foreground"
              )}>
                Total
              </CardTitle>
              <Bell className={cn(
                "h-4 w-4",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-blue-400" : "text-blue-600"
              )}>
                {stats.total}
              </div>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-muted-foreground"
              )}>
                All notifications
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-200" : "text-muted-foreground"
              )}>
                Unread
              </CardTitle>
              <Eye className={cn(
                "h-4 w-4",
                isDarkMode ? "text-orange-400" : "text-orange-600"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-orange-400" : "text-orange-600"
              )}>
                {stats.unread}
              </div>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-muted-foreground"
              )}>
                Not yet read
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-200" : "text-muted-foreground"
              )}>
                Unacknowledged
              </CardTitle>
              <X className={cn(
                "h-4 w-4",
                isDarkMode ? "text-red-400" : "text-red-600"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-red-400" : "text-red-600"
              )}>
                {stats.unacknowledged}
              </div>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-muted-foreground"
              )}>
                Need attention
              </p>
            </CardContent>
          </Card>

          <Card className={cn(
            isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card"
          )}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={cn(
                "text-sm font-medium",
                isDarkMode ? "text-gray-200" : "text-muted-foreground"
              )}>
                Urgent
              </CardTitle>
              <AlertTriangle className={cn(
                "h-4 w-4",
                isDarkMode ? "text-red-400" : "text-red-600"
              )} />
            </CardHeader>
            <CardContent>
              <div className={cn(
                "text-2xl font-bold",
                isDarkMode ? "text-red-400" : "text-red-600"
              )}>
                {stats.urgent}
              </div>
              <p className={cn(
                "text-xs",
                isDarkMode ? "text-gray-400" : "text-muted-foreground"
              )}>
                High priority
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className={cn(
              "px-3 py-2 border rounded-md",
              isDarkMode 
                ? "bg-gray-800 border-gray-600 text-gray-200" 
                : "bg-background border-border"
            )}
          >
            <option value="all">All Types</option>
            <option value="unread">Unread</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="unacknowledged">Unacknowledged</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className={cn(
              "px-3 py-2 border rounded-md",
              isDarkMode 
                ? "bg-gray-800 border-gray-600 text-gray-200" 
                : "bg-background border-border"
            )}
          >
            <option value="all">All Categories</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="success">Success</option>
            <option value="error">Error</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className={cn(
              "px-3 py-2 border rounded-md",
              isDarkMode 
                ? "bg-gray-800 border-gray-600 text-gray-200" 
                : "bg-background border-border"
            )}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        {/* Notifications List */}
        <div className="space-y-4">
          {getFilteredNotifications().length === 0 ? (
            <Card className={cn(
              "text-center py-12",
              isDarkMode ? "bg-gray-800 border-gray-700" : "bg-card"
            )}>
              <CardContent>
                <Bell className={cn(
                  "h-12 w-12 mx-auto mb-4",
                  isDarkMode ? "text-gray-400" : "text-muted-foreground"
                )} />
                <h3 className={cn(
                  "text-lg font-medium mb-2",
                  isDarkMode ? "text-gray-100" : "text-foreground"
                )}>
                  No notifications found
                </h3>
                <p className={cn(
                  isDarkMode ? "text-gray-400" : "text-muted-foreground"
                )}>
                  {filterType !== 'all' || filterCategory !== 'all' || filterPriority !== 'all'
                    ? 'Try adjusting your filters'
                    : 'You\'re all caught up!'}
                </p>
              </CardContent>
            </Card>
          ) : (
            getFilteredNotifications().map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-all duration-200 hover:shadow-md cursor-pointer",
                  getPriorityColor(notification.priority || 'low'),
                  !notification.is_read && "border-l-4 border-l-blue-500"
                )}
                onClick={() => markNotificationAsReadWhenViewed(notification.id)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="mt-1">
                        {getNotificationIcon(notification.type || 'info')}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className={cn(
                            "font-semibold",
                            isDarkMode ? "text-white" : "text-foreground"
                          )}>
                            {notification.title}
                          </h3>
                          {!notification.is_read && (
                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                              New
                            </span>
                          )}
                          {notification.priority === 'urgent' && (
                            <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>
                        <p className={cn(
                          "mb-2",
                          isDarkMode ? "text-gray-300" : "text-muted-foreground"
                        )}>
                          {notification.message}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className={cn(
                            isDarkMode ? "text-gray-400" : "text-muted-foreground"
                          )}>
                            {format(new Date(notification.created_at || ''), 'MMM d, yyyy HH:mm')}
                          </span>
                          {notification.expires_at && (
                            <span className={cn(
                              isDarkMode ? "text-gray-400" : "text-muted-foreground"
                            )}>
                              Expires: {format(new Date(notification.expires_at), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {!notification.is_read ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsRead(notification.id)
                          }}
                          className={cn(
                            isDarkMode 
                              ? "border-gray-600 hover:bg-gray-700 hover:text-gray-200" 
                              : "border-border hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            markAsUnread(notification.id)
                          }}
                          className={cn(
                            isDarkMode 
                              ? "border-gray-600 hover:bg-gray-700 hover:text-gray-200" 
                              : "border-border hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <EyeOff className="h-4 w-4" />
                        </Button>
                      )}
                      {!notification.is_acknowledged && (
                        <Button
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            acknowledgeNotification(notification.id)
                          }}
                          className={cn(
                            isDarkMode 
                              ? "border-gray-600 hover:bg-gray-700 hover:text-gray-200" 
                              : "border-border hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNotification(notification.id)
                        }}
                        className={cn(
                          isDarkMode 
                            ? "border-gray-600 hover:bg-gray-700 hover:text-gray-200" 
                            : "border-border hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

export default function NotificationsPage() {
  return (
    <AppLayout>
      <NotificationsPageContent />
    </AppLayout>
  )
}
