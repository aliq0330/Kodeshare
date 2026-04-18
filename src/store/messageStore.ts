import { create } from 'zustand'
import { messageService } from '@services/messageService'
import type { Conversation, Message } from '@/types'

interface MessageState {
  conversations: Conversation[]
  messages: Record<string, Message[]>
  isLoading: boolean
  fetchConversations: () => Promise<void>
  fetchMessages: (conversationId: string) => Promise<void>
  sendMessage: (conversationId: string, content: string) => Promise<void>
  pushMessage: (message: Message) => void
  markConversationRead: (conversationId: string) => Promise<void>
}

export const useMessageStore = create<MessageState>((set, get) => ({
  conversations: [],
  messages: {},
  isLoading: false,

  fetchConversations: async () => {
    set({ isLoading: true })
    const data = await messageService.getConversations()
    set({ conversations: data, isLoading: false })
  },

  fetchMessages: async (conversationId) => {
    const res = await messageService.getMessages(conversationId)
    set((s) => ({ messages: { ...s.messages, [conversationId]: res.data } }))
  },

  sendMessage: async (conversationId, content) => {
    const msg = await messageService.send(conversationId, content)
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), msg],
      },
    }))
  },

  pushMessage: (message) => {
    const { conversationId } = message
    set((s) => {
      const existing = s.messages[conversationId] ?? []
      if (existing.some((m) => m.id === message.id)) return s
      return {
        messages: {
          ...s.messages,
          [conversationId]: [...existing, message],
        },
        conversations: s.conversations.map((c) =>
          c.id === conversationId
            ? { ...c, lastMessage: message, unreadCount: c.unreadCount + 1, updatedAt: message.createdAt }
            : c
        ),
      }
    })
  },

  markConversationRead: async (conversationId) => {
    await messageService.markRead(conversationId)
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }))
  },
}))
