import { supabase } from '@/lib/supabase'
import type { ArticleBlock } from '@store/articleStore'

async function createArticleFeedPost(article: {
  id: string
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
}, userId: string): Promise<void> {
  // Aynı makale için zaten bir post var mı?
  const { data: existingBlocks } = await supabase
    .from('post_blocks')
    .select('post_id')
    .eq('type', 'article')
    .contains('data', { articleId: article.id })

  if ((existingBlocks ?? []).length > 0) return

  const textContent = article.blocks
    .map((b) => (b.content ?? '').replace(/<[^>]*>/g, '') || b.code || '')
    .filter(Boolean)
    .join(' ')
    .slice(0, 300)

  const { data: post, error: postError } = await supabase
    .from('posts')
    .insert({
      author_id:    userId,
      type:         'post',
      title:        article.title,
      description:  article.subtitle || null,
      tags:         [],
      is_published: true,
    })
    .select('id')
    .single()

  if (postError || !post) return

  await supabase.from('post_blocks').insert({
    post_id:  (post as { id: string }).id,
    type:     'article',
    position: 0,
    data: {
      articleId:  article.id,
      title:      article.title,
      subtitle:   article.subtitle,
      content:    textContent,
      coverImage: article.coverImage ?? '',
    },
  })
}

export interface ArticleRecord {
  id: string
  authorId: string
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
  isPublished: boolean
  viewsCount: number
  likesCount: number
  savesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
  createdAt: string
  updatedAt: string
  author?: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

export interface ArticleComment {
  id: string
  articleId: string
  authorId: string
  parentId: string | null
  content: string
  createdAt: string
  author: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
  replies: ArticleComment[]
}

async function currentUserId(): Promise<string> {
  const id = (await supabase.auth.getSession()).data.session?.user?.id
  if (!id) throw new Error('Oturum açmanız gerekiyor')
  return id
}

async function optionalUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

// Feed kartları için hafif etkileşim sorgusu (blocks çekmez)
const INTERACTIONS_SELECT = [
  'likes:article_likes(user_id)',
  'saves:article_saves(user_id)',
].join(', ')

export interface ArticleInteractions {
  likesCount: number
  savesCount: number
  isLiked: boolean
  isSaved: boolean
}

// Detay sayfası için tam veri (blocks dahil + isLiked/isSaved hydrate edilir)
const ARTICLE_FULL_SELECT = [
  'id', 'author_id', 'title', 'subtitle', 'cover_image', 'blocks',
  'is_published', 'views_count', 'created_at', 'updated_at',
  'author:profiles!articles_author_id_fkey(username, display_name, avatar_url)',
].join(', ')

// Liste/kart için hafif select — blocks ve etkileşim satırları çekilmez
const ARTICLE_LIST_SELECT = [
  'id', 'author_id', 'title', 'subtitle', 'cover_image',
  'is_published', 'views_count', 'created_at', 'updated_at',
  'author:profiles!articles_author_id_fkey(username, display_name, avatar_url)',
].join(', ')

async function hydrateArticleInteractions(
  articles: ArticleRecord[],
  uid?: string,
): Promise<void> {
  if (articles.length === 0) return
  const ids = articles.map((a) => a.id)

  const [{ data: likes }, { data: saves }] = await Promise.all([
    supabase.from('article_likes').select('article_id, user_id').in('article_id', ids),
    supabase.from('article_saves').select('article_id, user_id').in('article_id', ids),
  ])

  const likeCounts = new Map<string, number>()
  const saveCounts = new Map<string, number>()
  const likedByMe  = new Set<string>()
  const savedByMe  = new Set<string>()

  for (const r of (likes ?? []) as Array<{ article_id: string; user_id: string }>) {
    likeCounts.set(r.article_id, (likeCounts.get(r.article_id) ?? 0) + 1)
    if (uid && r.user_id === uid) likedByMe.add(r.article_id)
  }
  for (const r of (saves ?? []) as Array<{ article_id: string; user_id: string }>) {
    saveCounts.set(r.article_id, (saveCounts.get(r.article_id) ?? 0) + 1)
    if (uid && r.user_id === uid) savedByMe.add(r.article_id)
  }
  for (const a of articles) {
    a.likesCount = likeCounts.get(a.id) ?? 0
    a.savesCount = saveCounts.get(a.id) ?? 0
    a.isLiked    = likedByMe.has(a.id)
    a.isSaved    = savedByMe.has(a.id)
  }
}

function mapArticle(row: Record<string, unknown>, _currentUid?: string, commentsCount = 0): ArticleRecord {
  const a = row.author as Record<string, unknown> | null
  return {
    id:            row.id as string,
    authorId:      row.author_id as string,
    title:         row.title as string,
    subtitle:      (row.subtitle as string) ?? '',
    coverImage:    (row.cover_image as string) ?? null,
    blocks:        (row.blocks as ArticleBlock[]) ?? [],
    isPublished:   row.is_published as boolean,
    viewsCount:    (row.views_count as number) ?? 0,
    likesCount:    0,
    savesCount:    0,
    commentsCount,
    isLiked:       false,
    isSaved:       false,
    createdAt:     row.created_at as string,
    updatedAt:     row.updated_at as string,
    author: a ? {
      username:    a.username as string,
      displayName: a.display_name as string,
      avatarUrl:   (a.avatar_url as string) ?? null,
    } : undefined,
  }
}

function mapComment(row: Record<string, unknown>): ArticleComment {
  const a = row.author as Record<string, unknown> | null
  return {
    id:        row.id as string,
    articleId: row.article_id as string,
    authorId:  row.author_id as string,
    parentId:  (row.parent_id as string) ?? null,
    content:   row.content as string,
    createdAt: row.created_at as string,
    author: a ? {
      username:    a.username as string,
      displayName: a.display_name as string,
      avatarUrl:   (a.avatar_url as string) ?? null,
    } : { username: '', displayName: 'Anonim', avatarUrl: null },
    replies: [],
  }
}

export const articleService = {
  async list(): Promise<ArticleRecord[]> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_LIST_SELECT)
      .eq('author_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    const articles = (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>, userId))
    await hydrateArticleInteractions(articles, userId)
    return articles
  },

