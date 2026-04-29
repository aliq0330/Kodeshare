import { Link, useNavigate } from 'react-router-dom'
import { IconSearch, IconBell, IconMessage, IconShieldCheck, IconEditCircle } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Dropdown from '@components/ui/Dropdown'
import BurgerMenu from '@components/layout/BurgerMenu'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { useComposerStore } from '@store/composerStore'
import { isAdmin } from '@/lib/admin'
import Button from '@components/ui/Button'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)
  const openComposer = useComposerStore((s) => s.openComposer)

  const userMenuItems = [
    ...(isAdmin(user?.id) ? [{
      label: 'Admin Paneli',
      icon: <IconShieldCheck className="w-4 h-4" />,
      onClick: () => navigate('/admin'),
      divider: false,
    }] : []),
    { label: 'Profil', onClick: () => navigate(`/profile/${user?.username}`) },
    { label: 'Koleksiyonlarım', onClick: () => navigate(`/profile/${user?.username}?tab=collections`) },
    { label: 'Ayarlar', onClick: () => navigate('/settings') },
    { label: 'Çıkış Yap', onClick: logout, danger: true, divider: true },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 border-b border-surface-border bg-surface-card">
      <div className="flex items-center gap-2 h-full max-w-[1440px] mx-auto px-3">

        {/* Burger */}
        <BurgerMenu />

        {/* Logo / spacer */}
        <div className="flex-1" />

        {/* Right icons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/explore', { state: { focusSearch: true } })}
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-500 hover:text-gray-900 transition-colors"
                title="Ara"
              >
                <IconSearch className="w-5 h-5" />
              </button>

              <button
                onClick={openComposer}
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-500 hover:text-gray-900 transition-colors"
                title="Yeni Gönderi"
              >
                <IconEditCircle className="w-5 h-5" />
              </button>

              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-surface-raised text-gray-500 hover:text-gray-900 transition-colors"
              >
                <IconBell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-black rounded-full" />
                )}
              </Link>

              <Link
                to="/messages"
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-500 hover:text-gray-900 transition-colors"
              >
                <IconMessage className="w-5 h-5" />
              </Link>

              <Dropdown
                trigger={
                  <button className="p-1 rounded-full hover:bg-surface-raised transition-colors">
                    <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="xs" />
                  </button>
                }
                items={userMenuItems}
              />
            </>
          ) : (
            <>
              <button
                onClick={() => navigate('/explore', { state: { focusSearch: true } })}
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-500 hover:text-gray-900 transition-colors"
                title="Ara"
              >
                <IconSearch className="w-5 h-5" />
              </button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Giriş Yap</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Kayıt Ol</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
