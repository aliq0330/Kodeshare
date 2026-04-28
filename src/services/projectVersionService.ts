import { supabase } from '@/lib/supabase'

export interface ProjectVersionFile {
  id: string
  name: string
  language: string
  content: string
}

export interface ProjectVersion {
  id: string
  projectId: string
  versionNumber: number
  title: string
  files: ProjectVersionFile[]
  label: string | null
  createdAt: string
}

const MAX_VERSIONS = 50

async function currentUserId(): Promise<string> {
  const id = (await supabase.auth.getSession()).data.session?.user?.id
  if (!id) throw new Error('Oturum açmanız gerekiyor')
  return id
}

function mapVersion(row: Record<string, unknown>): ProjectVersion {
  return {
    id:            row.id as string,
    projectId:     row.project_id as string,
    versionNumber: row.version_number as number,
    title:         (row.title as string) ?? '',
    files:         (row.files as ProjectVersionFile[]) ?? [],
    label:         (row.label as string) ?? null,
    createdAt:     row.created_at as string,
  }
}

export const projectVersionService = {
  async getVersions(projectId: string): Promise<ProjectVersion[]> {
    const { data, error } = await supabase
      .from('project_versions')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(MAX_VERSIONS)
    if (error) throw new Error(error.message)
    return (data ?? []).map((r) => mapVersion(r as unknown as Record<string, unknown>))
  },

  async saveVersion(params: {
    projectId: string
    title: string
    files: ProjectVersionFile[]
    label?: string
  }): Promise<ProjectVersion> {
    const userId = await currentUserId()

    const { data: last } = await supabase
      .from('project_versions')
      .select('version_number')
      .eq('project_id', params.projectId)
      .order('version_number', { ascending: false })
      .limit(1)

    const nextNum = last && (last as unknown as Array<{ version_number: number }>).length > 0
      ? (last as unknown as Array<{ version_number: number }>)[0].version_number + 1
      : 1

    const { data, error } = await supabase
      .from('project_versions')
      .insert({
        project_id:     params.projectId,
        author_id:      userId,
        version_number: nextNum,
        title:          params.title,
        files:          params.files,
        label:          params.label ?? null,
      })
      .select('*')
      .single()

    if (error) throw new Error(error.message)
    void this.pruneOldVersions(params.projectId, userId)
    return mapVersion(data as unknown as Record<string, unknown>)
  },

  async deleteVersion(versionId: string): Promise<void> {
    const userId = await currentUserId()
    const { error } = await supabase
      .from('project_versions')
      .delete()
      .eq('id', versionId)
      .eq('author_id', userId)
    if (error) throw new Error(error.message)
  },

  async pruneOldVersions(projectId: string, userId: string): Promise<void> {
    const { data } = await supabase
      .from('project_versions')
      .select('id')
      .eq('project_id', projectId)
      .eq('author_id', userId)
      .order('created_at', { ascending: false })
    const all = (data ?? []) as unknown as Array<{ id: string }>
    if (all.length <= MAX_VERSIONS) return
    const ids = all.slice(MAX_VERSIONS).map((v) => v.id)
    await supabase.from('project_versions').delete().in('id', ids)
  },
}
