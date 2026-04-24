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

const ARTICLE_SELECT = [
  'id', 'author_id', 'title', 'subtitle', 'cover_image', 'blocks',
  'is_published', 'views_count', 'created_at', 'updated_at',
  'author:profiles!articles_author_id_fkey(username, display_name, avatar_url)',
  'likes:article_likes(user_id)',
  'saves:article_saves(user_id)',
].join(', ')

function mapArticle(row: Record<string, unknown>, currentUid?: string): ArticleRecord {
  const a = row.author as Record<string, unknown> | null
  const likes = (row.likes as Array<{ user_id: string }>) ?? []
  const saves = (row.saves as Array<{ user_id: string }>) ?? []
  return {
    id:          row.id as string,
    authorId:    row.author_id as string,
    title:       row.title as string,
    subtitle:    (row.subtitle as string) ?? '',
    coverImage:  (row.cover_image as string) ?? null,
    blocks:      (row.blocks as ArticleBlock[]) ?? [],
    isPublished: row.is_published as boolean,
    viewsCount:  (row.views_count as number) ?? 0,
    likesCount:  likes.length,
    savesCount:  saves.length,
    isLiked:     currentUid ? likes.some((l) => l.user_id === currentUid) : false,
    isSaved:     currentUid ? saves.some((s) => s.user_id === currentUid) : false,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
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
      .select(ARTICLE_SELECT)
      .eq('author_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>, userId))
  },

  async get(id: string): Promise<ArticleRecord> {
    const uid = await optionalUserId()
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return mapArticle(data as unknown as Record<string, unknown>, uid)
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
        .select(ARTICLE_SELECT)
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
      .select(ARTICLE_SELECT)
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
      .select(ARTICLE_SELECT)
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
      .select(ARTICLE_SELECT)
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
      .select(ARTICLE_SELECT)
      .eq('author_id', (profile as unknown as Record<string, unknown>).id as string)
      .eq('is_published', true)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>, uid))
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
      .select(`article:articles!article_saves_article_id_fkey(${ARTICLE_SELECT})`)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
  },

  async getLikedArticles(username: string): Promise<ArticleRecord[]> {
    const { data: profile } = await supabase.from('profiles').select('id').eq('username', username).single()
    if (!profile) return []
    const uid = await optionalUserId()
    const { data, error } = await supabase
      .from('article_likes')
      .select(`article:articles!article_likes_article_id_fkey(${ARTICLE_SELECT})`)
      .eq('user_id', (profile as { id: string }).id)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
  },

  async getCollectionArticles(collectionId: string): Promise<ArticleRecord[]> {
    const uid = await optionalUserId()
    const { data, error } = await supabase
      .from('collection_articles')
      .select(`article:articles!collection_articles_article_id_fkey(${ARTICLE_SELECT})`)
      .eq('collection_id', collectionId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return ((data ?? []) as unknown as Array<{ article: Record<string, unknown> | null }>)
      .map((r) => r.article)
      .filter((a): a is Record<string, unknown> => a !== null)
      .map((a) => mapArticle(a, uid))
  },
}
