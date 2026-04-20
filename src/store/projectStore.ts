import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { projectService, type SavedProject } from '@services/projectService'
import toast from 'react-hot-toast'

interface ProjectStore {
  projects: SavedProject[]
  loading: boolean
  activeProjectId: string | null

  fetch: () => Promise<void>
  setActiveId: (id: string | null) => void
  addProject: (title: string) => Promise<SavedProject | null>
  patch: (id: string, data: Partial<SavedProject>) => void
  remove: (id: string) => void
}

export const useProjectStore = create<ProjectStore>()(
  persist(
  (set, get) => ({
  projects: [],
  loading: false,
  activeProjectId: null,

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

  setActiveId: (id) => set({ activeProjectId: id }),

  addProject: async (title) => {
    try {
      const project = await projectService.create(title)
      set((s) => ({ projects: [project, ...s.projects], activeProjectId: project.id }))
      return project
    } catch {
      toast.error('Proje oluşturulamadı')
      return null
    }
  },

  patch: (id, data) =>
    set((s) => ({ projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)) })),

  remove: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      activeProjectId:
        s.activeProjectId === id
          ? (s.projects.find((p) => p.id !== id)?.id ?? null)
          : s.activeProjectId,
    })),
  }),
  { name: 'project-active', partialize: (s) => ({ activeProjectId: s.activeProjectId }) },
))
