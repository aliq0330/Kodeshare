import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { IconHome, IconSearch, IconEditCircle, IconBell, IconMessage } from '@tabler/icons-react'
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
    cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0',
      isActive ? 'text-brand-400' : 'text-gray-500')

  const iconClass = (active: boolean) => cn('w-5 h-5', active && 'text-brand-400')
  const labelClass = 'text-[10px] font-medium truncate'

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex items-center justify-around px-2">

      {/* Anasayfa */}
      <NavLink to="/" end className={linkClass}>
        {({ isActive }) => (
          <>
            <IconHome className={iconClass(isActive)} />
            <span className={labelClass}>Anasayfa</span>
          </>
        )}
      </NavLink>

      {/* Ara */}
      <button
        onClick={() => navigate('/explore', { state: { focusSearch: true } })}
        className={cn('flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-0',
          pathname === '/explore' ? 'text-brand-400' : 'text-gray-500')}
      >
        <IconSearch className={iconClass(pathname === '/explore')} />
        <span className={labelClass}>Ara</span>
      </button>

      {/* Yeni Gönderi */}
      <button
        onClick={() => isAuthenticated ? openComposer() : navigate('/login')}
        className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors text-gray-500 hover:text-brand-400 min-w-0"
      >
        <IconEditCircle className="w-5 h-5" />
        <span className={labelClass}>Gönderi</span>
      </button>

      {/* Bildirim */}
      <NavLink
        to={isAuthenticated ? '/notifications' : '/login'}
        className={linkClass}
      >
        {({ isActive }) => (
          <span className="relative flex flex-col items-center gap-0.5">
            <IconBell className={iconClass(isActive)} />
            {unreadNotifications > 0 && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-black rounded-full" />
            )}
            <span className={labelClass}>Bildirim</span>
          </span>
        )}
      </NavLink>

      {/* Mesajlaşma */}
      <NavLink
        to={isAuthenticated ? '/messages' : '/login'}
        className={linkClass}
      >
        {({ isActive }) => (
          <span className="relative flex flex-col items-center gap-0.5">
            <IconMessage className={iconClass(isActive)} />
            {unreadMessages > 0 && (
              <span className="absolute -top-0.5 -right-1 w-2 h-2 bg-black rounded-full" />
            )}
            <span className={labelClass}>Mesajlar</span>
          </span>
        )}
      </NavLink>

    </nav>
  )
}
