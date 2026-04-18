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

const POST_SELECT = `*, author:profiles!posts_author_id_fkey(*), post_files(id,name,language,content), post_likes(user_id), post_saves(user_id)`
const POST_SELECT_FULL = `*, author:profiles!posts_author_id_fkey(*), post_files(*), post_likes(user_id), post_saves(user_id)`

export const postService = {
  async getFeed({ tab = 'trending', tag, query, page = 1 }: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    let q = supabase
      .from('posts')
      .select(POST_SELECT, { count: 'exact' })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (tag && tag !== 'all') {
      const variants = tagCaseVariants(tag)
      q = q.or(variants.map((v) => `tags.cs.{"${v}"}`).join(','))
    }
    if (query) {
      const t = query.trim()
      const like = t.toLowerCase().replace(/[%_,()]/g, ' ')
      const tagParts = tagCaseVariants(t).map((v) => `tags.cs.{"${v}"}`).join(',')
      q = q.or(`title.ilike.%${like}%,description.ilike.%${like}%,${tagParts}`)
    }
    q = tab === 'trending'
      ? q.order('likes_count', { ascending: false })
      : q.order('created_at', { ascending: false })

    const { data, error, count } = await q
    if (error) throw new Error(error.message)

    const userId = await currentUserId()
    const posts: PostPreview[] = (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
    await hydrateRepostedFrom(posts)
    await hydrateReposted(posts, userId)
    return { data: posts, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
  },

  async getPost(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT_FULL)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const post = mapPost(data as Record<string, unknown>, userId)
    const repostedFromId = (data as { reposted_from?: string | null }).reposted_from ?? null
    if (repostedFromId) {
      const originals = await fetchOriginals([repostedFromId])
      post.repostedFrom = originals.get(repostedFromId) ?? null
    }
    if (userId) {
      const { count } = await supabase
        .from('posts')
        .select('id', { count: 'exact', head: true })
        .eq('author_id', userId)
        .eq('type', 'repost')
        .eq('reposted_from', post.id)
      post.isReposted = (count ?? 0) > 0
    }
    return post
  },

  async create(payload: CreatePostPayload): Promise<Post> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id: userId,
        type: payload.type,
        title: payload.title,
        description: payload.description,
        tags: payload.tags ?? [],
        preview_image_url: payload.previewImageUrl ?? null,
        live_demo_url: payload.liveDemoUrl ?? null,
        reposted_from: payload.repostedFrom ?? null,
      })
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
    if (!userId) throw new Error('Giriş yapmalısın')
    const original = await this.getPost(postId)
    const { error } = await supabase.from('posts').insert({
      author_id: userId, type: 'repost',
      title: original.title, description: original.description,
      tags: original.tags, reposted_from: postId,
    })
    if (error) throw new Error(error.message)
  },

  async undoRepost(postId: string): Promise<void> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')
    await supabase
      .from('posts')
      .delete()
      .eq('author_id', userId)
      .eq('type', 'repost')
      .eq('reposted_from', postId)
  },

  async isReposted(postId: string): Promise<boolean> {
    const userId = await currentUserId()
    if (!userId) return false
    const { count } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('author_id', userId)
      .eq('type', 'repost')
      .eq('reposted_from', postId)
    return (count ?? 0) > 0
  },

  async quote(payload: Omit<CreatePostPayload, 'type'> & { repostedFrom: string }): Promise<Post> {
    return this.create({ ...payload, type: 'gonderi' })
  },

  async getWeeklyTop(limit = 6): Promise<PostPreview[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .gte('created_at', since)
      .order('likes_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts = (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
    await hydrateRepostedFrom(posts)
    await hydrateReposted(posts, userId)
    return posts
  },

  async getUserPosts(username: string, params?: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return { data: [], total: 0, page: 1, limit: PAGE_SIZE, hasNextPage: false }

    const page = params?.page ?? 1
    const { data, error, count } = await supabase
      .from('posts')
      .select(POST_SELECT, { count: 'exact' })
      .eq('author_id', (profile as { id: string }).id)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts: PostPreview[] = (data ?? []).map((p) => mapPostPreview(p as Record<string, unknown>, userId))
    await hydrateRepostedFrom(posts)
    await hydrateReposted(posts, userId)
    return { data: posts, total: count ?? 0, page, limit: PAGE_SIZE, hasNextPage: (count ?? 0) > page * PAGE_SIZE }
  },

  async getSavedPosts(): Promise<PostPreview[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data, error } = await supabase
      .from('post_saves')
      .select(`post:posts(${POST_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const posts = (data ?? [])
      .map((r) => (r as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
      .map((p) => mapPostPreview(p, userId))
    await hydrateRepostedFrom(posts)
    await hydrateReposted(posts, userId)
    return posts
  },

  async getLikedPosts(username: string): Promise<PostPreview[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []
    const { data, error } = await supabase
      .from('post_likes')
      .select(`post:posts(${POST_SELECT})`)
      .eq('user_id', (profile as { id: string }).id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts = (data ?? [])
      .map((r) => (r as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
      .map((p) => mapPostPreview(p, userId))
    await hydrateRepostedFrom(posts)
    await hydrateReposted(posts, userId)
    return posts
  },
}

function tagCaseVariants(tag: string): string[] {
  const t = tag.trim()
  if (!t) return []
  const lower = t.toLowerCase()
  const upper = t.toUpperCase()
  const capitalized = lower.charAt(0).toUpperCase() + lower.slice(1)
  return Array.from(new Set([t, lower, upper, capitalized]))
}

async function hydrateReposted(posts: PostPreview[], userId?: string): Promise<void> {
  if (!userId || posts.length === 0) return
  const ids = Array.from(new Set(posts.map((p) => p.id)))
  const { data } = await supabase
    .from('posts')
    .select('reposted_from')
    .eq('author_id', userId)
    .eq('type', 'repost')
    .in('reposted_from', ids)
  const set = new Set(((data ?? []) as { reposted_from: string }[]).map((r) => r.reposted_from))
  for (const p of posts) if (set.has(p.id)) p.isReposted = true
}

async function fetchOriginals(ids: string[]): Promise<Map<string, Post>> {
  const map = new Map<string, Post>()
  if (ids.length === 0) return map
  const { data } = await supabase
    .from('posts')
    .select(POST_SELECT_FULL)
    .in('id', ids)
  for (const row of (data ?? []) as Record<string, unknown>[]) {
    map.set(row.id as string, mapPost(row))
  }
  return map
}

async function hydrateRepostedFrom(previews: PostPreview[]): Promise<void> {
  const pairs = previews
    .map((p, i) => ({ i, id: (p as unknown as { _repostedFromId?: string })._repostedFromId }))
    .filter((x) => !!x.id) as { i: number; id: string }[]
  if (pairs.length === 0) return
  const originals = await fetchOriginals(Array.from(new Set(pairs.map((p) => p.id))))
  for (const { i, id } of pairs) {
    previews[i].repostedFrom = originals.get(id) ?? null
  }
  for (const p of previews) {
    delete (p as unknown as { _repostedFromId?: string })._repostedFromId
  }
}

function mapPostPreview(p: Record<string, unknown>, userId?: string): PostPreview {
  const likes = (p.post_likes as { user_id: string }[]) ?? []
  const saves = (p.post_saves as { user_id: string }[]) ?? []
  const files = (p.post_files as { id: string; name: string; language: string; content?: string }[]) ?? []
  const firstFile = files[0]
  const isSnippet = p.type === 'snippet'
  const showSnippet = isSnippet || (p.type === 'gonderi' && !!firstFile?.content)
  const preview: PostPreview = {
    id:              p.id as string,
    type:            p.type as PostPreview['type'],
    title:           p.title as string,
    description:     p.description as string | null,
    tags:            (p.tags as string[]) ?? [],
    filesCount:      files.length,
    snippetPreview:  showSnippet ? (firstFile?.content?.slice(0, 500) ?? null) : null,
    snippetLanguage: showSnippet ? (firstFile?.language ?? null) : null,
    projectFiles: p.type === 'project'
      ? files.map((f) => ({ id: f.id, name: f.name, language: f.language, content: f.content ?? '' }))
      : undefined,
    previewImageUrl: p.preview_image_url as string | null,
    liveDemoUrl:     p.live_demo_url as string | null,
    likesCount:      (p.post_likes as unknown[] | null)?.length ?? (p.likes_count as number ?? 0),
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
  const repostedFromId = (p.reposted_from as string | null) ?? null
  if (repostedFromId) {
    (preview as unknown as { _repostedFromId: string })._repostedFromId = repostedFromId
  }
  return preview
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
