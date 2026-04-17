import { create } from 'zustand'
import { commentService } from '@services/commentService'
import { usePostStore } from '@store/postStore'
import type { Comment } from '@/types'

interface CommentState {
  commentsByPost: Record<string, Comment[]>
  isLoading: Record<string, boolean>
  fetchComments: (postId: string) => Promise<void>
  addComment: (postId: string, content: string) => Promise<void>
  addReply: (postId: string, parentId: string, content: string) => Promise<void>
  toggleLike: (postId: string, commentId: string) => Promise<void>
}

export const useCommentStore = create<CommentState>((set, get) => ({
  commentsByPost: {},
  isLoading: {},

  fetchComments: async (postId) => {
    set((s) => ({ isLoading: { ...s.isLoading, [postId]: true } }))
    try {
      const comments = await commentService.getComments(postId)
      set((s) => ({ commentsByPost: { ...s.commentsByPost, [postId]: comments } }))
    } finally {
      set((s) => ({ isLoading: { ...s.isLoading, [postId]: false } }))
    }
  },

  addComment: async (postId, content) => {
    const comment = await commentService.create(postId, content)
    set((s) => ({
      commentsByPost: {
        ...s.commentsByPost,
        [postId]: [...(s.commentsByPost[postId] ?? []), comment],
      },
    }))
    usePostStore.getState().incrementCommentCount(postId)
  },

  addReply: async (postId, parentId, content) => {
    const reply = await commentService.create(postId, content, parentId)
    set((s) => ({
      commentsByPost: {
        ...s.commentsByPost,
        [postId]: (s.commentsByPost[postId] ?? []).map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c
        ),
      },
    }))
  },

  toggleLike: async (postId, commentId) => {
    const all = get().commentsByPost[postId] ?? []
    const comment =
      all.find((c) => c.id === commentId) ??
      all.flatMap((c) => c.replies).find((r) => r.id === commentId)
    if (!comment) return

    const wasLiked = comment.isLiked

    const toggle = (list: Comment[]): Comment[] =>
      list.map((c) => {
        if (c.id === commentId)
          return { ...c, isLiked: !wasLiked, likesCount: c.likesCount + (wasLiked ? -1 : 1) }
        return { ...c, replies: toggle(c.replies) }
      })

    set((s) => ({ commentsByPost: { ...s.commentsByPost, [postId]: toggle(s.commentsByPost[postId] ?? []) } }))

    try {
      if (wasLiked) await commentService.unlike(commentId)
      else await commentService.like(commentId)
    } catch {
      // Hata durumunda geri al
      set((s) => ({ commentsByPost: { ...s.commentsByPost, [postId]: toggle(s.commentsByPost[postId] ?? []) } }))
    }
  },
}))
