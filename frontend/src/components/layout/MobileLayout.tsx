import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import MobileNavigation from './MobileNavigation'
import MobileBottomNav from './MobileBottomNav'

interface MobileLayoutProps {
  children: React.ReactNode
  user?: any
}

export default function MobileLayout({ children, user }: MobileLayoutProps) {
  const [userState, setUserState] = useState(user)
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (!user) {
      const fetchUser = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser()
          setUserState(user)
        } catch (error) {
          console.error('Error fetching user:', error)
        } finally {
          setLoading(false)
        }
      }
      fetchUser()
    }
  }, [user])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUserState(session?.user)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = () => {
    setUserState(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">FS</span>
            </div>
            <span className="font-semibold text-gray-900">FinSight AI</span>
          </div>
          <MobileNavigation user={userState} onSignOut={handleSignOut} />
        </div>
      </header>

      {/* Main Content */}
      <main className="lg:hidden pb-16">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  )
}
