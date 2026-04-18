import { create } from 'zustand'
import type { SavedProject } from '@services/projectService'

interface ComposerStore {
  open: boolean
  prefilledProject: SavedProject | null
  openWithProject: (project: SavedProject) => void
  openComposer: () => void
  closeComposer: () => void
}

export const useComposerStore = create<ComposerStore>((set) => ({
  open: false,
  prefilledProject: null,
  openWithProject: (project) => set({ open: true, prefilledProject: project }),
  openComposer: () => set({ open: true, prefilledProject: null }),
  closeComposer: () => set({ open: false }),
}))
