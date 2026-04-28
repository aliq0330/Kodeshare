import { supabase } from '@/lib/supabase'

export interface CloudDraft {
  id: string
  description: string | null
  tags: string | null
  blocks: unknown[]
  createdAt: string
  updatedAt: string
}

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

export const draftService = {
  async list(): Promise<CloudDraft[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data, error } = await supabase
      .from('post_drafts')
      .select('*')
      .eq('author_id', userId)
      .order('updated_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data ?? []).map(mapDraft)
  },

  async save(id: string | null, payload: { description: string; tags: string; blocks: unknown[] }): Promise<CloudDraft> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş yapmalısın')

    if (id) {
      const { data, error } = await supabase
        .from('post_drafts')
        .update({ description: payload.description, tags: payload.tags, blocks: payload.blocks })
        .eq('id', id)
        .eq('author_id', userId)
        .select('*')
        .single()
      if (error) throw new Error(error.message)
      return mapDraft(data as Record<string, unknown>)
    }

    const { data, error } = await supabase
      .from('post_drafts')
      .insert({ author_id: userId, description: payload.description, tags: payload.tags, blocks: payload.blocks })
      .select('*')
      .single()
    if (error) throw new Error(error.message)
    return mapDraft(data as Record<string, unknown>)
  },

  async delete(id: string): Promise<void> {
    await supabase.from('post_drafts').delete().eq('id', id)
  },
}

function mapDraft(d: Record<string, unknown>): CloudDraft {
  return {
    id:          d.id as string,
    description: d.description as string | null,
    tags:        d.tags as string | null,
    blocks:      (d.blocks as unknown[]) ?? [],
    createdAt:   d.created_at as string,
    updatedAt:   d.updated_at as string,
  }
}
