import { supabase } from '@/lib/supabase'
import type { ArticleBlock } from '@store/articleStore'

export interface ArticleVersion {
  id: string
  articleId: string
  versionNumber: number
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
  label: string | null
  createdAt: string
}

const MAX_VERSIONS = 50

async function currentUserId(): Promise<string> {
  const id = (await supabase.auth.getSession()).data.session?.user?.id
  if (!id) throw new Error('Oturum açmanız gerekiyor')
  return id
}

function mapVersion(row: Record<string, unknown>): ArticleVersion {
  return {
    id:            row.id as string,
    articleId:     row.article_id as string,
    versionNumber: row.version_number as number,
    title:         (row.title as string) ?? '',
    subtitle:      (row.subtitle as string) ?? '',
    coverImage:    (row.cover_image as string) ?? null,
    blocks:        (row.blocks as ArticleBlock[]) ?? [],
    label:         (row.label as string) ?? null,
    createdAt:     row.created_at as string,
  }
}

export const articleVersionService = {
  async getVersions(articleId: string): Promise<ArticleVersion[]> {
    const { data, error } = await supabase
      .from('article_versions')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(MAX_VERSIONS)
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapVersion(r as unknown as Record<string, unknown>))
  },

  async saveVersion(params: {
    articleId: string
    title: string
    subtitle: string
    coverImage: string | null
    blocks: ArticleBlock[]
    label?: string
  }): Promise<ArticleVersion> {
    const userId = await currentUserId()

    // Get next version number
    const { data: last } = await supabase
      .from('article_versions')
      .select('version_number')
      .eq('article_id', params.articleId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextNum = last && (last as unknown as Array<{ version_number: number }>).length > 0
      ? (last as unknown as Array<{ version_number: number }>)[0].version_number + 1
      : 1

    const { data, error } = await supabase
      .from('article_versions')
      .insert({
        article_id:     params.articleId,
        author_id:      userId,
        version_number: nextNum,
        title:          params.title,
        subtitle:       params.subtitle,
        cover_image:    params.coverImage,
        blocks:         params.blocks,
        label:          params.label ?? null,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    void this.pruneOldVersions(params.articleId, userId)
    return mapVersion(data as unknown as Record<string, unknown>)
  },

  async deleteVersion(versionId: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('article_versions')
      .delete()
      .eq('id', versionId)
      .eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async pruneOldVersions(articleId: string, userId: string): Promise<void> {
    const { data } = await supabase
      .from('article_versions')
      .select('id')
      .eq('article_id', articleId)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    const all = (data ?? []) as unknown as Array<{ id: string }>
    if (all.length <= MAX_VERSIONS) return
    const ids = all.slice(MAX_VERSIONS).map((v) => v.id)
    await supabase.from('article_versions').delete().in('id', ids)
  },
}
