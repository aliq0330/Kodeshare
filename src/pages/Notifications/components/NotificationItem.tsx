import { Link, useNavigate } from 'react-router-dom'
import { Heart, MessageCircle, UserPlus, AtSign, GitFork, Reply, Mail } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useNotificationStore } from '@store/notificationStore'
import type { Notification, NotificationType } from '@/types'

interface NotificationItemProps {
  notification: Notification
}

const icons: Record<NotificationType, { icon: typeof Heart; color: string }> = {
  like:            { icon: Heart,          color: 'text-red-400' },
  comment:         { icon: MessageCircle,  color: 'text-blue-400' },
  reply:           { icon: Reply,          color: 'text-cyan-400' },
  follow:          { icon: UserPlus,       color: 'text-green-400' },
  follow_request:  { icon: UserPlus,       color: 'text-yellow-400' },
  mention:         { icon: AtSign,         color: 'text-yellow-400' },
  repost:          { icon: GitFork,        color: 'text-purple-400' },
  message:         { icon: Mail,           color: 'text-brand-400' },
  collection_save: { icon: Heart,          color: 'text-orange-400' },
}

function notificationTarget(n: Notification): string {
  if (n.type === 'follow') return `/profile/${n.actor.username}`
  if (n.type === 'message') return '/messages'
  if (n.type === 'comment' || n.type === 'reply' || n.type === 'mention') {
    if (n.postId && n.commentId) return `/post/${n.postId}#comment-${n.commentId}`
    if (n.postId) return `/post/${n.postId}`
    return `/profile/${n.actor.username}`
  }
  return n.postId ? `/post/${n.postId}` : `/profile/${n.actor.username}`
}

export default function NotificationItem({ notification }: NotificationItemProps) {
  const navigate = useNavigate()
  const markRead = useNotificationStore((s) => s.markRead)
  const { icon: Icon, color } = icons[notification.type]

  const handleOpen = () => {
    if (!notification.isRead) void markRead(notification.id)
    navigate(notificationTarget(notification))
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen() } }}
      className={cn('flex items-start gap-3 p-4 hover:bg-surface-raised transition-colors cursor-pointer outline-none focus-visible:bg-surface-raised', !notification.isRead && 'bg-brand-900/10')}
    >
      {!notification.isRead && (
        <span className="w-2 h-2 rounded-full bg-brand-500 mt-2 shrink-0" />
      )}
      <div className="relative shrink-0">
        <Avatar src={notification.actor.avatarUrl} alt={notification.actor.displayName} size="sm" />
        <span className={cn('absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-surface-card flex items-center justify-center', color)}>
          <Icon className="w-2.5 h-2.5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300">
          <Link
            to={`/profile/${notification.actor.username}`}
            onClick={(e) => e.stopPropagation()}
            className="font-medium text-white hover:text-brand-300"
          >
            {notification.actor.displayName}
          </Link>
          {' '}{notification.message}
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{timeAgo(notification.createdAt)}</p>
      </div>
    </div>
  )
}
