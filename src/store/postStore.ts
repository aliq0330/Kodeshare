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
  isError: boolean
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
  isError: false,
  hasNextPage: true,
  currentPage: 1,
  lastParams: {},

  fetchPosts: async ({ tab, tag, query, page = 1 }) => {
    if (page > 1 && get().isLoading) return
    const seq = ++fetchSeq
    set({
      isLoading: true,
      isError: false,
      lastParams: { tab, tag, query, page },
      ...(page === 1 ? { posts: [], currentPage: 1, hasNextPage: true } : {}),
    })

    let res
    // Yavaş ağ veya geçici Supabase hatalarına karşı 3 deneme,
    // exponential backoff (500ms, 1500ms). Sadece gerçek stale seq'te sessiz çık.
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await postService.getFeed({ tab, tag, query, page })
        break
      } catch (err) {
        // Tab/tag değişti — kullanıcı yeni bir istek tetikledi, sessizce çık.
        if (seq !== fetchSeq) { set({ isLoading: false }); return }

        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, attempt === 0 ? 500 : 1500))
          if (seq !== fetchSeq) { set({ isLoading: false }); return }
          continue
        }
        console.error('[postStore] fetchPosts failed:', err)
        set({ isError: true, isLoading: false })
        toast.error('Gönderiler yüklenemedi')
        return
      }
    }

    if (seq !== fetchSeq) { set({ isLoading: false }); return }
    set((s) => ({
      posts: page === 1 ? res!.data : [...s.posts, ...res!.data],
      hasNextPage: res!.hasNextPage,
      currentPage: page,
      isError: false,
      isLoading: false,
    }))

    // Hydration arka planda: like/save/repost durumları ve repostedFrom verisi
    // posts üzerinde mutate edilir; tamamlanınca yeniden render için yeni
    // referansla set ederiz. Stale fetch'e ait hydration'lar yok sayılır.
    if (res?.hydrate) {
      void res.hydrate().then(() => {
        if (seq !== fetchSeq) return
        set((s) => ({ posts: s.posts.map((p) => ({ ...p })) }))
      })
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

  reset: () => set({ posts: [], currentPage: 1, hasNextPage: true, isLoading: false, isError: false }),
}))
