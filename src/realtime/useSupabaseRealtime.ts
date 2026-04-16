import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { useMessageStore } from '@store/messageStore'
import { mapProfile } from '@store/authStore'
import type { Notification, Message } from '@/types'

export function useSupabaseRealtime() {
  const { user, isAuthenticated } = useAuthStore()
  const pushNotification = useNotificationStore((s) => s.pushNotification)
  const pushMessage = useMessageStore((s) => s.pushMessage)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // Bildirim kanalı
    const notifChannel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const n = payload.new as Record<string, unknown>
          const { data: actor } = await supabase.from('profiles').select('*').eq('id', n.actor_id).single()
          if (!actor) return
          const notification: Notification = {
            id:        n.id as string,
            type:      n.type as Notification['type'],
            actor:     mapProfile(actor as Record<string, unknown>),
            postId:    n.post_id as string | null,
            commentId: n.comment_id as string | null,
            message:   n.message as string,
            isRead:    false,
            createdAt: n.created_at as string,
          }
          pushNotification(notification)
        },
      )
      .subscribe()

    // Mesaj kanalı
    const msgChannel = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        async (payload) => {
          const m = payload.new as Record<string, unknown>
          if (m.sender_id === user.id) return // kendi mesajımızı zaten ekledik

          const { data: sender } = await supabase.from('profiles').select('*').eq('id', m.sender_id).single()
          if (!sender) return

          const message: Message = {
            id:             m.id as string,
            conversationId: m.conversation_id as string,
            content:        m.content as string,
            sender:         mapProfile(sender as Record<string, unknown>),
            status:         m.status as Message['status'],
            createdAt:      m.created_at as string,
          }
          pushMessage(message)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(msgChannel)
    }
  }, [isAuthenticated, user, pushNotification, pushMessage])
}
