import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { Collection, CreateCollectionPayload } from '@/types'

export const collectionService = {
  async getUserCollections(username: string): Promise<Collection[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []

    const { data: { user } } = await supabase.auth.getUser()
    let q = supabase
      .from('collections')
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .eq('owner_id', (profile as { id: string }).id)
      .order('updated_at', { ascending: false })

    if (user?.id !== (profile as { id: string }).id) {
      q = q.eq('visibility', 'public')
    }

    const { data, error } = await q
    if (error) throw new Error(error.message)
    return (data ?? []).map((c) => mapCollection(c as Record<string, unknown>))
  },

  async getCollection(id: string): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .select(`*, owner:profiles!collections_owner_id_fkey(*)`)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return mapCollection(data as Record<string, unknown>)
  },

  async create(payload: CreateCollectionPayload): Promise<Collection> {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('collections')
      .insert({ owner_id: user!.id, name: payload.name, description: payload.description, visibility: payload.visibility })
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapCollection(data as Record<string, unknown>)
  },

  async update(id: string, payload: Partial<CreateCollectionPayload>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update({ name: payload.name, description: payload.description, visibility: payload.visibility })
      .eq('id', id)
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapCollection(data as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await supabase.from('collections').delete().eq('id', id)
  },

  async addPost(collectionId: string, postId: string): Promise<void> {
    await supabase.from('collection_posts').insert({ collection_id: collectionId, post_id: postId })
  },

  async removePost(collectionId: string, postId: string): Promise<void> {
    await supabase.from('collection_posts').delete().eq('collection_id', collectionId).eq('post_id', postId)
  },
}

function mapCollection(c: Record<string, unknown>): Collection {
  return {
    id:          c.id as string,
    name:        c.name as string,
    description: c.description as string | null,
    coverUrl:    c.cover_url as string | null,
    visibility:  c.visibility as 'public' | 'private',
    postsCount:  c.posts_count as number,
    owner:       mapProfile(c.owner as Record<string, unknown>),
    posts:       [],
    createdAt:   c.created_at as string,
    updatedAt:   c.updated_at as string,
  }
}
