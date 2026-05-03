import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { IconHome, IconHomeFilled, IconCompass, IconCompassFilled, IconEdit, IconBell, IconMessage } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { useComposerStore } from '@store/composerStore'
import { useMessageStore } from '@store/messageStore'

export default function MobileNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { isAuthenticated } = useAuthStore()
  const unreadNotifications = useNotificationStore((s) => s.unreadCount)
  const openComposer = useComposerStore((s) => s.openComposer)
  const conversations = useMessageStore((s) => s.conversations)
  const unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount ?? 0), 0)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn('flex items-center justify-center px-4 py-2 rounded-lg transition-colors',
      isActive ? 'text-brand-400' : 'text-gray-400')

  const isExplore = pathname === '/explore'

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-card border-t border-surface-border h-16 flex items-center justify-around px-2">

      {/* Anasayfa */}
      <NavLink to="/" end className={linkClass}>
        {({ isActive }) => isActive
          ? <IconHomeFilled className="w-6 h-6" />
          : <IconHome className="w-6 h-6" />}
      </NavLink>

      {/* Keşfet */}
      <button
        onClick={() => navigate('/explore', { state: { focusSearch: true } })}
        className={cn('flex items-center justify-center px-4 py-2 rounded-lg transition-colors',
          isExplore ? 'text-brand-400' : 'text-gray-400')}
      >
        {isExplore
          ? <IconCompassFilled className="w-6 h-6" />
          : <IconCompass className="w-6 h-6" />}
      </button>

      {/* Yeni Gönderi */}
      <button
        onClick={() => isAuthenticated ? openComposer() : navigate('/login')}
        className="flex items-center justify-center px-4 py-2 rounded-lg transition-colors text-gray-400 hover:text-brand-400"
      >
        <IconEdit className="w-6 h-6" />
      </button>

      {/* Bildirim */}
      <NavLink to={isAuthenticated ? '/notifications' : '/login'} className={linkClass}>
        {({ isActive }) => (
          <span className="relative">
            <IconBell className={cn('w-6 h-6', isActive && 'fill-current stroke-none')} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-black rounded-full" />
            )}
          </span>
        )}
      </NavLink>

      {/* Mesajlaşma */}
      <NavLink to={isAuthenticated ? '/messages' : '/login'} className={linkClass}>
        {({ isActive }) => (
          <span className="relative">
            <IconMessage className={cn('w-6 h-6', isActive && 'fill-current stroke-none')} />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-black rounded-full" />
            )}
          </span>
        )}
      </NavLink>

    </nav>
  )
}
