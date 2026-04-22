import { Link, useNavigate } from 'react-router-dom'
import { Code2, Search, Bell, Mail, Plus, ShieldCheck, FileText } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Dropdown from '@components/ui/Dropdown'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { isAdmin } from '@/lib/admin'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, isAuthenticated, logout } = useAuthStore()
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  const userMenuItems = [
    ...(isAdmin(user?.id) ? [{
      label: 'Admin Paneli',
      icon: <ShieldCheck className="w-4 h-4" />,
      onClick: () => navigate('/admin'),
      divider: false,
    }] : []),
    { label: 'Profil', onClick: () => navigate(`/profile/${user?.username}`) },
    { label: 'Koleksiyonlarım', onClick: () => navigate(`/profile/${user?.username}?tab=collections`) },
    { label: 'Ayarlar', onClick: () => navigate('/settings') },
    { label: 'Çıkış Yap', onClick: logout, danger: true, divider: true },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="flex items-center justify-between h-full max-w-[1440px] mx-auto px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <Code2 className="w-6 h-6 text-brand-400" />
          <span className="font-bold text-white hidden sm:block">Kodeshare</span>
        </Link>

        {/* Search */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <button
            onClick={() => navigate('/explore')}
            className="w-full flex items-center gap-2 bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-sm text-gray-500 hover:border-brand-500 transition-colors"
          >
            <Search className="w-4 h-4" />
            Ara — proje, kullanıcı, etiket...
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/makale')}
                className="hidden md:inline-flex"
              >
                <FileText className="w-4 h-4" />
                Makale Yaz
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/editor')}
                className="hidden sm:inline-flex"
              >
                <Plus className="w-4 h-4" />
                Yeni Proje
              </Button>

              <Link
                to="/notifications"
                className="relative p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                to="/messages"
                className="p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
              >
                <Mail className="w-5 h-5" />
              </Link>

              <Dropdown
                trigger={
                  <button className="rounded-full focus-visible:ring-2 focus-visible:ring-brand-500">
                    <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" online />
                  </button>
                }
                items={userMenuItems}
              />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Giriş Yap
              </Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>
                Kayıt Ol
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
