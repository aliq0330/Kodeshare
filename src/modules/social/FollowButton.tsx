import { useState } from 'react'
import { UserPlus, UserMinus, Clock } from 'lucide-react'
import Button from '@components/ui/Button'
import { cn } from '@utils/cn'
import { useFollow } from '@hooks/useFollow'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  isPendingRequest?: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export default function FollowButton({ userId, isFollowing: initial, isPendingRequest: initialPending = false, size = 'sm', className }: FollowButtonProps) {
  const { isFollowing, isPendingRequest, loading, toggle } = useFollow(userId, initial, initialPending)
  const [hovered, setHovered] = useState(false)

  if (isPendingRequest) {
    return (
      <Button
        variant="outline"
        size={size}
        loading={loading}
        onClick={toggle}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(hovered && 'border-red-500 text-red-400 hover:bg-red-900/20', className)}
      >
        {hovered
          ? <><UserMinus className="w-3.5 h-3.5" />İsteği Geri Çek</>
          : <><Clock className="w-3.5 h-3.5" />İstek Gönderildi</>
        }
      </Button>
    )
  }

  return (
    <Button
      variant={isFollowing ? 'outline' : 'primary'}
      size={size}
      loading={loading}
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(isFollowing && hovered && 'border-red-500 text-red-400 hover:bg-red-900/20', className)}
    >
      {isFollowing ? (
        hovered ? (
          <><UserMinus className="w-3.5 h-3.5" />Takipten Çık</>
        ) : (
          <><UserPlus className="w-3.5 h-3.5" />Takip Ediliyor</>
        )
      ) : (
        <><UserPlus className="w-3.5 h-3.5" />Takip Et</>
      )}
    </Button>
  )
}
