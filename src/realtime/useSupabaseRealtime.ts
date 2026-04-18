import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { useMessageStore } from '@store/messageStore'
import { mapProfile } from '@store/authStore'
import type { Notification, Message } from '@/types'

export function useSupabaseRealtime() {
  const { user, isAuthenticated } = useAuthStore()
  const fetchNotifications  = useNotificationStore((s) => s.fetchNotifications)
  const pushNotification    = useNotificationStore((s) => s.pushNotification)
  const removeNotification  = useNotificationStore((s) => s.removeNotification)
  const pushMessage         = useMessageStore((s) => s.pushMessage)

  const notifRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const msgRef   = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return

    // İlk bağlantıda bildirimleri yükle
    fetchNotifications()

    // Önceki kanalları temizle
    if (notifRef.current) { supabase.removeChannel(notifRef.current).catch(() => {}); notifRef.current = null }
    if (msgRef.current)   { supabase.removeChannel(msgRef.current).catch(() => {});   msgRef.current   = null }

    // Eşsiz kanal adı — StrictMode çift çalışmasında çakışmayı önler
    const uid = user.id
    const rand = Math.random().toString(36).slice(2)

    try {
      notifRef.current = supabase
        .channel(`notifs-${uid}-${rand}`)
        .on(
          'postgres_changes',
          // Filter yok — DELETE olayında REPLICA IDENTITY FULL olmadan sadece PK gelir,
          // user_id filtresi çalışmaz. ID store'da yoksa removeNotification no-op'tur.
          { event: 'DELETE', schema: 'public', table: 'notifications' },
          (payload) => {
            const old = payload.old as { id?: string }
            if (old?.id) removeNotification(old.id)
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${uid}` },
          async (payload) => {
            try {
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
            } catch { /* bildirim parse hatası */ }
          },
        )
        .subscribe()
    } catch { /* realtime hatası uygulamayı çökertmesin */ }

    try {
      msgRef.current = supabase
        .channel(`msgs-${uid}-${rand}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'messages' },
          async (payload) => {
            try {
              const m = payload.new as Record<string, unknown>
              if (m.sender_id === uid) return
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
            } catch { /* mesaj parse hatası */ }
          },
        )
        .subscribe()
    } catch { /* realtime hatası uygulamayı çökertmesin */ }

    return () => {
      if (notifRef.current) { supabase.removeChannel(notifRef.current).catch(() => {}); notifRef.current = null }
      if (msgRef.current)   { supabase.removeChannel(msgRef.current).catch(() => {});   msgRef.current   = null }
    }
  }, [isAuthenticated, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps
}
