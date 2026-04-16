import { useState } from 'react'
import { userService } from '@services/userService'
import toast from 'react-hot-toast'

export function useFollow(userId: string, initialFollowing: boolean) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      if (isFollowing) {
        await userService.unfollow(userId)
        setIsFollowing(false)
      } else {
        await userService.follow(userId)
        setIsFollowing(true)
        toast.success('Takip edildi')
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return { isFollowing, loading, toggle }
}
