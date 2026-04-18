import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
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
      .insert({ owner_id: userId!, name: payload.name, description: payload.description, visibility: payload.visibility })
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

  async getCollectionPosts(collectionId: string): Promise<PostPreview[]> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('collection_posts')
      .select('post:posts!collection_posts_post_id_fkey(*, author:profiles!posts_author_id_fkey(*), post_files(id,name,language), post_likes(user_id), post_saves(user_id))')
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((cp) => mapPostPreview((cp as Record<string, unknown>).post as Record<string, unknown>, userId))
  },
}

function mapPostPreview(p: Record<string, unknown>, userId?: string): PostPreview {
  const likes = (p.post_likes as { user_id: string }[]) ?? []
  const saves = (p.post_saves as { user_id: string }[]) ?? []
  const files = (p.post_files as unknown[]) ?? []
  return {
    id:              p.id as string,
    type:            p.type as PostPreview['type'],
    title:           p.title as string,
    description:     p.description as string | null,
    tags:            (p.tags as string[]) ?? [],
    filesCount:      files.length,
    previewImageUrl: p.preview_image_url as string | null,
    liveDemoUrl:     p.live_demo_url as string | null,
    likesCount:      p.likes_count as number,
    commentsCount:   p.comments_count as number,
    sharesCount:     p.shares_count as number,
    savesCount:      p.saves_count as number,
    viewsCount:      p.views_count as number,
    repostCount:     (p.repost_count as number) ?? 0,
    isLiked:         userId ? likes.some((l) => l.user_id === userId) : false,
    isSaved:         userId ? saves.some((s) => s.user_id === userId) : false,
    isReposted:      false,
    author:          mapProfile(p.author as Record<string, unknown>),
    repostedFrom:    null,
    createdAt:       p.created_at as string,
    updatedAt:       p.updated_at as string,
  }
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
