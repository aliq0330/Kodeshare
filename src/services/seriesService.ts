import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import { POSTS_PREVIEW_SELECT, hydratePostPreviewRows } from '@services/postService'
import type { Series, CreateSeriesPayload, PostPreview } from '@/types'

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const seriesService = {
  async getUserSeries(username: string): Promise<Series[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    if (!profile) return []

    const { data, error } = await supabase
      .from('series')
      .select('*, author:profiles!series_author_id_fkey(*)')
      .eq('author_id', (profile as { id: string }).id)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((s) => mapSeries(s as Record<string, unknown>))
  },

  async getSeries(id: string): Promise<Series> {
    const { data, error } = await supabase
      .from('series')
      .select('*, author:profiles!series_author_id_fkey(*)')
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return mapSeries(data as Record<string, unknown>)
  },

  async create(payload: CreateSeriesPayload): Promise<Series> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')
    const { data, error } = await supabase
      .from('series')
      .insert({ author_id: userId, title: payload.title, description: payload.description ?? null, cover_image: payload.coverImage ?? null })
      .select('*, author:profiles!series_author_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapSeries(data as Record<string, unknown>)
  },

  async update(id: string, payload: Partial<CreateSeriesPayload>): Promise<Series> {
    const { data, error } = await supabase
      .from('series')
      .update({ title: payload.title, description: payload.description ?? null, cover_image: payload.coverImage ?? null })
      .eq('id', id)
      .select('*, author:profiles!series_author_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapSeries(data as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await supabase.from('series').delete().eq('id', id)
  },

  async addPost(seriesId: string, postId: string, position: number): Promise<void> {
    const { error } = await supabase
      .from('series_posts')
      .insert({ series_id: seriesId, post_id: postId, position })
    if (error && error.code !== '23505') throw new Error(error.message)
  },

  async removePost(seriesId: string, postId: string): Promise<void> {
    await supabase.from('series_posts').delete().eq('series_id', seriesId).eq('post_id', postId)
  },

  async getSeriesPosts(seriesId: string): Promise<PostPreview[]> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('series_posts')
      .select(`position, post:posts!series_posts_post_id_fkey(${POSTS_PREVIEW_SELECT})`)
      .eq('series_id', seriesId)
      .order('position', { ascending: true })
    if (error) throw new Error(error.message)
    const rows = (data ?? [])
      .sort((a, b) => (a as { position: number }).position - (b as { position: number }).position)
      .map((sp) => (sp as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
    return hydratePostPreviewRows(rows, userId)
  },

  async getSeriesIdsForPost(postId: string): Promise<string[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data } = await supabase
      .from('series_posts')
      .select('series_id, series:series!series_posts_series_id_fkey(author_id)')
      .eq('post_id', postId)
    type Row = { series_id: string; series: { author_id: string } | null }
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.series?.author_id === userId)
      .map((r) => r.series_id)
  },

  async reorderPosts(seriesId: string, orderedPostIds: string[]): Promise<void> {
    const updates = orderedPostIds.map((postId, idx) =>
      supabase.from('series_posts').update({ position: idx }).eq('series_id', seriesId).eq('post_id', postId)
    )
    await Promise.all(updates)
  },
}

function mapSeries(s: Record<string, unknown>): Series {
  return {
    id:          s.id as string,
    title:       s.title as string,
    description: s.description as string | null,
    coverImage:  s.cover_image as string | null,
    postsCount:  s.posts_count as number,
    author:      mapProfile(s.author as Record<string, unknown>),
    posts:       [],
    createdAt:   s.created_at as string,
    updatedAt:   s.updated_at as string,
  }
}
