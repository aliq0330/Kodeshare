import { supabase } from '@/lib/supabase'
import { languageFromFilename } from '@editor/utils/languageUtils'
import type { EditorFile, EditorLanguage } from '@/types'

export interface SavedProject {
  id: string
  title: string
  files: EditorFile[]
  updatedAt: string
}

async function currentUserId(): Promise<string | undefined> {
  return (await supabase.auth.getSession()).data.session?.user?.id
}

function mapProject(p: Record<string, unknown>): SavedProject {
  const files = ((p.post_files as Record<string, unknown>[]) ?? [])
    .sort((a, b) => ((a.order as number) ?? 0) - ((b.order as number) ?? 0))
    .map((f) => ({
      id:         f.id as string,
      name:       f.name as string,
      language:   f.language as EditorLanguage,
      content:    (f.content as string) ?? '',
      isModified: false,
    }))
  return {
    id:        p.id as string,
    title:     p.title as string,
    files,
    updatedAt: p.updated_at as string,
  }
}

export const projectService = {
  async list(): Promise<SavedProject[]> {
    const userId = await currentUserId()
    if (!userId) return []
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, updated_at, post_files(*)')
      .eq('author_id', userId)
      .eq('type', 'project')
      .order('updated_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map((p) => mapProject(p as Record<string, unknown>))
  },

  async create(title: string): Promise<SavedProject> {
    const userId = await currentUserId()
    if (!userId) throw new Error('Giriş gerekli')

    const { data: post, error } = await supabase
      .from('posts')
      .insert({ author_id: userId, type: 'project', title, tags: [] })
      .select()
      .single()
    if (error) throw error

    const postId = (post as Record<string, unknown>).id as string
    await supabase.from('post_files').insert([
      {
        post_id: postId, name: 'index.html', language: 'html', order: 0,
        content: `<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8" />\n  <title>${title}</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <h1>${title}</h1>\n  <script src="script.js"><\/script>\n</body>\n</html>`,
      },
      { post_id: postId, name: 'style.css',  language: 'css',        order: 1, content: '/* Stiller */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}\n' },
      { post_id: postId, name: 'script.js',  language: 'javascript', order: 2, content: '// JavaScript\nconsole.log("Hazır!");\n' },
    ])

    const { data: full, error: e2 } = await supabase
      .from('posts')
      .select('id, title, updated_at, post_files(*)')
      .eq('id', postId)
      .single()
    if (e2) throw e2
    return mapProject(full as Record<string, unknown>)
  },

  async save(id: string, title: string, files: EditorFile[]): Promise<void> {
    await supabase.from('posts').update({ title }).eq('id', id)
    await supabase.from('post_files').delete().eq('post_id', id)
    if (files.length) {
      await supabase.from('post_files').insert(
        files.map((f, i) => ({
          post_id:  id,
          name:     f.name,
          language: f.language,
          content:  f.content,
          order:    i,
        })),
      )
    }
  },

  async rename(id: string, title: string): Promise<void> {
    await supabase.from('posts').update({ title }).eq('id', id)
  },

  async renameFile(fileId: string, name: string): Promise<void> {
    const language = languageFromFilename(name)
    await supabase.from('post_files').update({ name, language }).eq('id', fileId)
  },

  async addFile(projectId: string, name: string, order: number): Promise<EditorFile> {
    const language = languageFromFilename(name)
    const { data, error } = await supabase
      .from('post_files')
      .insert({ post_id: projectId, name, language, content: '', order })
      .select()
      .single()
    if (error) throw error
    const f = data as Record<string, unknown>
    return { id: f.id as string, name: f.name as string, language: f.language as EditorLanguage, content: '', isModified: false }
  },

  async deleteFile(fileId: string): Promise<void> {
    await supabase.from('post_files').delete().eq('id', fileId)
  },

  async remove(id: string): Promise<void> {
    await supabase.from('posts').delete().eq('id', id)
  },
}
