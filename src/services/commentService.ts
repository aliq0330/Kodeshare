import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import { notify, notifyMentions } from './notificationHelpers'
import type { Comment } from '@/types'

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const commentService = {
  async getComments(postId: string): Promise<Comment[]> {
    const userId = await currentUserId()

    const { data, error } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    const repliesByParent = new Map<string, Comment[]>()
    const topLevel: Comment[] = []
    for (const row of (data ?? []) as Record<string, unknown>[]) {
      const mapped = mapComment(row, userId)
      const parentId = row.parent_id as string | null
      if (parentId) {
        const arr = repliesByParent.get(parentId) ?? []
        arr.push(mapped)
        repliesByParent.set(parentId, arr)
      } else {
        topLevel.push(mapped)
      }
    }
    for (const c of topLevel) {
      c.replies = repliesByParent.get(c.id) ?? []
    }
    return topLevel
  },

  async create(postId: string, content: string, parentId?: string): Promise<Comment> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')

    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: userId, content, parent_id: parentId ?? null })
      .select('*, author:profiles!comments_author_id_fkey(*), comment_likes(user_id)')
      .single()
    if (error) throw new Error(error.message)

    const newCommentId = (data as { id: string }).id
    const excludeUserIds: string[] = []

    if (parentId) {
      const { data: parent } = await supabase
        .from('comments')
        .select('author_id')
        .eq('id', parentId)
        .single()
      if (parent) {
        const parentAuthorId = (parent as { author_id: string }).author_id
        excludeUserIds.push(parentAuthorId)
        void notify({
          userId:    parentAuthorId,
          actorId:   userId,
          type:      'reply',
          postId,
          commentId: newCommentId,
          message:   'Yorumuna yanıt verdi',
        })
      }
    } else {
      const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single()
      if (post) {
        const postAuthorId = (post as { author_id: string }).author_id
        excludeUserIds.push(postAuthorId)
        void notify({
          userId:    postAuthorId,
          actorId:   userId,
          type:      'comment',
          postId,
          commentId: newCommentId,
          message:   'Gönderini yorumladı',
        })
      }
    }

    void notifyMentions({
      text:      content,
      actorId:   userId,
      postId,
      commentId: newCommentId,
      message:   'Seni bir yorumda etiketledi',
      excludeUserIds,
    })

    return { ...mapComment(data as Record<string, unknown>, userId), replies: [] }
  },

  async delete(commentId: string): Promise<void> {
    await supabase.from('comments').delete().eq('id', commentId)
  },

  async like(commentId: string): Promise<void> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')
    await supabase.from('comment_likes').insert({ user_id: userId, comment_id: commentId })
  },

  async unlike(commentId: string): Promise<void> {
    const userId = await currentUserId()
    if (!userId) return
    await supabase.from('comment_likes').delete().eq('user_id', userId).eq('comment_id', commentId)
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
