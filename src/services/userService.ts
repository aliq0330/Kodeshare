import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { User } from '@/types'

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const userService = {
  async getProfile(username: string): Promise<User> {
    const { data, error } = await supabase
      .from('profiles').select('*').eq('username', username).single()
    if (error) throw new Error(error.message)
    return mapProfile(data as Record<string, unknown>)
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const userId = await currentUserId()
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
      .eq('id', userId!)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return mapProfile(data as Record<string, unknown>)
  },

  async follow(userId: string): Promise<void> {
    const myId = await currentUserId()
    const { error } = await supabase.from('follows').insert({ follower_id: myId!, following_id: userId })
    if (error) throw new Error(error.message)
    supabase.from('notifications').insert({ user_id: userId, actor_id: myId!, type: 'follow', message: 'Seni takip etmeye başladı' }).then()
  },

  async unfollow(userId: string): Promise<void> {
    const myId = await currentUserId()
    await supabase.from('follows').delete().eq('follower_id', myId!).eq('following_id', userId)
  },

  async isFollowing(userId: string): Promise<boolean> {
    const myId = await currentUserId()
    if (!myId) return false
    const { data } = await supabase
      .from('follows').select('follower_id').eq('follower_id', myId).eq('following_id', userId).maybeSingle()
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
