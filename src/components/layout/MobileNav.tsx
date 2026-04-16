import { NavLink } from 'react-router-dom'
import { Home, Compass, Star, User, Code2 } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'

const items = [
  { to: '/',             icon: Home,    label: 'Ana Sayfa', end: true },
  { to: '/explore',      icon: Compass, label: 'Keşfet' },
  { to: '/editor',       icon: Code2,   label: 'Editör' },
  { to: '/featured',     icon: Star,    label: 'Öne Çıkanlar' },
]

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex items-center justify-around px-2">
      {items.map(({ to, icon: Icon, label, end, auth }) => {
        if (auth && !isAuthenticated) return null
        return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors relative',
                isActive ? 'text-brand-400' : 'text-gray-500',
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon className={cn('w-5 h-5', isActive && 'text-brand-400')} />
                  {to === '/notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-500 rounded-full text-[9px] font-bold flex items-center justify-center text-white">
                      {unreadCount > 9 ? '9' : unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        )
      })}
      {isAuthenticated && (
        <NavLink
          to={`/profile/${user?.username}`}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
          }
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </NavLink>
      )}
    </nav>
  )
}
