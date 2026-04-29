import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconRosetteFilled, IconUsers } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { compactNumber } from '@utils/formatters'
import { userService } from '@services/userService'
import FollowButton from '@modules/social/FollowButton'
import { useAuthStore } from '@store/authStore'
import { useFollowStore } from '@store/followStore'
import type { User } from '@/types'

export default function TopUsers() {
  const { user: me, isAuthenticated } = useAuthStore()
  const { followingIds, initialized, init } = useFollowStore()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    userService.getSuggested()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    if (isAuthenticated) init()
  }, [isAuthenticated]) // eslint-disable-line

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (users.length === 0) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {users.slice(0, 3).map((user, i) => (
        <div key={user.id} className="card p-5 flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" online={user.isOnline} />
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-gray-300">
              {i + 1}
            </span>
          </div>
          <div>
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center justify-center gap-1 font-semibold text-white hover:text-brand-300 transition-colors"
            >
              {user.displayName}
              {user.isVerified && <IconRosetteFilled className="w-4 h-4 text-brand-400" />}
            </Link>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-400">
            <IconUsers className="w-4 h-4" />
            {compactNumber(user.followersCount ?? 0)} takipçi
          </div>
          {me && me.id !== user.id && (
            <FollowButton userId={user.id} isFollowing={initialized ? followingIds.has(user.id) : false} size="sm" />
          )}
        </div>
      ))}
    </div>
  )
}
