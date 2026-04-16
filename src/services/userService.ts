import { api } from './api'
import type { User, PaginatedResponse } from '@/types'

export const userService = {
  getProfile:  (username: string)  => api.get<User>(`/users/${username}`).then((r) => r.data),
  updateProfile: (data: Partial<User>) => api.put<User>('/users/me').then((r) => r.data),
  follow:      (userId: string)    => api.post(`/users/${userId}/follow`),
  unfollow:    (userId: string)    => api.delete(`/users/${userId}/follow`),
  getFollowers: (username: string) => api.get<PaginatedResponse<User>>(`/users/${username}/followers`).then((r) => r.data),
  getFollowing: (username: string) => api.get<PaginatedResponse<User>>(`/users/${username}/following`).then((r) => r.data),
  search:      (query: string)     => api.get<User[]>('/users/search', { params: { q: query } }).then((r) => r.data),
  getSuggested: ()                 => api.get<User[]>('/users/suggested').then((r) => r.data),
}
