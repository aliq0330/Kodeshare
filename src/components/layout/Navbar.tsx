import { useNavigate } from 'react-router-dom'
import { IconShieldCheck } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Dropdown from '@components/ui/Dropdown'
import BurgerMenu from '@components/layout/BurgerMenu'
import { useAuthStore } from '@store/authStore'
import { isAdmin } from '@/lib/admin'
import Button from '@components/ui/Button'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()

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
            <Dropdown
              trigger={
                <button className="p-1 rounded-full hover:bg-surface-raised transition-colors">
                  <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="xs" />
                </button>
              }
              items={userMenuItems}
            />
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Giriş Yap</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Kayıt Ol</Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
