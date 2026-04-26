import { useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink } from 'react-router-dom'
import { Menu, X, Home, Compass, Star, Code2, FileText, User, Settings } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'

const NAV_ITEMS = [
  { to: '/',         icon: Home,    label: 'Ana Sayfa', end: true },
  { to: '/explore',  icon: Compass, label: 'Keşfet' },
  { to: '/editor',   icon: Code2,   label: 'Editör' },
  { to: '/featured', icon: Star,    label: 'Öne Çıkanlar' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-sm font-medium',
    isActive
      ? 'text-white bg-surface-raised'
      : 'text-gray-400 hover:text-white hover:bg-surface-raised'
  )

export default function BurgerMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const { user, isAuthenticated } = useAuthStore()
  const close = () => setIsOpen(false)

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
              'lg:hidden fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm transition-opacity duration-300',
              isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            )}
            onClick={close}
          />

          {/* Drawer */}
          <div
            className={cn(
              'lg:hidden fixed top-0 left-0 z-[9999] h-full w-64 bg-surface border-r border-surface-border flex flex-col transition-transform duration-300 ease-in-out',
              isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
          >
            <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border shrink-0">
              <span className="font-bold text-white">Menü</span>
              <button
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
                onClick={close}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 flex flex-col gap-1 p-3 overflow-y-auto">
              {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
                <NavLink key={to} to={to} end={end} onClick={close} className={linkClass}>
                  <Icon className="w-5 h-5 shrink-0" />
                  {label}
                </NavLink>
              ))}

              {isAuthenticated && (
                <NavLink to="/makaleler" onClick={close} className={linkClass}>
                  <FileText className="w-5 h-5 shrink-0" />
                  Makalelerim
                </NavLink>
              )}

              {isAuthenticated && (
                <NavLink to={`/profile/${user?.username}`} onClick={close} className={linkClass}>
                  <User className="w-5 h-5 shrink-0" />
                  Profilim
                </NavLink>
              )}

              {isAuthenticated && (
                <NavLink to="/settings" onClick={close} className={linkClass}>
                  <Settings className="w-5 h-5 shrink-0" />
                  Ayarlar
                </NavLink>
              )}
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  )
}
