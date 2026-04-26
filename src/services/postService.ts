import { supabase } from '@/lib/supabase'
import { mapProfile } from '@store/authStore'
import { notify, notifyMentions } from './notificationHelpers'
import type { Post, PostPreview, CreatePostPayload, PaginatedResponse, PostBlock } from '@/types'

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

// Tüm beğeni/kaydetme satırlarını çekmek yerine denormalize edilmiş sayaçları
// (likes_count, saves_count) kullanıyoruz; isLiked/isSaved ayrıca hydrate edilir.
const POST_SELECT = `*, author:profiles!posts_author_id_fkey(*), post_blocks(id,type,position,data)`

const FEED_SELECT = POST_SELECT

export const POSTS_PREVIEW_SELECT = POST_SELECT

export const postService = {
  async getFeed({ tab = 'trending', tag, query, page = 1 }: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    let q = supabase
      .from('posts')
      .select(FEED_SELECT)
      .eq('is_published', true)
      .neq('type', 'project')
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

    const [{ data, error }, userId] = await Promise.all([q, currentUserId()])
    if (error) throw new Error(error.message ?? 'Sorgu hatası')

    const posts: PostPreview[] = (data ?? []).map((p) => mapPost(p as Record<string, unknown>))

    if (posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      await Promise.allSettled([
        hydrateRepostedFrom(posts),
        hydrateReposted(posts, userId),
        userId ? hydrateUserInteractions(posts, postIds, userId) : Promise.resolve(),
      ])
    }

    const hasNextPage = posts.length === PAGE_SIZE
    const total = (page - 1) * PAGE_SIZE + posts.length
    return { data: posts, total, page, limit: PAGE_SIZE, hasNextPage }
  },

  async getPost(id: string): Promise<Post> {
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const post = mapPost(data as Record<string, unknown>, userId)
    const repostedFromId = (data as { reposted_from?: string | null }).reposted_from ?? null

    const tasks: Promise<unknown>[] = []
    if (repostedFromId) {
      tasks.push(
        fetchOriginals([repostedFromId]).then((originals) => {
          post.repostedFrom = originals.get(repostedFromId) ?? null
        }),
      )
    }
    if (userId) {
      tasks.push(hydrateUserInteractions([post], [post.id], userId))
      tasks.push(
        (async () => {
          const { count } = await supabase
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('author_id', userId)
            .eq('type', 'repost')
            .eq('reposted_from', post.id)
          post.isReposted = (count ?? 0) > 0
        })(),
      )
    }
    if (tasks.length > 0) await Promise.allSettled(tasks)
    return post
  },

  async create(payload: CreatePostPayload): Promise<Post> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        author_id:         userId,
        type:              payload.type ?? 'post',
        title:             payload.title,
        description:       payload.description ?? null,
        tags:              payload.tags ?? [],
        preview_image_url: payload.previewImageUrl ?? null,
        reposted_from:     payload.repostedFrom ?? null,
        is_published:      true,
      })
      .select()
      .single()
    if (error) throw new Error(error.message)

    const newPostId = (post as { id: string }).id

    if (payload.blocks?.length) {
      await supabase.from('post_blocks').insert(
        payload.blocks.map((b) => ({ post_id: newPostId, type: b.type, position: b.position, data: b.data }))
      )
    }

    if (payload.repostedFrom) {
      const { data: src } = await supabase
        .from('posts')
        .select('author_id')
        .eq('id', payload.repostedFrom)
        .single()
      if (src) {
        void notify({
          userId:  (src as { author_id: string }).author_id,
          actorId: userId,
          type:    'repost',
          postId:  newPostId,
          message: payload.type === 'repost' ? 'Gönderini yeniden paylaştı' : 'Gönderini alıntıladı',
        })
      }
    }

    void notifyMentions({
      text:    `${payload.title ?? ''} ${payload.description ?? ''}`,
      actorId: userId,
      postId:  newPostId,
      message: 'Seni bir gönderide etiketledi',
    })

    return this.getPost(newPostId)
  },

  async update(postId: string, payload: Partial<CreatePostPayload>): Promise<void> {
    await supabase.from('posts').update({
      title:       payload.title,
      description: payload.description ?? null,
      tags:        payload.tags,
    }).eq('id', postId)

    if (payload.blocks !== undefined) {
      await supabase.from('post_blocks').delete().eq('post_id', postId)
      if (payload.blocks.length) {
        await supabase.from('post_blocks').insert(
          payload.blocks.map((b) => ({ post_id: postId, type: b.type, position: b.position, data: b.data }))
        )
      }
    }
  },

  async like(postId: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('post_likes').insert({ user_id: userId!, post_id: postId })
    if (error) throw new Error(error.message)
    const { data: post } = await supabase.from('posts').select('author_id').eq('id', postId).single()
    if (post && userId) {
      void notify({
        userId:  (post as { author_id: string }).author_id,
        actorId: userId,
        type:    'like',
        postId,
        message: 'Gönderini beğendi',
      })
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
    const { data: inserted, error } = await supabase.from('posts').insert({
      author_id: userId, type: 'repost',
      title: original.title, description: original.description,
      tags: original.tags, reposted_from: postId, is_published: true,
    }).select('id').single()
    if (error) throw new Error(error.message)
    void notify({
      userId:  original.author.id,
      actorId: userId,
      type:    'repost',
      postId:  (inserted as { id: string }).id,
      message: 'Gönderini yeniden paylaştı',
    })
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
    return this.create({ ...payload, type: 'post' })
  },

  async getWeeklyTop(limit = 6): Promise<PostPreview[]> {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('is_published', true)
      .neq('type', 'project')
      .gte('created_at', since)
      .order('likes_count', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts = (data ?? []).map((p) => mapPost(p as Record<string, unknown>, userId))
    if (posts.length > 0) {
      await Promise.allSettled([
        hydrateRepostedFrom(posts),
        hydrateReposted(posts, userId),
        userId ? hydrateUserInteractions(posts, posts.map((p) => p.id), userId) : Promise.resolve(),
      ])
    }
    return posts
  },

  async getUserPosts(username: string, params?: FeedParams): Promise<PaginatedResponse<PostPreview>> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return { data: [], total: 0, page: 1, limit: PAGE_SIZE, hasNextPage: false }

    const page = params?.page ?? 1
    const { data, error } = await supabase
      .from('posts')
      .select(POST_SELECT)
      .eq('author_id', (profile as { id: string }).id)
      .eq('is_published', true)
      .neq('type', 'project')
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts: PostPreview[] = (data ?? []).map((p) => mapPost(p as Record<string, unknown>, userId))
    if (posts.length > 0) {
      await Promise.allSettled([
        hydrateRepostedFrom(posts),
        hydrateReposted(posts, userId),
        userId ? hydrateUserInteractions(posts, posts.map((p) => p.id), userId) : Promise.resolve(),
      ])
    }
    const hasNextPage = posts.length === PAGE_SIZE
    const total = (page - 1) * PAGE_SIZE + posts.length
    return { data: posts, total, page, limit: PAGE_SIZE, hasNextPage }
  },

  async getSavedPosts(): Promise<PostPreview[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data, error } = await supabase
      .from('post_saves')
      .select(`post:posts(${POST_SELECT})`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    const posts = (data ?? [])
      .map((r) => (r as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
      .map((p) => mapPost(p, userId))
    if (posts.length > 0) {
      await Promise.allSettled([
        hydrateRepostedFrom(posts),
        hydrateReposted(posts, userId),
        hydrateUserInteractions(posts, posts.map((p) => p.id), userId),
      ])
    }
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
      .limit(100)
    if (error) throw new Error(error.message)
    const userId = await currentUserId()
    const posts = (data ?? [])
      .map((r) => (r as Record<string, unknown>).post as Record<string, unknown>)
      .filter(Boolean)
      .map((p) => mapPost(p, userId))
    if (posts.length > 0) {
      await Promise.allSettled([
        hydrateRepostedFrom(posts),
        hydrateReposted(posts, userId),
        userId ? hydrateUserInteractions(posts, posts.map((p) => p.id), userId) : Promise.resolve(),
      ])
    }
    return posts
  },

  async editPost(postId: string, payload: { title: string; description?: string; tags?: string[]; blocks?: PostBlock[] }): Promise<void> {
    const [{ data: current }, { data: currentBlocks }] = await Promise.all([
      supabase.from('posts').select('title, description, tags').eq('id', postId).single(),
      supabase.from('post_blocks').select('id, type, position, data').eq('post_id', postId).order('position'),
    ])

    if (current) {
      await supabase.from('post_edits').insert({
        post_id:              postId,
        original_title:       current.title,
        original_description: current.description,
        original_tags:        current.tags ?? [],
        original_blocks:      currentBlocks ?? [],
      })
    }

    const { error } = await supabase
      .from('posts')
      .update({ title: payload.title, description: payload.description ?? null, tags: payload.tags ?? [], is_edited: true })
      .eq('id', postId)

    if (error) throw new Error(error.message)

    if (payload.blocks !== undefined) {
      await supabase.from('post_blocks').delete().eq('post_id', postId)
      if (payload.blocks.length) {
        await supabase.from('post_blocks').insert(
          payload.blocks.map((b) => ({ post_id: postId, type: b.type, position: b.position, data: b.data }))
        )
      }
    }
  },

  async getPostEdits(postId: string) {
    const { data, error } = await supabase
      .from('post_edits')
      .select('id, original_title, original_description, original_tags, original_blocks, edited_at')
      .eq('post_id', postId)
      .order('edited_at', { ascending: true })
    if (error) throw new Error(error.message)
    return (data ?? []) as Array<{
      id: string
      original_title: string
      original_description: string | null
      original_tags: string[]
      original_blocks: PostBlock[] | null
      edited_at: string
    }>
  },

  /** @deprecated use getPostEdits */
  async getPostEdit(postId: string) {
    const edits = await this.getPostEdits(postId)
    return edits[0] ?? null
  },

  async getPostLikers(postId: string) {
    const { data, error } = await supabase
      .from('post_likes')
      .select('created_at, profile:profiles!post_likes_user_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => mapProfile(row.profile as Record<string, unknown>))
  },

  async getPostReposters(postId: string) {
    const { data, error } = await supabase
      .from('posts')
      .select('created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
      .eq('reposted_from', postId)
      .eq('type', 'repost')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => mapProfile(row.author as Record<string, unknown>))
  },

  async getPostSavers(postId: string) {
    const { data, error } = await supabase
      .from('post_saves')
      .select('created_at, profile:profiles!post_saves_user_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((row: any) => mapProfile(row.profile as Record<string, unknown>)).filter(Boolean)
  },

  async getPostCollectors(postId: string) {
    const { data, error } = await supabase
      .from('collection_posts')
      .select('collection:collections!collection_posts_collection_id_fkey(owner:profiles!collections_owner_id_fkey(id, username, display_name, avatar_url, is_verified, is_online))')
      .eq('post_id', postId)
    if (error) throw new Error(error.message)
    return (data ?? [])
      .map((row: any) => row.collection?.owner)
      .filter(Boolean)
      .map((p: Record<string, unknown>) => mapProfile(p))
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

export async function hydratePostPreviewRows(
  rows: Record<string, unknown>[],
  userId?: string,
): Promise<PostPreview[]> {
  const previews = rows.map((r) => mapPost(r, userId))
  if (previews.length === 0) return previews
  await Promise.allSettled([
    hydrateRepostedFrom(previews),
    hydrateReposted(previews, userId),
    userId ? hydrateUserInteractions(previews, previews.map((p) => p.id), userId) : Promise.resolve(),
  ])
  return previews
}

async function hydrateUserInteractions(posts: PostPreview[], postIds: string[], userId: string): Promise<void> {
  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from('post_likes').select('post_id').eq('user_id', userId).in('post_id', postIds),
    supabase.from('post_saves').select('post_id').eq('user_id', userId).in('post_id', postIds),
  ])
  const likedSet = new Set(likes?.map((l: { post_id: string }) => l.post_id) ?? [])
  const savedSet = new Set(saves?.map((s: { post_id: string }) => s.post_id) ?? [])
  for (const p of posts) {
    p.isLiked = likedSet.has(p.id)
    p.isSaved = savedSet.has(p.id)
  }
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
    .select(POST_SELECT)
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

function mapPost(p: Record<string, unknown>, _userId?: string): Post {
  const rawBlocks = (p.post_blocks as Array<{ id: string; type: string; position: number; data: Record<string, unknown> }>) ?? []
  const blocks: PostBlock[] = [...rawBlocks]
    .sort((a, b) => a.position - b.position)
    .map((b) => ({
      id:       b.id,
      type:     b.type as PostBlock['type'],
      position: b.position,
      data:     b.data,
    }))

  const post: Post = {
    id:              p.id as string,
    type:            p.type as Post['type'],
    title:           p.title as string,
    description:     p.description as string | null,
    tags:            (p.tags as string[]) ?? [],
    blocks,
    previewImageUrl: p.preview_image_url as string | null,
    likesCount:      (p.likes_count as number) ?? 0,
    commentsCount:   (p.comments_count as number) ?? 0,
    sharesCount:     (p.shares_count as number) ?? 0,
    savesCount:      (p.saves_count as number) ?? 0,
    viewsCount:      (p.views_count as number) ?? 0,
    repostCount:     (p.repost_count as number) ?? 0,
    isLiked:         false,
    isSaved:         false,
    isReposted:      false,
    isEdited:        !!(p.is_edited),
    author:          mapProfile(p.author as Record<string, unknown>),
    repostedFrom:    null,
    createdAt:       p.created_at as string,
    updatedAt:       p.updated_at as string,
  }
  const repostedFromId = (p.reposted_from as string | null) ?? null
  if (repostedFromId) {
    (post as unknown as { _repostedFromId: string })._repostedFromId = repostedFromId
  }
  return post
}
