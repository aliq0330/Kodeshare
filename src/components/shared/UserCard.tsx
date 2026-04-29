import { Link } from 'react-router-dom'
import { IconRosetteFilled } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import { compactNumber } from '@utils/formatters'
import type { User } from '@/types'

interface UserCardProps {
  user: User
  onFollow?: (userId: string) => void
  isFollowing?: boolean
  className?: string
}

export default function UserCard({ user, onFollow, isFollowing, className }: UserCardProps) {
  return (
    <div className={`card p-4 flex flex-col items-center text-center gap-3 ${className ?? ''}`}>
      <Link to={`/profile/${user.username}`}>
        <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" online={user.isOnline} />
      </Link>

      <div>
        <Link
          to={`/profile/${user.username}`}
          className="flex items-center justify-center gap-1 font-semibold text-white hover:text-brand-300 transition-colors"
        >
          {user.displayName}
          {user.isVerified && <IconRosetteFilled className="w-4 h-4 text-brand-400 shrink-0" />}
        </Link>
        <p className="text-sm text-gray-500">@{user.username}</p>
      </div>

      {user.bio && (
        <p className="text-sm text-gray-400 line-clamp-2">{user.bio}</p>
      )}

      <div className="flex items-center gap-4 text-sm">
        <div className="text-center">
          <p className="font-semibold text-white">{compactNumber(user.postsCount)}</p>
          <p className="text-gray-500 text-xs">Gönderi</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{compactNumber(user.followersCount)}</p>
          <p className="text-gray-500 text-xs">Takipçi</p>
        </div>
        <div className="text-center">
          <p className="font-semibold text-white">{compactNumber(user.followingCount)}</p>
          <p className="text-gray-500 text-xs">Takip</p>
        </div>
      </div>

      {onFollow && (
        <Button
          variant={isFollowing ? 'outline' : 'primary'}
          size="sm"
          fullWidth
          onClick={() => onFollow(user.id)}
        >
          {isFollowing ? 'Takipten Çık' : 'Takip Et'}
        </Button>
      )}
    </div>
  )
}
