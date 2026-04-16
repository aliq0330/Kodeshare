import type { UserPreview } from './user'
import type { PostPreview } from './post'

export type CollectionVisibility = 'public' | 'private'

export interface Collection {
  id: string
  name: string
  description: string | null
  coverUrl: string | null
  visibility: CollectionVisibility
  postsCount: number
  owner: UserPreview
  posts: PostPreview[]
  createdAt: string
  updatedAt: string
}

export interface CreateCollectionPayload {
  name: string
  description?: string
  coverUrl?: string
  visibility: CollectionVisibility
}
