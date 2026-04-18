import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { useNotificationStore } from '@store/notificationStore'
import { userService } from '@services/userService'
import toast from 'react-hot-toast'
import type { User } from '@/types'

interface FollowRequestItemProps {
  requester: User
  createdAt: string
  onHandled: (requesterId: string) => void
}

export default function FollowRequestItem({ requester, createdAt, onHandled }: FollowRequestItemProps) {
  const removeFollowRequest = useNotificationStore((s) => s.removeFollowRequest)
  const [loading, setLoading] = useState<'approve' | 'reject' | null>(null)

  const handleApprove = async () => {
    setLoading('approve')
    try {
      await userService.approveFollowRequest(requester.id)
      removeFollowRequest(requester.id)
      onHandled(requester.id)
      toast.success(`${requester.displayName} artık seni takip ediyor`)
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  const handleReject = async () => {
    setLoading('reject')
    try {
      await userService.rejectFollowRequest(requester.id)
      removeFollowRequest(requester.id)
      onHandled(requester.id)
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex items-center gap-3 p-4 border-b border-surface-border last:border-0">
      <Link to={`/profile/${requester.username}`} className="shrink-0">
        <Avatar src={requester.avatarUrl} alt={requester.displayName} size="sm" />
      </Link>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-300">
          <Link
            to={`/profile/${requester.username}`}
            className="font-medium text-white hover:text-brand-300"
          >
            {requester.displayName}
          </Link>
          {' '}seni takip etmek istiyor
        </p>
        <p className="text-xs text-gray-600 mt-0.5">{timeAgo(createdAt)}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={handleApprove}
          disabled={loading !== null}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Check className="w-3.5 h-3.5" />
          {loading === 'approve' ? '...' : 'Onayla'}
        </button>
        <button
          onClick={handleReject}
          disabled={loading !== null}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-red-900/60 hover:bg-red-600 text-red-300 hover:text-white transition-colors disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
