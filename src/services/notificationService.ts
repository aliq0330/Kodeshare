import { api } from './api'
import type { Notification, PaginatedResponse } from '@/types'

export const notificationService = {
  getAll:      (page = 1) => api.get<PaginatedResponse<Notification>>('/notifications', { params: { page } }).then((r) => r.data),
  markRead:    (id: string) => api.put(`/notifications/${id}/read`),
  markAllRead: ()           => api.put('/notifications/read-all'),
  delete:      (id: string) => api.delete(`/notifications/${id}`),
}
