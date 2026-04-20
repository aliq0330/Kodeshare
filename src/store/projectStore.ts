import { create } from 'zustand'
import { projectService, type SavedProject } from '@services/projectService'
import toast from 'react-hot-toast'

interface ProjectStore {
  projects: SavedProject[]
  loading: boolean

  fetch:      () => Promise<void>
  addProject: (title: string) => Promise<SavedProject | null>
  patch:      (id: string, data: Partial<SavedProject>) => void
  remove:     (id: string) => void
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  loading:  false,

  fetch: async () => {
    set({ loading: true })
    try {
      const projects = await projectService.list()
      set({ projects })
    } catch {
      // silent
    } finally {
      set({ loading: false })
    }
  },

  addProject: async (title) => {
    try {
      const project = await projectService.create(title)
      set((s) => ({ projects: [project, ...s.projects] }))
      return project
    } catch {
      toast.error('Proje oluşturulamadı')
      return null
    }
  },

  patch: (id, data) =>
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)) })),

  remove: (id) =>
    set((s) => ({ projects: s.projects.filter((p) => p.id !== id) })),
}))
