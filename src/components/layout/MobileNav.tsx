import { NavLink } from 'react-router-dom'
import { Home, Compass, Star, User, Code2, BookOpen } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'

const items = [
  { to: '/',         icon: Home,    label: 'Ana Sayfa', end: true },
  { to: '/explore',  icon: Compass, label: 'Keşfet' },
  { to: '/editor',   icon: Code2,   label: 'Editör' },
  { to: '/featured', icon: Star,    label: 'Öne Çıkanlar' },
]

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex items-center justify-around px-2">
      {items.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors',
              isActive ? 'text-brand-400' : 'text-gray-500',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon className={cn('w-5 h-5', isActive && 'text-brand-400')} />
              <span className="text-[10px] font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
      {isAuthenticated && (
        <>
          <NavLink
            to="/articles"
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
            }
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] font-medium">Makale</span>
          </NavLink>
          <NavLink
            to={`/profile/${user?.username}`}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </NavLink>
        </>
      )}
    </nav>
  )
}
