import type { UserPreview } from './user'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface Message {
  id: string
  conversationId: string
  content: string
  sender: UserPreview
  status: MessageStatus
  createdAt: string
}

export interface Conversation {
  id: string
  participants: UserPreview[]
  lastMessage: Message | null
  unreadCount: number
  updatedAt: string
}
