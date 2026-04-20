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
  lastParams: FetchParams
  fetchPosts: (params: FetchParams) => Promise<void>
  createPost: (payload: CreatePostPayload) => Promise<void>
  likePost: (id: string) => Promise<void>
  savePost: (id: string) => Promise<void>
  repostPost: (id: string) => Promise<void>
  incrementCommentCount: (postId: string) => void
  reset: () => void
}

let fetchSeq = 0

export const usePostStore = create<PostState>((set, get) => ({
  posts: [],
  isLoading: false,
  hasNextPage: true,
  currentPage: 1,
  lastParams: {},

  fetchPosts: async ({ tab, tag, query, page = 1 }) => {
    if (page > 1 && get().isLoading) return
    const seq = ++fetchSeq
    set((s) => ({
      isLoading: true,
      lastParams: { tab, tag, query, page },
      // page=1 yenileme: mevcut postları silmeden loading göster, başarıda değiştir
      ...(page === 1 ? { currentPage: 1, hasNextPage: true } : {}),
    }))
    try {
      const res = await postService.getFeed({ tab, tag, query, page })
      if (seq !== fetchSeq) return
      set((s) => ({
        posts: page === 1 ? res.data : [...s.posts, ...res.data],
        hasNextPage: res.hasNextPage,
        currentPage: page,
      }))
    } catch (err) {
      console.error('[postStore] fetchPosts failed:', err)
      if (seq === fetchSeq) toast.error('Gönderiler yüklenemedi')
    } finally {
      if (seq === fetchSeq) set({ isLoading: false })
    }
  },

  createPost: async (payload) => {
    const post = await postService.create(payload)
    set((s) => ({ posts: [post, ...s.posts] }))
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
    const post = get().posts.find((p) => p.id === id)
    if (!post) return
    const wasReposted = post.isReposted
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === id
          ? {
              ...p,
              isReposted: !wasReposted,
              repostCount: Math.max(0, p.repostCount + (wasReposted ? -1 : 1)),
            }
          : p,
      ),
    }))
    try {
      await (wasReposted ? postService.undoRepost(id) : postService.repost(id))
    } catch {
      set((s) => ({
        posts: s.posts.map((p) =>
          p.id === id
            ? {
                ...p,
                isReposted: wasReposted,
                repostCount: Math.max(0, p.repostCount + (wasReposted ? 1 : -1)),
              }
            : p,
        ),
      }))
      toast.error('Repost işlemi başarısız')
    }
  },

  incrementCommentCount: (postId) =>
    set((s) => ({
      posts: s.posts.map((p) =>
        p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
      ),
    })),

  reset: () => set({ posts: [], currentPage: 1, hasNextPage: true, isLoading: false }),
}))
