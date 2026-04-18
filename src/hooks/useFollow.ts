import { useState } from 'react'
import { userService } from '@services/userService'
import toast from 'react-hot-toast'

export function useFollow(userId: string, initialFollowing: boolean, initialPending = false) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing)
  const [isPendingRequest, setIsPendingRequest] = useState(initialPending)
  const [loading, setLoading] = useState(false)

  const toggle = async () => {
    setLoading(true)
    try {
      if (isPendingRequest) {
        await userService.unfollow(userId)
        setIsPendingRequest(false)
        toast.success('Takip isteği geri çekildi')
      } else if (isFollowing) {
        await userService.unfollow(userId)
        setIsFollowing(false)
      } else {
        const result = await userService.follow(userId)
        if (result === 'requested') {
          setIsPendingRequest(true)
          toast.success('Takip isteği gönderildi')
        } else {
          setIsFollowing(true)
          toast.success('Takip edildi')
        }
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return { isFollowing, isPendingRequest, loading, toggle }
}
