import { supabase } from '@/lib/supabase'

export const adminService = {
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

  async deletePost(postId: string) {
    const { error } = await supabase.from('posts').delete().eq('id', postId)
    if (error) throw new Error(error.message)
  },

  async deleteComment(commentId: string) {
    const { error } = await supabase.from('comments').delete().eq('id', commentId)
    if (error) throw new Error(error.message)
  },

  async getStats() {
    const [usersRes, postsRes, commentsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ])
    return {
      users:    usersRes.count   ?? 0,
      posts:    postsRes.count   ?? 0,
      comments: commentsRes.count ?? 0,
    }
  },
}
