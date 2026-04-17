import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { Comment } from '@/types'

export const commentService = {
  async getComments(postId: string): Promise<Comment[]> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)')
      .eq('post_id', postId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    const topLevel = (data ?? []).map((c) => mapComment(c as Record<string, unknown>, user?.id))

    const withReplies = await Promise.all(
      topLevel.map(async (c) => {
        const { data: replies } = await supabase
          .from('comments')
          .select('*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)')
          .eq('parent_id', c.id)
          .order('created_at', { ascending: true })
        return { ...c, replies: (replies ?? []).map((r) => mapComment(r as Record<string, unknown>, user?.id)) }
      })
    )

    return withReplies
  },

  async create(postId: string, content: string, parentId?: string): Promise<Comment> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: user.id, content, parent_id: parentId ?? null })
      .select('*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)')
      .single()
    if (error) throw new Error(error.message)

    // Bildirim: yorum yapıldığında gönderi sahibine haber ver
    if (!parentId) {
      const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single()
      if (post && (post as { author_id: string }).author_id !== user.id) {
        supabase.from('notifications').insert({
          user_id: (post as { author_id: string }).author_id,
          actor_id: user.id,
          type: 'comment',
          post_id: postId,
          message: 'Gönderini yorumladı',
        }).then()
      }
    }

    return { ...mapComment(data as Record<string, unknown>, user.id), replies: [] }
  },

  async delete(commentId: string): Promise<void> {
    await supabase.from('comments').delete().eq('id', commentId)
  },

  async like(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Giriş yapmalısın')
    await supabase.from('comment_likes').insert({ user_id: user.id, comment_id: commentId })
  },

  async unlike(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('comment_likes').delete().eq('user_id', user.id).eq('comment_id', commentId)
  },
}

function mapComment(c: Record<string, unknown>, userId?: string): Comment {
  const likes = (c.comment_likes as { user_id: string }[]) ?? []
  return {
    id:         c.id as string,
    postId:     c.post_id as string,
    content:    c.content as string,
    author:     mapProfile(c.author as Record<string, unknown>),
    parentId:   c.parent_id as string | null,
    replies:    [],
    likesCount: (c.likes_count as number) ?? 0,
    isLiked:    userId ? likes.some((l) => l.user_id === userId) : false,
    mentions:   [],
    createdAt:  c.created_at as string,
    updatedAt:  c.updated_at as string,
  }
}
