import { api } from './api'
import type { Conversation, Message, PaginatedResponse } from '@/types'

export const messageService = {
  getConversations:  ()                          => api.get<Conversation[]>('/messages/conversations').then((r) => r.data),
  getMessages:       (conversationId: string, page = 1) =>
    api.get<PaginatedResponse<Message>>(`/messages/${conversationId}`, { params: { page } }).then((r) => r.data),
  send:              (conversationId: string, content: string) =>
    api.post<Message>(`/messages/${conversationId}`, { content }).then((r) => r.data),
  startConversation: (userId: string)            => api.post<Conversation>('/messages/conversations', { userId }).then((r) => r.data),
  markRead:          (conversationId: string)    => api.put(`/messages/${conversationId}/read`),
}
