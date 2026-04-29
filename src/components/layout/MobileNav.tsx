import { NavLink } from 'react-router-dom'
import { IconHome, IconCompass, IconStar, IconUser, IconCode, IconFileText } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'

const NAV_ITEMS = [
  { to: '/',          icon: IconHome,     label: 'Ana Sayfa', end: true },
  { to: '/explore',   icon: IconCompass,  label: 'Keşfet' },
  { to: '/editor',    icon: IconCode,    label: 'Editör' },
  { to: '/featured',  icon: IconStar,     label: 'Öne Çıkanlar' },
]

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex items-center justify-around px-2">
      {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
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
        <NavLink
          to="/makaleler"
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
          }
        >
          {({ isActive }) => (
            <>
              <IconFileText className={cn('w-5 h-5', isActive && 'text-brand-400')} />
              <span className="text-[10px] font-medium">Makale</span>
            </>
          )}
        </NavLink>
      )}

      {isAuthenticated && (
        <NavLink
          to={`/profile/${user?.username}`}
          className={({ isActive }) =>
            cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
          }
        >
          <IconUser className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profil</span>
        </NavLink>
      )}
    </nav>
  )
}
