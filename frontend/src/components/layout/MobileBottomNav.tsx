import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, TrendingDown, Target, Repeat, FileText, Bell } from 'lucide-react'

export default function MobileBottomNav() {
  const pathname = usePathname()

  const navigation = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Income', href: '/income', icon: TrendingUp },
    { name: 'Expenses', href: '/expenses', icon: TrendingDown },
    { name: 'Budgets', href: '/budgets', icon: Target },
    { name: 'More', href: '/more', icon: Repeat },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 gap-1">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center py-2 px-1 text-xs transition-colors ${
              isActive(item.href)
                ? 'text-blue-600'
                : 'text-gray-600'
            }`}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
