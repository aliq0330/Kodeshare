import { create } from 'zustand'
import { postService } from '@services/postService'
import type { PostPreview } from '@/types'

interface FetchParams {
  tab?: string
  tag?: string
  query?: string
  page?: number
}

interface PostState {
  posts: PostPreview[]
  isLoading: boolean
  hasNextPage: boolean
  currentPage: number
  fetchPosts: (params: FetchParams) => Promise<void>
  likePost: (id: string) => Promise<void>
  savePost: (id: string) => Promise<void>
  repostPost: (id: string) => Promise<void>
  reset: () => void
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  hasNextPage: true,
  currentPage: 1,

  fetchPosts: async ({ tab, tag, query, page = 1 }) => {
    if (get().isLoading) return
    set({ isLoading: true })
    try {
      const res = await postService.getFeed({ tab, tag, query, page })
      set((s) => ({
        posts: page === 1 ? res.data : [...s.posts, ...res.data],
        hasNextPage: res.hasNextPage,
        currentPage: page,
      }))
    } finally {
      set({ isLoading: false })
    }
  },

  likePost: async (id) => {
    const post = get().posts.find((p) => p.id === id)
    if (!post) return
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likesCount: p.likesCount + (p.isLiked ? -1 : 1) }
          : p,
      ),
    }))
    await (post.isLiked ? postService.unlike(id) : postService.like(id))
  },

  savePost: async (id) => {
    const post = get().posts.find((p) => p.id === id)
    if (!post) return
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id ? { ...p, isSaved: !p.isSaved } : p,
      ),
    }))
    await (post.isSaved ? postService.unsave(id) : postService.save(id))
  },

  repostPost: async (id) => {
    await postService.repost(id)
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id
          ? { ...p, isReposted: true, sharesCount: p.sharesCount + 1 }
          : p,
      ),
    }))
  },

  reset: () => set({ posts: [], currentPage: 1, hasNextPage: true }),
}))
