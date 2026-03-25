'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Check, X, AlertTriangle, TrendingUp, TrendingDown, Calendar, Settings, Trash2, Eye, Archive } from 'lucide-react'
import toast from 'react-hot-toast'
import { format, differenceInDays, isAfter, isBefore } from 'date-fns'

interface Notification {
  id: string
  type: 'budget_alert' | 'savings_goal' | 'recurring_transaction' | 'system'
  title: string
  message: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  is_read: boolean
  is_acknowledged: boolean
  action_required: boolean
  action_url?: string
  action_label?: string
  metadata?: any
  created_at: string
  acknowledged_at?: string
}

interface NotificationStats {
  total: number
  unread: number
  unacknowledged: number
  urgent: number
  high: number
  medium: number
  low: number
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filterType, setFilterType] = useState<'all' | 'unread' | 'acknowledged' | 'unacknowledged'>('all')
  const [filterCategory, setFilterCategory] = useState<'all' | 'budget_alert' | 'savings_goal' | 'recurring_transaction' | 'system'>('all')
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
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          fetchNotifications()
        }
      )
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notifications' },
        (payload) => {
          fetchNotifications()
        }
      )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      setNotifications(data || [])
      calculateStats(data || [])
    } catch (error: any) {
      toast.error('Failed to fetch notifications')
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (notifications: Notification[]) => {
    const newStats = notifications.reduce((acc, notification) => {
      acc.total++
      if (!notification.is_read) acc.unread++
      if (!notification.is_acknowledged) acc.unacknowledged++
      
      switch (notification.priority) {
        case 'urgent': acc.urgent++; break
        case 'high': acc.high++; break
        case 'medium': acc.medium++; break
        case 'low': acc.low++; break
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
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch (error: any) {
      toast.error('Failed to mark as read')
      console.error('Error marking as read:', error)
    }
  }

  const markAsUnread = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: false })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_read: false } : n)
      )
    } catch (error: any) {
      toast.error('Failed to mark as unread')
      console.error('Error marking as unread:', error)
    }
  }

  const acknowledgeNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, is_acknowledged: true, acknowledged_at: new Date().toISOString() } : n)
      )

      toast.success('Notification acknowledged')
    } catch (error: any) {
      toast.error('Failed to acknowledge notification')
      console.error('Error acknowledging notification:', error)
    }
  }

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id)

      if (error) throw error

      setNotifications(prev => prev.filter(n => n.id !== id))
      toast.success('Notification deleted')
    } catch (error: any) {
      toast.error('Failed to delete notification')
      console.error('Error deleting notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_read: true }))
      )

      toast.success('All notifications marked as read')
    } catch (error: any) {
      toast.error('Failed to mark all as read')
      console.error('Error marking all as read:', error)
    }
  }

  const acknowledgeAll = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_acknowledged: true,
          acknowledged_at: new Date().toISOString()
        })
        .eq('is_acknowledged', false)

      if (error) throw error

      setNotifications(prev => 
        prev.map(n => ({ ...n, is_acknowledged: true, acknowledged_at: new Date().toISOString() }))
      )

      toast.success('All notifications acknowledged')
    } catch (error: any) {
      toast.error('Failed to acknowledge all notifications')
      console.error('Error acknowledging all notifications:', error)
    }
  }

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      const typeMatch = filterType === 'all' || 
        (filterType === 'unread' && !notification.is_read) ||
        (filterType === 'acknowledged' && notification.is_acknowledged) ||
        (filterType === 'unacknowledged' && !notification.is_acknowledged)

      const categoryMatch = filterCategory === 'all' || notification.type === filterCategory
      const priorityMatch = filterPriority === 'all' || notification.priority === filterPriority

      return typeMatch && categoryMatch && priorityMatch
    })
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'budget_alert': return <AlertTriangle className="h-5 w-5 text-orange-500" />
      case 'savings_goal': return <TrendingUp className="h-5 w-5 text-green-500" />
      case 'recurring_transaction': return <Calendar className="h-5 w-5 text-blue-500" />
      case 'system': return <Bell className="h-5 w-5 text-gray-500" />
      default: return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-red-500 bg-red-50'
      case 'high': return 'border-orange-500 bg-orange-50'
      case 'medium': return 'border-yellow-500 bg-yellow-50'
      case 'low': return 'border-gray-300 bg-gray-50'
      default: return 'border-gray-300 bg-white'
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredNotifications = getFilteredNotifications()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-gray-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-sm text-gray-500">Manage your alerts and notifications</p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={markAllAsRead}
                disabled={stats.unread === 0}
                className="flex items-center space-x-2"
              >
                <Eye className="h-4 w-4" />
                <span>Mark All Read</span>
              </Button>
              <Button
                variant="outline"
                onClick={acknowledgeAll}
                disabled={stats.unacknowledged === 0}
                className="flex items-center space-x-2"
              >
                <Check className="h-4 w-4" />
                <span>Acknowledge All</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
              <Bell className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">All notifications</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unread</CardTitle>
              <BellOff className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
              <p className="text-xs text-muted-foreground">Not yet read</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unacknowledged</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.unacknowledged}</div>
              <p className="text-xs text-muted-foreground">Action required</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
              <p className="text-xs text-muted-foreground">High priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex space-x-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterType('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filterType === 'unread' ? 'default' : 'outline'}
              onClick={() => setFilterType('unread')}
              size="sm"
            >
              Unread
            </Button>
            <Button
              variant={filterType === 'unacknowledged' ? 'default' : 'outline'}
              onClick={() => setFilterType('unacknowledged')}
              size="sm"
            >
              Unacknowledged
            </Button>
            <Button
              variant={filterType === 'acknowledged' ? 'default' : 'outline'}
              onClick={() => setFilterType('acknowledged')}
              size="sm"
            >
              Acknowledged
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={filterCategory === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('all')}
              size="sm"
            >
              All Types
            </Button>
            <Button
              variant={filterCategory === 'budget_alert' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('budget_alert')}
              size="sm"
            >
              Budget
            </Button>
            <Button
              variant={filterCategory === 'savings_goal' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('savings_goal')}
              size="sm"
            >
              Savings
            </Button>
            <Button
              variant={filterCategory === 'recurring_transaction' ? 'default' : 'outline'}
              onClick={() => setFilterCategory('recurring_transaction')}
              size="sm"
            >
              Recurring
            </Button>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={filterPriority === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('all')}
              size="sm"
            >
              All Priority
            </Button>
            <Button
              variant={filterPriority === 'urgent' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('urgent')}
              size="sm"
            >
              Urgent
            </Button>
            <Button
              variant={filterPriority === 'high' ? 'default' : 'outline'}
              onClick={() => setFilterPriority('high')}
              size="sm"
            >
              High
            </Button>
          </div>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-900">No notifications found</h3>
                <p className="mt-2 text-sm text-gray-500">
                  You're all caught up! Check back later for new notifications.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border rounded-lg p-4 transition-colors ${getPriorityColor(notification.priority)} ${
                      !notification.is_read ? 'border-l-4' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className={`font-medium ${!notification.is_read ? 'text-gray-900' : 'text-gray-600'}`}>
                              {notification.title}
                            </h3>
                            <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${getPriorityBadgeColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            {!notification.is_read && (
                              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                            {notification.action_required && !notification.is_acknowledged && (
                              <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                                Action Required
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{format(new Date(notification.created_at), 'MMM d, yyyy h:mm a')}</span>
                            {notification.acknowledged_at && (
                              <span>Acknowledged: {format(new Date(notification.acknowledged_at), 'MMM d, yyyy h:mm a')}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {!notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="flex items-center space-x-1"
                          >
                            <Eye className="h-4 w-4" />
                            <span>Read</span>
                          </Button>
                        )}
                        {notification.is_read && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => markAsUnread(notification.id)}
                            className="flex items-center space-x-1"
                          >
                            <BellOff className="h-4 w-4" />
                            <span>Unread</span>
                          </Button>
                        )}
                        {notification.action_required && !notification.is_acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeNotification(notification.id)}
                            className="flex items-center space-x-1 text-green-600"
                          >
                            <Check className="h-4 w-4" />
                            <span>Acknowledge</span>
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="flex items-center space-x-1 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>

                    {/* Action Button */}
                    {notification.action_url && notification.action_label && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <a
                          href={notification.action_url}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {notification.action_label}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Budget Alerts</h3>
                <p className="text-sm text-gray-500">Get notified when you exceed budget limits</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Savings Goals</h3>
                <p className="text-sm text-gray-500">Updates on your savings progress</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">Recurring Transactions</h3>
                <p className="text-sm text-gray-500">Alerts for recurring transaction issues</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">System Updates</h3>
                <p className="text-sm text-gray-500">Important system notifications</p>
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
