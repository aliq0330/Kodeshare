import { NavLink } from 'react-router-dom'
import {
  Home, Compass, Star, User, Settings,
  Hash, TrendingUp, BookOpen,
} from 'lucide-react'
import { useAuthStore } from '@store/authStore'
import { cn } from '@utils/cn'

const navItems = [
  { to: '/',            icon: Home,      label: 'Ana Sayfa' },
  { to: '/explore',     icon: Compass,   label: 'Keşfet' },
  { to: '/featured',    icon: Star,      label: 'Öne Çıkanlar' },
]

const trendingTags = ['#react', '#css', '#animation', '#ui', '#nextjs', '#tailwind']

export default function Sidebar() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <nav className="flex flex-col gap-6">
      {/* Main navigation */}
      <div className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-900/60 text-brand-300'
                  : 'text-gray-400 hover:bg-surface-raised hover:text-white',
              )
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
        {isAuthenticated && (
          <>
            <NavLink
              to="/makaleler"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-900/60 text-brand-300'
                    : 'text-gray-400 hover:bg-surface-raised hover:text-white',
                )
              }
            >
              <BookOpen className="w-5 h-5" />
              Makalelerim
            </NavLink>
            <NavLink
              to={`/profile/${user?.username}`}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-900/60 text-brand-300'
                    : 'text-gray-400 hover:bg-surface-raised hover:text-white',
                )
              }
            >
              <User className="w-5 h-5" />
              Profilim
            </NavLink>
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-900/60 text-brand-300'
                    : 'text-gray-400 hover:bg-surface-raised hover:text-white',
                )
              }
            >
              <Settings className="w-5 h-5" />
              Ayarlar
            </NavLink>
          </>
        )}
      </div>

      {/* Trending tags */}
      <div>
        <p className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <TrendingUp className="w-3.5 h-3.5" />
          Trend Etiketler
        </p>
        <div className="flex flex-col gap-0.5">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-brand-400 hover:bg-surface-raised rounded-lg transition-colors"
            >
              <Hash className="w-3.5 h-3.5" />
              {tag.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
