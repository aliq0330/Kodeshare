import { create } from 'zustand'
import { postService } from '@services/postService'
import type { PostPreview, CreatePostPayload } from '@/types'
import toast from 'react-hot-toast'

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
  createPost: (payload: CreatePostPayload) => Promise<void>
  likePost: (id: string) => Promise<void>
  savePost: (id: string) => Promise<void>
  repostPost: (id: string) => Promise<void>
  incrementCommentCount: (postId: string) => void
  reset: () => void
}

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  hasNextPage: true,
  currentPage: 1,

  fetchPosts: async ({ tab, tag, query, page = 1 }) => {
    if (page > 1 && get().isLoading) return
    if (page === 1) set({ posts: [], isLoading: true })
    else set({ isLoading: true })
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

  createPost: async (payload) => {
    const post = await postService.create(payload)
    set((s) => ({
      posts: [{ ...post, filesCount: post.files.length }, ...s.posts],
    }))
  },

  likePost: async (id) => {
    const post = get().posts.find((p) => p.id === id)
    if (!post) return
    const wasLiked = post.isLiked
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id
          ? { ...p, isLiked: !wasLiked, likesCount: Math.max(0, p.likesCount + (wasLiked ? -1 : 1)) }
          : p,
      ),
    }))
    try {
      await (wasLiked ? postService.unlike(id) : postService.like(id))
    } catch {
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === id ? { ...p, isLiked: wasLiked, likesCount: Math.max(0, p.likesCount + (wasLiked ? 1 : -1)) } : p,
        ),
      }))
      toast.error('Bir hata oluştu')
    }
  },

  savePost: async (id) => {
    const post = get().posts.find((p) => p.id === id)
    if (!post) return
    const wasSaved = post.isSaved
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id ? { ...p, isSaved: !wasSaved } : p,
      ),
    }))
    try {
      await (wasSaved ? postService.unsave(id) : postService.save(id))
    } catch {
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === id ? { ...p, isSaved: wasSaved } : p,
        ),
      }))
      toast.error('Bir hata oluştu')
    }
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

  incrementCommentCount: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
      ),
    })),

  reset: () => set({ posts: [], currentPage: 1, hasNextPage: true }),
}))
