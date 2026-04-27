import { create } from 'zustand'
import { userService } from '@services/userService'

interface FollowStoreState {
  followingIds: Set<string>
  initialized: boolean
  init: () => Promise<void>
  add: (userId: string) => void
  remove: (userId: string) => void
  reset: () => void
}

export const useFollowStore = create<FollowStoreState>()((set, get) => ({
  followingIds: new Set(),
  initialized: false,

  init: async () => {
    if (get().initialized) return
    try {
      const ids = await userService.getFollowingIds()
      set({ followingIds: ids, initialized: true })
    } catch {}
  },

  add: (userId) =>
    set((s) => ({ followingIds: new Set([...s.followingIds, userId]) })),

  remove: (userId) => {
    const next = new Set(get().followingIds)
    next.delete(userId)
    set({ followingIds: next })
  },

  reset: () => set({ followingIds: new Set(), initialized: false }),
}))
