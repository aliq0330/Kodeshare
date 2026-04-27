import { useState, useEffect } from 'react'
import { userService } from '@services/userService'
import { useFollowStore } from '@store/followStore'
import toast from 'react-hot-toast'

export function useFollow(userId: string, initialFollowing: boolean, initialPending = false) {
  const { initialized, followingIds, add, remove } = useFollowStore()

  const [isFollowing, setIsFollowing] = useState(
    initialized ? followingIds.has(userId) : initialFollowing,
  )
  const [isPendingRequest, setIsPendingRequest] = useState(initialPending)
  const [loading, setLoading] = useState(false)

  // Store yüklendiğinde veya userId değiştiğinde senkronize et
  useEffect(() => {
    if (initialized) setIsFollowing(followingIds.has(userId))
  }, [initialized, userId]) // eslint-disable-line

  const toggle = async () => {
    setLoading(true)
    try {
      if (isPendingRequest) {
        await userService.unfollow(userId)
        setIsPendingRequest(false)
        remove(userId)
        toast.success('Takip isteği geri çekildi')
      } else if (isFollowing) {
        await userService.unfollow(userId)
        setIsFollowing(false)
        remove(userId)
      } else {
        const result = await userService.follow(userId)
        if (result === 'requested') {
          setIsPendingRequest(true)
          toast.success('Takip isteği gönderildi')
        } else {
          setIsFollowing(true)
          add(userId)
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
