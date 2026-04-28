import type { UserPreview } from './user'
import type { PostPreview } from './post'

export interface Series {
  id: string
  title: string
  description: string | null
  coverImage: string | null
  postsCount: number
  author: UserPreview
  posts: PostPreview[]
  createdAt: string
  updatedAt: string
}

export interface CreateSeriesPayload {
  title: string
  description?: string
  coverImage?: string
}
