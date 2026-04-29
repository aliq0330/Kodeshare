import { useState } from 'react'
import type { ComponentType } from 'react'
import { IconUser, IconBell, IconLock, IconPalette, IconWorld } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import AccountSettings from './components/AccountSettings'
import AppearanceSettings from './components/AppearanceSettings'
import NotificationSettings from './components/NotificationSettings'
import PrivacySettings from './components/PrivacySettings'

const SECTIONS: { id: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: 'account',       label: 'Hesap',      icon: IconUser },
  { id: 'appearance',    label: 'Görünüm',    icon: IconPalette },
  { id: 'notifications', label: 'Bildirimler', icon: IconBell },
  { id: 'privacy',       label: 'Gizlilik',   icon: IconLock },
]

export default function SettingsPage() {
  const [active, setActive] = useState('account')

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-4">
      <h1 className="text-xl font-bold text-white">Ayarlar</h1>

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Sidebar nav */}
        <nav className="sm:w-52 shrink-0 flex sm:flex-col gap-1 overflow-x-auto scrollbar-none">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                active === id
                  ? 'bg-brand-900/60 text-brand-300'
                  : 'text-gray-400 hover:bg-surface-raised hover:text-white',
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {active === 'account'       && <AccountSettings />}
          {active === 'appearance'    && <AppearanceSettings />}
          {active === 'notifications' && <NotificationSettings />}
          {active === 'privacy'       && <PrivacySettings />}
        </div>
      </div>
    </div>
  )
}
