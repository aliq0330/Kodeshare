import type { UserPreview } from './user'

export type PostType = 'snippet' | 'project' | 'article' | 'repost'

export type PostLanguage = 'html' | 'css' | 'javascript' | 'typescript' | 'react' | 'vue' | 'other'

export interface PostFile {
  id: string
  name: string
  language: PostLanguage
  content: string
  order: number
}

export interface Post {
  id: string
  type: PostType
  title: string
  description: string | null
  tags: string[]
  files: PostFile[]
  previewImageUrl: string | null
  liveDemoUrl: string | null
  likesCount: number
  commentsCount: number
  sharesCount: number
  savesCount: number
  viewsCount: number
  isLiked: boolean
  isSaved: boolean
  isReposted: boolean
  author: UserPreview
  repostedFrom: Post | null
  createdAt: string
  updatedAt: string
}

export type PostPreview = Omit<Post, 'files'> & { filesCount: number }

export interface CreatePostPayload {
  type: PostType
  title: string
  description?: string
  tags?: string[]
  files: Omit<PostFile, 'id'>[]
  previewImageUrl?: string
  liveDemoUrl?: string
}
