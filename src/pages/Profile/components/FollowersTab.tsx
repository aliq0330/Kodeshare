import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BadgeCheck } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import FollowButton from '@modules/social/FollowButton'
import { userService } from '@services/userService'
import { useAuthStore } from '@store/authStore'
import { useFollowStore } from '@store/followStore'
import type { User } from '@/types'

interface FollowersTabProps {
  username: string
  type: 'followers' | 'following'
}

export default function FollowersTab({ username, type }: FollowersTabProps) {
  const { user: me, isAuthenticated } = useAuthStore()
  const { followingIds, initialized, init } = useFollowStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const fn = type === 'followers' ? userService.getFollowers : userService.getFollowing
    fn(username)
      .then(setUsers)
      .catch(() => {})
      .finally(() => setIsLoading(false))
    if (isAuthenticated) init()
  }, [username, type, isAuthenticated]) // eslint-disable-line

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>

  if (users.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <p className="font-medium">{type === 'followers' ? 'Henüz takipçi yok' : 'Henüz takip edilmiyor'}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {users.map((user) => (
        <div key={user.id} className="card p-4 flex items-center justify-between gap-3">
          <Link to={`/profile/${user.username}`} className="flex items-center gap-3 min-w-0">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" online={user.isOnline} />
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-medium text-white text-sm truncate">{user.displayName}</span>
                {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
              </div>
              <p className="text-xs text-gray-500">@{user.username}</p>
            </div>
          </Link>
          {isAuthenticated && me?.id !== user.id && (
            <FollowButton
              userId={user.id}
              isFollowing={initialized ? followingIds.has(user.id) : false}
              size="xs"
            />
          )}
        </div>
      ))}
    </div>
  )
}
