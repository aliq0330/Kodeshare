export interface User {
  id: string
  username: string
  displayName: string
  email: string
  avatarUrl: string | null
  coverUrl: string | null
  bio: string | null
  location: string | null
  website: string | null
  githubUrl: string | null
  twitterUrl: string | null
  followersCount: number
  followingCount: number
  postsCount: number
  isVerified: boolean
  isOnline: boolean
  lastSeenAt: string | null
  createdAt: string
}

export interface FollowState {
  isFollowing: boolean
  isFollowedBy: boolean
}

export type UserPreview = Pick<
  User,
  'id' | 'username' | 'displayName' | 'avatarUrl' | 'isVerified' | 'isOnline'
>
