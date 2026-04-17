import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '@components/ui/Avatar'
import { BadgeCheck } from 'lucide-react'
import FollowButton from '@modules/social/FollowButton'
import { userService } from '@services/userService'
import { useAuthStore } from '@store/authStore'
import type { User } from '@/types'

export default function SuggestedUsers() {
  const { user: me, isAuthenticated } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    userService.getSuggested().then(setUsers).catch(() => {})
  }, [])

  if (users.length === 0) return null

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-3">Öne Çıkan Geliştiriciler</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {users.map((user) => (
          <div key={user.id} className="card p-4 flex flex-col items-center gap-2 min-w-[140px] shrink-0">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
            <div className="text-center">
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-1 justify-center text-sm font-medium text-white hover:text-brand-300 transition-colors"
              >
                {user.displayName}
                {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
              <p className="text-xs text-gray-500">{(user.followersCount ?? 0).toLocaleString()} takipçi</p>
            </div>
            {isAuthenticated && me?.id !== user.id && (
              <FollowButton userId={user.id} isFollowing={false} size="xs" className="w-full" />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
