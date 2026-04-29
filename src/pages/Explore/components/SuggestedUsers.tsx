import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Avatar from '@components/ui/Avatar'
import { IconRosetteFilled } from '@tabler/icons-react'
import FollowButton from '@modules/social/FollowButton'
import { userService } from '@services/userService'
import { useAuthStore } from '@store/authStore'
import { useFollowStore } from '@store/followStore'
import type { User } from '@/types'

interface SuggestedUsersProps {
  query?: string
}

export default function SuggestedUsers({ query }: SuggestedUsersProps) {
  const { user: me, isAuthenticated } = useAuthStore()
  const { followingIds, initialized, init } = useFollowStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    const fetch = query?.trim()
      ? userService.search(query.trim())
      : userService.getSuggested()
    fetch.then(setUsers).catch(() => setUsers([])).finally(() => setLoading(false))
  }, [query])

  useEffect(() => {
    if (isAuthenticated) init()
  }, [isAuthenticated]) // eslint-disable-line

  if (loading) return null
  if (users.length === 0) {
    if (query?.trim()) {
      return (
        <div>
          <h2 className="text-base font-semibold text-white mb-3">Kullanıcılar</h2>
          <p className="text-sm text-gray-500">Kullanıcı bulunamadı.</p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-3">
        {query?.trim() ? 'Kullanıcılar' : 'Öne Çıkan Geliştiriciler'}
      </h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {users.map((user) => (
          <div key={user.id} className="card p-4 flex flex-col items-center gap-2 min-w-[140px] shrink-0">
            <Link to={`/profile/${user.username}`}>
              <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
            </Link>
            <div className="text-center">
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-1 justify-center text-sm font-medium text-white hover:text-brand-300 transition-colors"
              >
                {user.displayName}
                {user.isVerified && <IconRosetteFilled className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
              <p className="text-xs text-gray-500">{(user.followersCount ?? 0).toLocaleString()} takipçi</p>
            </div>
            {isAuthenticated && me?.id !== user.id && (
              <FollowButton
                userId={user.id}
                isFollowing={initialized ? followingIds.has(user.id) : false}
                size="xs"
                className="w-full"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
