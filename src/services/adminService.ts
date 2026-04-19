import { supabase } from '@/lib/supabase'

export const adminService = {
  // ── Genel istatistikler ────────────────────────────────────────
  async getStats() {
    const [usersRes, postsRes, commentsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ])
    return {
      users:    usersRes.count    ?? 0,
      posts:    postsRes.count    ?? 0,
      comments: commentsRes.count ?? 0,
    }
  },

  // ── Liste (admin paneli ana sekmeleri) ─────────────────────────
  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, is_verified, is_online, followers_count, following_count, posts_count, created_at')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getAllPosts(page = 0) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, type, likes_count, comments_count, views_count, created_at, author:profiles!author_id(id, username, display_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(page * 50, page * 50 + 49)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getAllComments(page = 0) {
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, likes_count, created_at, author:profiles!author_id(id, username, display_name, avatar_url), post:posts!post_id(id, title)')
      .order('created_at', { ascending: false })
      .range(page * 50, page * 50 + 49)
    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Tekli silme (ana panel) ────────────────────────────────────
  async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw new Error(error.message)
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw new Error(error.message)
  },

  // ── Kullanıcı detay ────────────────────────────────────────────
  async getUserById(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url, bio, is_verified, is_online, followers_count, following_count, posts_count, created_at')
      .eq('id', userId)
      .single()
    if (error) throw new Error(error.message)
    return data
  },

  async getUserActivity(userId: string) {
    const [postsRes, commentsRes, collectionsRes, likesRes, savesRes, messagesRes] = await Promise.all([
      supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId),
      supabase.from('collections').select('id', { count: 'exact', head: true }).eq('owner_id', userId),
      supabase.from('post_likes').select('post_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('post_saves').select('post_id', { count: 'exact', head: true }).eq('user_id', userId),
      supabase.from('messages').select('id', { count: 'exact', head: true }).eq('sender_id', userId),
    ])
    return {
      posts:       postsRes.count       ?? 0,
      comments:    commentsRes.count    ?? 0,
      collections: collectionsRes.count ?? 0,
      likes:       likesRes.count       ?? 0,
      saves:       savesRes.count       ?? 0,
      messages:    messagesRes.count    ?? 0,
    }
  },

  async getUserPosts(userId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, type, likes_count, comments_count, created_at')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getUserComments(userId: string) {
    const { data, error } = await supabase
      .from('comments')
      .select('id, content, likes_count, created_at, post:posts!post_id(id, title)')
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getUserCollections(userId: string) {
    const { data, error } = await supabase
      .from('collections')
      .select('id, name, posts_count, visibility, created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getUserLikes(userId: string) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('post_id, created_at, post:posts!post_id(id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getUserSaves(userId: string) {
    const { data, error } = await supabase
      .from('post_saves')
      .select('post_id, created_at, post:posts!post_id(id, title)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  async getUserMessages(userId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('id, content, created_at, status')
      .eq('sender_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return data ?? []
  },

  // ── Toplu silme ────────────────────────────────────────────────
  async deleteAllUserPosts(userId: string) {
    const { error } = await supabase.from('posts').delete().eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async deleteAllUserComments(userId: string) {
    const { error } = await supabase.from('comments').delete().eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async deleteAllUserCollections(userId: string) {
    const { error } = await supabase.from('collections').delete().eq('owner_id', userId)
    if (error) throw new Error(error.message)
  },

  async deleteAllUserLikes(userId: string) {
    const { error } = await supabase.from('post_likes').delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  async deleteAllUserSaves(userId: string) {
    const { error } = await supabase.from('post_saves').delete().eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  async deleteAllUserMessages(userId: string) {
    const { error } = await supabase.from('messages').delete().eq('sender_id', userId)
    if (error) throw new Error(error.message)
  },

  // ── Hesap silme ────────────────────────────────────────────────
  async deleteUserAccount(userId: string) {
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId })
    if (error) throw new Error(error.message)
  },
}
