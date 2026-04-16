import { useState } from 'react'
import { UserPlus, UserMinus } from 'lucide-react'
import Button from '@components/ui/Button'
import { cn } from '@utils/cn'

interface FollowButtonProps {
  userId: string
  isFollowing: boolean
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

export default function FollowButton({ userId: _, isFollowing: initial, size = 'sm', className }: FollowButtonProps) {
  const [following, setFollowing] = useState(initial)
  const [loading, setLoading] = useState(false)
  const [hovered, setHovered] = useState(false)

  const toggle = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 300))
    setFollowing((f) => !f)
    setLoading(false)
  }

  return (
    <Button
      variant={following ? 'outline' : 'primary'}
      size={size}
      loading={loading}
      onClick={toggle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(following && hovered && 'border-red-500 text-red-400 hover:bg-red-900/20', className)}
    >
      {following ? (
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
