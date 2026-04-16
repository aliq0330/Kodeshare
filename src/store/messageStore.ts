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
    set((s) => ({
      messages: {
        ...s.messages,
        [conversationId]: [...(s.messages[conversationId] ?? []), message],
      },
    }))
  },
}))
