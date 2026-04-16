import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { User } from '@/types'

export const userService = {
  async getProfile(username: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('username', username).single()
    if (error) throw new Error(error.message)
    return mapProfile(data as Record<string, unknown>)
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('profiles')
      .update({
        display_name: updates.displayName,
        bio:          updates.bio,
        location:     updates.location,
        website:      updates.website,
        github_url:   updates.githubUrl,
        twitter_url:  updates.twitterUrl,
        avatar_url:   updates.avatarUrl,
        cover_url:    updates.coverUrl,
      })
      .eq('id', user!.id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapProfile(data as Record<string, unknown>)
  },

  async follow(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('follows').insert({ follower_id: user!.id, following_id: userId })
    if (error) throw new Error(error.message)
    supabase.from('notifications').insert({ user_id: userId, actor_id: user!.id, type: 'follow' }).then()
  },

  async unfollow(userId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('follows').delete().eq('follower_id', user!.id).eq('following_id', userId)
  },

  async isFollowing(userId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false
    const { data } = await supabase
      .from('follows').select('follower_id').eq('follower_id', user.id).eq('following_id', userId).maybeSingle()
    return !!data
  },

  async getFollowers(username: string): Promise<User[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []
    const { data } = await supabase
      .from('follows').select('follower:profiles!follows_follower_id_fkey(*)').eq('following_id', (profile as { id: string }).id)
    return (data ?? []).map((r: Record<string, unknown>) => mapProfile(r.follower as Record<string, unknown>))
  },

  async getFollowing(username: string): Promise<User[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []
    const { data } = await supabase
      .from('follows').select('following:profiles!follows_following_id_fkey(*)').eq('follower_id', (profile as { id: string }).id)
    return (data ?? []).map((r: Record<string, unknown>) => mapProfile(r.following as Record<string, unknown>))
  },

  async search(query: string): Promise<User[]> {
    const { data } = await supabase
      .from('profiles').select('*')
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20)
    return (data ?? []).map((p) => mapProfile(p as Record<string, unknown>))
  },

  async getSuggested(): Promise<User[]> {
    const { data } = await supabase
      .from('profiles').select('*').order('followers_count', { ascending: false }).limit(6)
    return (data ?? []).map((p) => mapProfile(p as Record<string, unknown>))
  },
}
