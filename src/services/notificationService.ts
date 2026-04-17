import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { Notification, PaginatedResponse } from '@/types'

const PAGE_SIZE = 30

export const notificationService = {
  async getAll(page = 1): Promise<PaginatedResponse<Notification>> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: [], total: 0, page, limit: PAGE_SIZE, hasNextPage: false }

    const { data, error, count } = await supabase
      .from('notifications')
      .select('*, actor:profiles!notifications_actor_id_fkey(*)', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    const notifications: Notification[] = (data ?? []).map((n) => ({
      id:        n.id,
      type:      n.type as Notification['type'],
      actor:     mapProfile(n.actor as Record<string, unknown>),
      postId:    n.post_id,
      commentId: n.comment_id,
      message:   n.message,
      isRead:    n.is_read,
      createdAt: n.created_at,
    }))
    return { data: notifications, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
  },

  async markRead(id: string): Promise<void> {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  },

  async markAllRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id)
  },

  async delete(id: string): Promise<void> {
    await supabase.from('notifications').delete().eq('id', id)
  },
}
