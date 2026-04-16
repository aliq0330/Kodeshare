import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Home, Compass, Star, Bell, User, Plus } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import PostComposer from '@modules/post/PostComposer'

const items = [
  { to: '/',              icon: Home,    label: 'Ana Sayfa', end: true },
  { to: '/explore',       icon: Compass, label: 'Keşfet' },
  { to: '/featured',      icon: Star,    label: 'Öne Çıkanlar' },
  { to: '/notifications', icon: Bell,    label: 'Bildirimler', auth: true },
]

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const [composerOpen, setComposerOpen] = useState(false)

  return (
    <>
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

        {isAuthenticated ? (
          <>
            <button
              onClick={() => setComposerOpen(true)}
              className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors text-gray-500"
            >
              <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center -mt-5 shadow-lg shadow-brand-500/40 ring-4 ring-surface">
                <Plus className="w-4 h-4 text-white" />
              </div>
              <span className="text-[10px] font-medium">Paylaş</span>
            </button>

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
        ) : (
          <NavLink
            to="/login"
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Giriş</span>
          </NavLink>
        )}
      </nav>

      {/* PostComposer modal controlled from FAB */}
      {isAuthenticated && (
        <MobileComposer open={composerOpen} onClose={() => setComposerOpen(false)} />
      )}
    </>
  )
}

function MobileComposer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <PostComposer forceOpen={open} onClose={onClose} />
}
