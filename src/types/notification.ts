import type { UserPreview } from './user'

export type NotificationType =
  | 'like'
  | 'comment'
  | 'reply'
  | 'follow'
  | 'mention'
  | 'repost'
  | 'message'
  | 'collection_save'

export interface Notification {
  id: string
  type: NotificationType
  actor: UserPreview
  postId: string | null
  commentId: string | null
  message: string
  isRead: boolean
  createdAt: string
}