  async get(id: string): Promise<ArticleRecord> {
    const uid = await optionalUserId()
    const [{ data, error }, { count }] = await Promise.all([
      supabase.from('articles').select(ARTICLE_FULL_SELECT).eq('id', id).single(),
      supabase.from('article_comments').select('id', { count: 'exact', head: true }).eq('article_id', id),
    ])
    if (error) throw new Error(error.message)
    const article = mapArticle(data as unknown as Record<string, unknown>, uid, count ?? 0)
    await hydrateArticleInteractions([article], uid)
    return article
  },

  async save(article: {
    id: string | null
    title: string
    subtitle: string
    coverImage: string | null
    blocks: ArticleBlock[]
  }): Promise<ArticleRecord> {
    const userId = await currentUserId()

    if (article.id) {
      const { data, error } = await supabase
        .from('articles')
        .update({
          title:       article.title || 'Başlıksız Makale',
          subtitle:    article.subtitle,
          cover_image: article.coverImage,
          blocks:      article.blocks,
        })
        .eq('id', article.id)
        .eq('author_id', userId)
        .select(ARTICLE_FULL_SELECT)
        .single()
      if (error) throw new Error(error.message)
      return mapArticle(data as unknown as Record<string, unknown>, userId)
    }

    const { data, error } = await supabase
      .from('articles')
      .insert({
        author_id:    userId,
        title:        article.title || 'Başlıksız Makale',
        subtitle:     article.subtitle,
        cover_image:  article.coverImage,
        blocks:       article.blocks,
        is_published: false,
      })
      .select(ARTICLE_FULL_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return mapArticle(data as unknown as Record<string, unknown>, userId)
  },

  async publish(id: string): Promise<ArticleRecord> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('articles')
      .update({ is_published: true })
      .eq('id', id)
      .eq('author_id', userId)
      .select(ARTICLE_FULL_SELECT)
      .single()
    if (error) throw new Error(error.message)
    const record = mapArticle(data as unknown as Record<string, unknown>, userId)
    void createArticleFeedPost(record, userId)
    return record
  },

