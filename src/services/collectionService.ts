import { api } from './api'
import type { Collection, CreateCollectionPayload } from '@/types'

export const collectionService = {
  getUserCollections: (username: string) =>
    api.get<Collection[]>(`/users/${username}/collections`).then((r) => r.data),
  getCollection:  (id: string)                          => api.get<Collection>(`/collections/${id}`).then((r) => r.data),
  create:         (payload: CreateCollectionPayload)    => api.post<Collection>('/collections', payload).then((r) => r.data),
  update:         (id: string, payload: Partial<CreateCollectionPayload>) =>
    api.put<Collection>(`/collections/${id}`, payload).then((r) => r.data),
  delete:         (id: string)                          => api.delete(`/collections/${id}`),
  addPost:        (collectionId: string, postId: string)    => api.post(`/collections/${collectionId}/posts/${postId}`),
  removePost:     (collectionId: string, postId: string)    => api.delete(`/collections/${collectionId}/posts/${postId}`),
}
