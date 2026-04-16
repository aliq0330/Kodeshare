import { api } from './api'
import type { Post, PostPreview, CreatePostPayload, PaginatedResponse } from '@/types'

interface FeedParams {
  tab?: string
  tag?: string
  query?: string
  page?: number
  limit?: number
}

export const postService = {
  getFeed:   (params: FeedParams)           => api.get<PaginatedResponse<PostPreview>>('/posts/feed', { params }).then((r) => r.data),
  getPost:   (id: string)                   => api.get<Post>(`/posts/${id}`).then((r) => r.data),
  create:    (payload: CreatePostPayload)   => api.post<Post>('/posts', payload).then((r) => r.data),
  update:    (id: string, payload: Partial<CreatePostPayload>) => api.put<Post>(`/posts/${id}`, payload).then((r) => r.data),
  delete:    (id: string)                   => api.delete(`/posts/${id}`),
  like:      (id: string)                   => api.post(`/posts/${id}/like`),
  unlike:    (id: string)                   => api.delete(`/posts/${id}/like`),
  save:      (id: string)                   => api.post(`/posts/${id}/save`),
  unsave:    (id: string)                   => api.delete(`/posts/${id}/save`),
  repost:    (id: string)                   => api.post(`/posts/${id}/repost`),
  getUserPosts: (username: string, params?: FeedParams) =>
    api.get<PaginatedResponse<PostPreview>>(`/users/${username}/posts`, { params }).then((r) => r.data),
}
