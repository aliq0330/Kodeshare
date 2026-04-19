import type { UserPreview } from './user'

export type PostType = 'post' | 'repost' | 'project'

export type PostBlockType = 'snippet' | 'project' | 'image' | 'link' | 'video' | 'article'

export interface PostBlock {
  id: string
  type: PostBlockType
  position: number
  data: Record<string, unknown>
}

export interface Post {
  id: string
  type: PostType
  title: string
  description: string | null
  tags: string[]
  blocks: PostBlock[]
  previewImageUrl: string | null
  likesCount: number
  commentsCount: number
  sharesCount: number
  savesCount: number
  viewsCount: number
  repostCount: number
  isLiked: boolean
  isSaved: boolean
  isReposted: boolean
  isEdited: boolean
  author: UserPreview
  repostedFrom: Post | null
  createdAt: string
  updatedAt: string
}

export type PostPreview = Post

export interface CreatePostPayload {
  type?: PostType
  title: string
  description?: string
  tags?: string[]
  blocks?: Array<{ type: PostBlockType; position: number; data: Record<string, unknown> }>
  previewImageUrl?: string
  repostedFrom?: string
}
