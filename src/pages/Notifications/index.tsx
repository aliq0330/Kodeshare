import { useCallback, useEffect, useState } from 'react'
import { Bell, Check, UserPlus } from 'lucide-react'
import Button from '@components/ui/Button'
import Tabs from '@components/ui/Tabs'
import NotificationItem from './components/NotificationItem'
import FollowRequestItem from './components/FollowRequestItem'
import { useNotificationStore } from '@store/notificationStore'
import { userService } from '@services/userService'
import { notificationService } from '@services/notificationService'
import type { User } from '@/types'

const TABS = [
  { id: 'all',      label: 'Tümü' },
  { id: 'unread',   label: 'Okunmamış' },
  { id: 'mentions', label: 'Bahsedenler' },
]

interface PendingRequest {
  id: string
  requester: User
  createdAt: string
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([])
  const { notifications, markAllRead, fetchNotifications } = useNotificationStore()

  const reconcile = useCallback(async () => {
    const [reqs] = await Promise.all([
      userService.getPendingFollowRequests(),
      fetchNotifications(),
    ])
    setPendingRequests(reqs)

    // follow_requests tablosunda karşılığı olmayan follow_request bildirimlerini temizle
    const active = new Set(reqs.map((r) => r.requester.id))
    const stale = useNotificationStore.getState().notifications.filter(
      (n) => n.type === 'follow_request' && !active.has(n.actor.id),
    )
    for (const n of stale) {
      try { await notificationService.delete(n.id) } catch { /* noop */ }
      useNotificationStore.getState().removeNotification(n.id)
    }
  }, [fetchNotifications])

  useEffect(() => {
    reconcile()
    const onVisible = () => {
      if (document.visibilityState === 'visible') reconcile()
    }
    window.addEventListener('focus', reconcile)
    document.addEventListener('visibilitychange', onVisible)
    const interval = window.setInterval(reconcile, 10_000)
    return () => {
      window.removeEventListener('focus', reconcile)
      document.removeEventListener('visibilitychange', onVisible)
      window.clearInterval(interval)
    }
  }, [reconcile])

  const handleRequestHandled = (requesterId: string) => {
    setPendingRequests((prev) => prev.filter((r) => r.requester.id !== requesterId))
  }

  const regular = notifications.filter((n) => n.type !== 'follow_request')
  const filtered = activeTab === 'unread'
    ? regular.filter((n) => !n.isRead)
    : activeTab === 'mentions'
    ? regular.filter((n) => n.type === 'mention')
    : regular

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

      {pendingRequests.length > 0 && (
        <div className="card overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-surface-border bg-surface-raised">
            <UserPlus className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-white">Takip İstekleri</h2>
            <span className="ml-auto text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-medium">
              {pendingRequests.length}
            </span>
          </div>
          {pendingRequests.map((r) => (
            <FollowRequestItem
              key={r.id}
              requester={r.requester}
              createdAt={r.createdAt}
              onHandled={handleRequestHandled}
            />
          ))}
        </div>
      )}

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
