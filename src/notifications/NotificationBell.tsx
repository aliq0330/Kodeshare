import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { useNotificationStore } from '@store/notificationStore'

export default function NotificationBell() {
  const unreadCount = useNotificationStore((s) => s.unreadCount)

  return (
    <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors">
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-brand-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </Link>
  )
}
