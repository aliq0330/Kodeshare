export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface NotificationPrefs {
  likes:    boolean
  comments: boolean
  replies:  boolean
  follows:  boolean
  mentions: boolean
  messages: boolean
  reposts:  boolean
  email:    boolean
}

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  likes: true, comments: true, replies: true, follows: true,
  mentions: true, messages: true, reposts: true, email: false,
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          display_name: string
          avatar_url: string | null
          cover_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          github_url: string | null
          twitter_url: string | null
          is_verified: boolean
          is_online: boolean
          last_seen_at: string | null
          followers_count: number
          following_count: number
          posts_count: number
          notification_prefs: NotificationPrefs
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'is_verified' | 'is_online' | 'followers_count' | 'following_count' | 'posts_count' | 'notification_prefs'> & { notification_prefs?: NotificationPrefs }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      posts: {
        Row: {
          id: string
          author_id: string
          type: 'snippet' | 'project' | 'article' | 'repost' | 'gonderi'
          title: string
          description: string | null
          tags: string[]
          preview_image_url: string | null
          live_demo_url: string | null
          reposted_from: string | null
          likes_count: number
          comments_count: number
          shares_count: number
          saves_count: number
          views_count: number
          repost_count: number
          is_published: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'likes_count' | 'comments_count' | 'shares_count' | 'saves_count' | 'views_count' | 'repost_count' | 'is_published' | 'created_at' | 'updated_at'> & { is_published?: boolean }
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      post_files: {
        Row: { id: string; post_id: string; name: string; language: string; content: string; order: number }
        Insert: Omit<Database['public']['Tables']['post_files']['Row'], 'id'>
        Update: Partial<Database['public']['Tables']['post_files']['Insert']>
      }
      post_likes: {
        Row: { user_id: string; post_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['post_likes']['Row'], 'created_at'>
        Update: never
      }
      post_saves: {
        Row: { user_id: string; post_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['post_saves']['Row'], 'created_at'>
        Update: never
      }
      comments: {
        Row: { id: string; post_id: string; author_id: string; content: string; parent_id: string | null; likes_count: number; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['comments']['Row'], 'id' | 'likes_count' | 'created_at' | 'updated_at'>
        Update: Partial<Pick<Database['public']['Tables']['comments']['Row'], 'content'>>
      }
      follows: {
        Row: { follower_id: string; following_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['follows']['Row'], 'created_at'>
        Update: never
      }
      collections: {
        Row: { id: string; owner_id: string; name: string; description: string | null; cover_url: string | null; visibility: 'public' | 'private'; posts_count: number; created_at: string; updated_at: string }
        Insert: Omit<Database['public']['Tables']['collections']['Row'], 'id' | 'posts_count' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['collections']['Insert']>
      }
      collection_posts: {
        Row: { collection_id: string; post_id: string; created_at: string }
        Insert: Omit<Database['public']['Tables']['collection_posts']['Row'], 'created_at'>
        Update: never
      }
      conversations: {
        Row: { id: string; created_at: string; updated_at: string }
        Insert: Record<string, never>
        Update: never
      }
      conversation_participants: {
        Row: { conversation_id: string; user_id: string }
        Insert: Database['public']['Tables']['conversation_participants']['Row']
        Update: never
      }
      messages: {
        Row: { id: string; conversation_id: string; sender_id: string; content: string; status: 'sent' | 'delivered' | 'read'; created_at: string }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['messages']['Row'], 'status'>>
      }
      notifications: {
        Row: { id: string; user_id: string; actor_id: string; type: string; post_id: string | null; comment_id: string | null; message: string; is_read: boolean; created_at: string }
        Insert: Omit<Database['public']['Tables']['notifications']['Row'], 'id' | 'created_at'>
        Update: Partial<Pick<Database['public']['Tables']['notifications']['Row'], 'is_read'>>
      }
    }
  }
}
