import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import { POSTS_PREVIEW_SELECT, hydratePostPreviewRows } from '@services/postService'
import type { Collection, CreateCollectionPayload, PostPreview } from '@/types'

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const collectionService = {
  async getUserCollections(username: string): Promise<Collection[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []

    const userId = await currentUserId()
    let q = supabase
      .from('collections')
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .eq('owner_id', (profile as { id: string }).id)
      .order('updated_at', { ascending: false })

    if (userId !== (profile as { id: string }).id) {
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
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('collections')
      .insert({ owner_id: userId!, name: payload.name, description: payload.description, cover_url: payload.coverUrl ?? null, visibility: payload.visibility })
      .select('*, owner:profiles!collections_owner_id_fkey(*)')
      .single()
    if (error) throw new Error(error.message)
    return mapCollection(data as Record<string, unknown>)
  },

  async update(id: string, payload: Partial<CreateCollectionPayload>): Promise<Collection> {
    const { data, error } = await supabase
      .from('collections')
      .update({ name: payload.name, description: payload.description, cover_url: payload.coverUrl ?? null, visibility: payload.visibility })
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

  async addArticle(collectionId: string, articleId: string): Promise<void> {
    const { error } = await supabase.from('collection_articles').insert({ collection_id: collectionId, article_id: articleId })
    if (error && error.code !== '23505') throw new Error(error.message)
  },

  async removeArticle(collectionId: string, articleId: string): Promise<void> {
    const { error } = await supabase.from('collection_articles').delete().eq('collection_id', collectionId).eq('article_id', articleId)
    if (error) throw new Error(error.message)
  },

  async getCollectionIdsForPost(postId: string): Promise<string[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data } = await supabase
      .from('collection_posts')
      .select('collection_id, collection:collections!collection_posts_collection_id_fkey(owner_id)')
      .eq('post_id', postId)
    type Row = { collection_id: string; collection: { owner_id: string } | null }
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.collection?.owner_id === userId)
      .map((r) => r.collection_id)
  },

  async getCollectionIdsForArticle(articleId: string): Promise<string[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data } = await supabase
      .from('collection_articles')
      .select('collection_id, collection:collections!collection_articles_collection_id_fkey(owner_id)')
      .eq('article_id', articleId)
    type Row = { collection_id: string; collection: { owner_id: string } | null }
    return ((data ?? []) as unknown as Row[])
      .filter((r) => r.collection?.owner_id === userId)
      .map((r) => r.collection_id)
  },

  async getCollectionPosts(collectionId: string): Promise<PostPreview[]> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('collection_posts')
      .select(`post:posts!collection_posts_post_id_fkey(${POSTS_PREVIEW_SELECT})`)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const rows = (data ?? [])
      .map((cp) => (cp as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
    return hydratePostPreviewRows(rows, userId)
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