  async unpublish(id: string): Promise<ArticleRecord> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('articles')
      .update({ is_published: false })
      .eq('id', id)
      .eq('author_id', userId)
      .select(ARTICLE_FULL_SELECT)
      .single()
    if (error) throw new Error(error.message)
    return mapArticle(data as unknown as Record<string, unknown>, userId)
  },

  async delete(id: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id)
      .eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async listPublishedByUsername(username: string): Promise<ArticleRecord[]> {
    const uid = await optionalUserId()
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single()
    if (!profile) return []
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_LIST_SELECT)
      .eq('author_id', (profile as unknown as Record<string, unknown>).id as string)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
      .limit(50)
    if (error) throw new Error(error.message)
    const articles = (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>, uid))
    await hydrateArticleInteractions(articles, uid)
    return articles
  },

  async getInteractions(id: string): Promise<ArticleInteractions> {
    const uid = await optionalUserId()
    const { data } = await supabase
      .from('articles')
      .select(INTERACTIONS_SELECT)
      .eq('id', id)
      .single()
    const likes = ((data as Record<string, unknown> | null)?.likes as { user_id: string }[]) ?? []
    const saves = ((data as Record<string, unknown> | null)?.saves as { user_id: string }[]) ?? []
    return {
      likesCount: likes.length,
      savesCount: saves.length,
      isLiked:    uid ? likes.some((l) => l.user_id === uid) : false,
      isSaved:    uid ? saves.some((s) => s.user_id === uid) : false,
    }
  },

  async like(id: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('article_likes').insert({ article_id: id, user_id: userId })
    if (error && error.code !== '23505') throw new Error(error.message)
  },

  async unlike(id: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('article_likes').delete().eq('article_id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  async saveArticle(id: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('article_saves').insert({ article_id: id, user_id: userId })
    if (error && error.code !== '23505') throw new Error(error.message)
  },

  async unsaveArticle(id: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('article_saves').delete().eq('article_id', id).eq('user_id', userId)
    if (error) throw new Error(error.message)
  },

  async getComments(articleId: string): Promise<ArticleComment[]> {
    const { data, error } = await supabase
      .from('article_comments')
      .select('*, author:profiles!article_comments_author_id_fkey(username, display_name, avatar_url)')
      .eq('article_id', articleId)
      .is('parent_id', null)
      .order('created_at', { ascending: true })
    if (error) throw new Error(error.message)

    const top = (data ?? []).map(mapComment)

    const withReplies = await Promise.all(top.map(async (c) => {
      const { data: replies } = await supabase
        .from('article_comments')
        .select('*, author:profiles!article_comments_author_id_fkey(username, display_name, avatar_url)')
        .eq('parent_id', c.id)
        .order('created_at', { ascending: true })
      return { ...c, replies: (replies ?? []).map(mapComment) }
    }))

    return withReplies
  },

  async addComment(articleId: string, content: string, parentId?: string): Promise<ArticleComment> {
    const userId = await currentUserId()
    const { data, error } = await supabase
      .from('article_comments')
      .insert({ article_id: articleId, author_id: userId, content, parent_id: parentId ?? null })
      .select('*, author:profiles!article_comments_author_id_fkey(username, display_name, avatar_url)')
      .single()
    if (error) throw new Error(error.message)
    return mapComment(data as unknown as Record<string, unknown>)
  },

  async deleteComment(commentId: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase.from('article_comments').delete().eq('id', commentId).eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async getSavedArticles(): Promise<ArticleRecord[]> {
    const uid = await optionalUserId()
    if (!uid) return []
    const { data, error } = await supabase
      .from('article_saves')
      .select(`article:articles!article_saves_article_id_fkey(${ARTICLE_LIST_SELECT})`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    const articles = ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
    await hydrateArticleInteractions(articles, uid)
    return articles
  },

  async getLikedArticles(username: string): Promise<ArticleRecord[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []
    const uid = await optionalUserId()
    const { data, error } = await supabase
      .from('article_likes')
      .select(`article:articles!article_likes_article_id_fkey(${ARTICLE_LIST_SELECT})`)
      .eq('user_id', (profile as { id: string }).id)
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    const articles = ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
    await hydrateArticleInteractions(articles, uid)
    return articles
  },

  async getCollectionArticles(collectionId: string): Promise<ArticleRecord[]> {
    const uid = await optionalUserId()
    const { data, error } = await supabase
      .from('collection_articles')
      .select(`article:articles!collection_articles_article_id_fkey(${ARTICLE_LIST_SELECT})`)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    const articles = ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
    await hydrateArticleInteractions(articles, uid)
    return articles
  },
}
