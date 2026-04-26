import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  Menu, X, Home, Compass, Star, Hash, Bell,
  MessageSquare, Bookmark, User, Settings, Code2, PenSquare,
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'
import { useComposerStore } from '@store/composerStore'
import Avatar from '@components/ui/Avatar'

const PUBLIC_NAV = [
  { to: '/',         icon: Home,    label: 'Ana Sayfa',    end: true },
  { to: '/explore',  icon: Compass, label: 'Keşfet' },
  { to: '/featured', icon: Star,    label: 'Öne Çıkanlar' },
  { to: '/explore',  icon: Hash,    label: 'Etiketler' },
]

const AUTH_NAV = [
  { to: '/notifications', icon: Bell,          label: 'Bildirimler' },
  { to: '/messages',      icon: MessageSquare, label: 'Mesajlar' },
  { to: '',               icon: Bookmark,      label: 'Koleksiyonlar', dynamic: true },
  { to: '',               icon: User,          label: 'Profil',        dynamic: true },
  { to: '/settings',      icon: Settings,      label: 'Ayarlar' },
]

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const { openComposer } = useComposerStore()
  const navigate = useNavigate()

  const close = () => setIsOpen(false)

  const handleNewPost = () => {
    close()
    openComposer()
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-sm font-medium',
      isActive
        ? 'bg-surface-raised text-white'
        : 'text-gray-400 hover:text-white hover:bg-surface-raised'
    )

  const getDynamicTo = (label: string) => {
    if (label === 'Profil') return `/profile/${user?.username}`
    if (label === 'Koleksiyonlar') return `/profile/${user?.username}?tab=collections`
    return '/'
  }

  return (
    <>
      <button
        className="lg:hidden p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Menüyü aç"
      >
        <Menu className="w-5 h-5" />
      </button>

      {createPortal(
        <>
          {/* Backdrop */}
          <div
            className={cn(
              'lg:hidden fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
              isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={close}
          />

          {/* Drawer */}
          <div
            className={cn(
              'lg:hidden fixed top-0 left-0 z-[9999] h-full w-80 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-surface-border shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0">
                  <Code2 className="w-4 h-4 text-black" />
                </div>
                <span className="font-bold text-white text-base">Kodeshare</span>
              </div>
              <button
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
                onClick={close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav */}
            <nav className="flex-1 flex flex-col gap-0.5 p-3 overflow-y-auto">
              {PUBLIC_NAV.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={label} to={to} end={end} onClick={close} className={linkClass}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}

              {isAuthenticated && (
                <>
                  <div className="my-2 border-t border-surface-border" />
                  {AUTH_NAV.map(({ icon: Icon, label, dynamic, to }) => {
                    const href = dynamic ? getDynamicTo(label) : to
                    return (
                      <NavLink key={label} to={href} onClick={close} className={linkClass}>
                        <Icon className="w-5 h-5 shrink-0" />
                        {label}
                      </NavLink>
                    )
                  })}
                </>
              )}
            </nav>

            {/* Footer */}
            <div className="shrink-0 border-t border-surface-border p-3 flex flex-col gap-3">
              {isAuthenticated && (
                <button
                  onClick={handleNewPost}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-black font-semibold text-sm hover:bg-gray-100 transition-colors"
                >
                  <PenSquare className="w-4 h-4" />
                  Yeni Gönderi
                </button>
              )}

              {isAuthenticated && user && (
                <button
                  onClick={() => { navigate(`/profile/${user.username}`); close() }}
                  className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-surface-raised transition-colors"
                >
                  <Avatar src={user.avatarUrl} alt={user.displayName ?? ''} size="sm" />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-500 truncate">@{user.username}</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
