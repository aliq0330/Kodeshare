import { useState } from 'react'
import { Bell, Check } from 'lucide-react'
import Button from '@components/ui/Button'
import Tabs from '@components/ui/Tabs'
import NotificationItem from './components/NotificationItem'
import { useNotificationStore } from '@store/notificationStore'

const TABS = [
  { id: 'all',      label: 'Tümü' },
  { id: 'unread',   label: 'Okunmamış' },
  { id: 'mentions', label: 'Bahsedenler' },
]

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const { notifications, markAllRead } = useNotificationStore()

  const filtered = activeTab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : activeTab === 'mentions'
    ? notifications.filter((n) => n.type === 'mention')
    : notifications

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-bold text-white">
          <Bell className="w-5 h-5 text-brand-400" />
          Bildirimler
        </h1>
        <Button variant="ghost" size="sm" onClick={markAllRead}>
          <Check className="w-4 h-4" />
          Tümünü Okundu İşaretle
        </Button>
      </div>

      <Tabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Bell className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="font-medium">Bildirim yok</p>
          <p className="text-sm mt-1">Yeni bildirimler burada görünecek</p>
        </div>
      ) : (
        <div className="card divide-y divide-surface-border overflow-hidden">
          {filtered.map((notif) => (
            <NotificationItem key={notif.id} notification={notif} />
          ))}
        </div>
      )}
    </div>
  )
}
