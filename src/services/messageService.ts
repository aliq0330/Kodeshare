import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { Conversation, Message, PaginatedResponse } from '@/types'

export const messageService = {
  async getConversations(): Promise<Conversation[]> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data } = await supabase
      .from('conversation_participants')
      .select(`
        conversation:conversations(
          id, updated_at,
          conversation_participants(user:profiles(*)),
          messages(id, content, sender_id, status, created_at, order: created_at)
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { referencedTable: 'conversations', ascending: false })

    return (data ?? []).map((row: Record<string, unknown>) => {
      const conv = row.conversation as Record<string, unknown>
      const participants = (conv.conversation_participants as { user: Record<string, unknown> }[])
        .map((p) => mapProfile(p.user))
        .filter((p) => p.id !== user.id)
      const msgs = (conv.messages as Record<string, unknown>[]) ?? []
      const lastMsg = msgs.length ? msgs[msgs.length - 1] : null
      return {
        id:           conv.id as string,
        participants,
        lastMessage:  lastMsg ? mapMessage(lastMsg, participants[0] as unknown as Record<string, unknown>) : null,
        unreadCount:  msgs.filter((m) => m.sender_id !== user.id && m.status !== 'read').length,
        updatedAt:    conv.updated_at as string,
      }
    })
  },

  async getMessages(conversationId: string, page = 1): Promise<PaginatedResponse<Message>> {
    const PAGE_SIZE = 50
    const { data, error, count } = await supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(*)', { count: 'exact' })
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    const messages = (data ?? []).map((m) => mapMessage(m as Record<string, unknown>, m.sender as Record<string, unknown>))
    return { data: messages, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
  },

  async send(conversationId: string, content: string): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: user!.id, content, status: 'sent' })
      .select('*, sender:profiles!messages_sender_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapMessage(data as Record<string, unknown>, (data as Record<string, unknown>).sender as Record<string, unknown>)
  },

  async startConversation(userId: string): Promise<Conversation> {
    const { data: { user } } = await supabase.auth.getUser()

    const { data: conv } = await supabase.from('conversations').insert({}).select().single()
    const convId = (conv as { id: string }).id
    await supabase.from('conversation_participants').insert([
      { conversation_id: convId, user_id: user!.id },
      { conversation_id: convId, user_id: userId },
    ])

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single()
    return {
      id:           convId,
      participants: [mapProfile(profile as Record<string, unknown>)],
      lastMessage:  null,
      unreadCount:  0,
      updatedAt:    new Date().toISOString(),
    }
  },

  async markRead(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('messages')
      .update({ status: 'read' })
      .eq('conversation_id', conversationId)
      .neq('sender_id', user!.id)
  },
}

function mapMessage(m: Record<string, unknown>, sender: Record<string, unknown>): Message {
  return {
    id:             m.id as string,
    conversationId: m.conversation_id as string,
    content:        m.content as string,
    sender:         mapProfile(sender),
    status:         m.status as Message['status'],
    createdAt:      m.created_at as string,
  }
}
