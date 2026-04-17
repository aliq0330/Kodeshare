import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import type { Post, PostPreview, CreatePostPayload, PaginatedResponse } from '@/types'

const PAGE_SIZE = 20

interface FeedParams {
  tab?: string
  tag?: string
  query?: string
  page?: number
}

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const postService = {
  async getFeed({ tab = 'trending', tag, query, page = 1 }: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    let q = supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(*), post_files(id,name,language), post_likes(user_id), post_saves(user_id)`, { count: 'exact' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (tag && tag !== 'all') q = q.contains('tags', [tag])
    if (query) q = q.ilike('title', `%${query}%`)
    q = tab === 'trending'
      ? q.order('likes_count', { ascending: false })
      : q.order('created_at', { ascending: false })

    const { data, error, count } = await q
    if (error) throw new Error(error.message)

    const userId = await currentUserId()
    const posts: PostPreview[] = (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
    return { data: posts, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
  },

  async getPost(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(*), post_files(*), post_likes(user_id), post_saves(user_id)`)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    return mapPost(data as Record<string, unknown>, userId)
  },

  async create(payload: CreatePostPayload): Promise<Post> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: userId, type: payload.type, title: payload.title, description: payload.description, tags: payload.tags ?? [] })
      .select()
      .single()
    if (error) throw new Error(error.message)

    if (payload.files?.length) {
      await supabase.from('post_files').insert(
        payload.files.map((f, i) => ({ post_id: (post as { id: string }).id, name: f.name, language: f.language, content: f.content, order: i }))
      )
    }
    return this.getPost((post as { id: string }).id)
  },

  async update(postId: string, payload: Partial<CreatePostPayload>): Promise<void> {
    await supabase.from('posts').update({
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
    }).eq('id', postId)

    if (payload.files) {
      await supabase.from('post_files').delete().eq('post_id', postId)
      if (payload.files.length) {
        await supabase.from('post_files').insert(
          payload.files.map((f, i) => ({ post_id: postId, name: f.name, language: f.language, content: f.content, order: i }))
        )
      }
    }
  },

  async like(postId: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('post_likes').insert({ user_id: userId!, post_id: postId })
    if (error) throw new Error(error.message)
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single()
    if (post && (post as { author_id: string }).author_id !== userId) {
      supabase.from('notifications').insert({ user_id: (post as { author_id: string }).author_id, actor_id: userId!, type: 'like', post_id: postId, message: 'Gönderini beğendi' }).then()
    }
  },

  async unlike(postId: string): Promise<void> {
    const userId = await currentUserId()
    await supabase.from('post_likes').delete().eq('user_id', userId!).eq('post_id', postId)
  },

  async save(postId: string): Promise<void> {
    const userId = await currentUserId()
    await supabase.from('post_saves').insert({ user_id: userId!, post_id: postId })
  },

  async unsave(postId: string): Promise<void> {
    const userId = await currentUserId()
    await supabase.from('post_saves').delete().eq('user_id', userId!).eq('post_id', postId)
  },

  async delete(postId: string): Promise<void> {
    await supabase.from('posts').delete().eq('id', postId)
  },

  async repost(postId: string): Promise<void> {
    const userId = await currentUserId()
    const original = await this.getPost(postId)
    await supabase.from('posts').insert({
      author_id: userId!, type: 'repost',
      title: original.title, description: original.description,
      tags: original.tags, reposted_from: postId,
    })
  },

  async getWeeklyTop(limit = 6): Promise<PostPreview[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(*), post_files(id,name,language), post_likes(user_id), post_saves(user_id)`)
      .gte('created_at', since)
      .order('likes_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    return (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
  },

  async getUserPosts(username: string, params?: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return { data: [], total: 0, page: 1, limit: PAGE_SIZE, hasNextPage: false }

    const page = params?.page ?? 1
    const { data, error, count } = await supabase
      .from('posts')
      .select(`*, author:profiles!posts_author_id_fkey(*), post_files(id,name,language), post_likes(user_id), post_saves(user_id)`, { count: 'exact' })
      .eq('author_id', (profile as { id: string }).id)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts: PostPreview[] = (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
    return { data: posts, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
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
    isLiked:         userId ? likes.some((l) => l.user_id === userId) : false,
    isSaved:         userId ? saves.some((s) => s.user_id === userId) : false,
    isReposted:      false,
    author:          mapProfile(p.author as Record<string, unknown>),
    repostedFrom:    null,
    createdAt:       p.created_at as string,
    updatedAt:       p.updated_at as string,
  }
}

function mapPost(p: Record<string, unknown>, userId?: string): Post {
  const preview = mapPostPreview(p, userId)
  return {
    ...preview,
    files: ((p.post_files as Record<string, unknown>[]) ?? []).map((f) => ({
      id:       f.id as string,
      name:     f.name as string,
      language: f.language as Post['files'][number]['language'],
      content:  f.content as string,
      order:    f.order as number,
    })),
  }
}
