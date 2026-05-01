import { NavLink } from 'react-router-dom'
import {
  IconHome, IconHomeFilled,
  IconCompass, IconCompassFilled,
  IconStar, IconStarFilled,
  IconUser, IconUserFilled,
  IconSettings, IconSettingsFilled,
  IconHash, IconTrendingUp,
  IconBook2, IconBook2Filled,
} from '@tabler/icons-react'
import { useAuthStore } from '@store/authStore'
import { cn } from '@utils/cn'

const navItems = [
  { to: '/',         icon: IconHome,     iconFilled: IconHomeFilled,    label: 'Ana Sayfa', end: true },
  { to: '/explore',  icon: IconCompass,  iconFilled: IconCompassFilled, label: 'Keşfet',    end: false },
  { to: '/featured', icon: IconStar,     iconFilled: IconStarFilled,    label: 'Öne Çıkanlar', end: false },
]

const trendingTags = ['#react', '#css', '#animation', '#ui', '#nextjs', '#tailwind']

const linkClass = (isActive: boolean) =>
  cn(
    'flex items-center gap-3 px-3 py-2 rounded-lg text-lg transition-colors',
    isActive
      ? 'text-white font-black'
      : 'text-gray-400 font-medium hover:bg-surface-raised hover:text-white',
  )

export default function Sidebar() {
  const { user, isAuthenticated } = useAuthStore()

  return (
    <nav className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        {navItems.map(({ to, icon: Icon, iconFilled: IconFilled, label, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => linkClass(isActive)}>
            {({ isActive }) => (
              <>
                {isActive ? <IconFilled className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                {label}
              </>
            )}
          </NavLink>
        ))}

        {isAuthenticated && (
          <>
            <NavLink to="/makaleler" className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive ? <IconBook2Filled className="w-6 h-6" /> : <IconBook2 className="w-6 h-6" />}
                  Makalelerim
                </>
              )}
            </NavLink>

            <NavLink to={`/profile/${user?.username}`} className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive ? <IconUserFilled className="w-6 h-6" /> : <IconUser className="w-6 h-6" />}
                  Profilim
                </>
              )}
            </NavLink>

            <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  {isActive ? <IconSettingsFilled className="w-6 h-6" /> : <IconSettings className="w-6 h-6" />}
                  Ayarlar
                </>
              )}
            </NavLink>
          </>
        )}
      </div>

      <div>
        <p className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
          <IconTrendingUp className="w-3.5 h-3.5" />
          Trend Etiketler
        </p>
        <div className="flex flex-col gap-0.5">
          {trendingTags.map((tag) => (
            <button
              key={tag}
              className="flex items-center gap-2 px-3 py-1.5 text-base text-gray-400 hover:text-brand-400 hover:bg-surface-raised rounded-lg transition-colors"
            >
              <IconHash className="w-3.5 h-3.5" />
              {tag.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </nav>
  )
}
