import { supabase } from '@/lib/supabase'
import type { ArticleBlock } from '@store/articleStore'

export interface ArticleRecord {
  id: string
  authorId: string
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
  isPublished: boolean
  viewsCount: number
  createdAt: string
  updatedAt: string
  author?: {
    username: string
    displayName: string
    avatarUrl: string | null
  }
}

async function currentUserId(): Promise<string> {
  const id = (await supabase.auth.getSession()).data.session?.user?.id
  if (!id) throw new Error('Oturum açmanız gerekiyor')
  return id
}

const ARTICLE_SELECT = [
  'id', 'author_id', 'title', 'subtitle', 'cover_image', 'blocks',
  'is_published', 'views_count', 'created_at', 'updated_at',
  'author:profiles!articles_author_id_fkey(username, display_name, avatar_url)',
].join(', ')

function mapArticle(row: Record<string, unknown>): ArticleRecord {
  const a = row.author as Record<string, unknown> | null
  return {
    id:          row.id as string,
    authorId:    row.author_id as string,
    title:       row.title as string,
    subtitle:    (row.subtitle as string) ?? '',
    coverImage:  (row.cover_image as string) ?? null,
    blocks:      (row.blocks as ArticleBlock[]) ?? [],
    isPublished: row.is_published as boolean,
    viewsCount:  (row.views_count as number) ?? 0,
    createdAt:   row.created_at as string,
    updatedAt:   row.updated_at as string,
    author: a ? {
      username:    a.username as string,
      displayName: a.display_name as string,
      avatarUrl:   (a.avatar_url as string) ?? null,
    } : undefined,
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
    return (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>))
  },

  async get(id: string): Promise<ArticleRecord> {
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_SELECT)
      .eq('id', id)
      .single()
    if (error) throw new Error(error.message)
    return mapArticle(data as unknown as Record<string, unknown>)
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
      return mapArticle(data as unknown as Record<string, unknown>)
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
    return mapArticle(data as unknown as Record<string, unknown>)
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
    return mapArticle(data as unknown as Record<string, unknown>)
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
    return mapArticle(data as unknown as Record<string, unknown>)
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
    return (data ?? []).map((r) => mapArticle(r as unknown as Record<string, unknown>))
  },
}
