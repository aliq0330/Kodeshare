import type { UserPreview } from './user'

export interface Comment {
  id: string
  postId: string
  content: string
  author: UserPreview
  parentId: string | null
  replies: Comment[]
  likesCount: number
  isLiked: boolean
  mentions: string[]
  createdAt: string
  updatedAt: string
}
