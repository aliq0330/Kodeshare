import { create } from 'zustand'
import type { SavedProject } from '@services/projectService'

interface PrefilledSnippet {
  code: string
  language: string
}

interface ComposerStore {
  open: boolean
  prefilledProject: SavedProject | null
  prefilledSnippet: PrefilledSnippet | null
  openWithProject: (project: SavedProject) => void
  openWithSnippet: (code: string, language: string) => void
  openComposer: () => void
  closeComposer: () => void
}

export const useComposerStore = create<ComposerStore>((set) => ({
  open:              false,
  prefilledProject:  null,
  prefilledSnippet:  null,
  openWithProject:   (project)          => set({ open: true, prefilledProject: project, prefilledSnippet: null }),
  openWithSnippet:   (code, language)   => set({ open: true, prefilledSnippet: { code, language }, prefilledProject: null }),
  openComposer:      ()                 => set({ open: true, prefilledProject: null, prefilledSnippet: null }),
  closeComposer:     ()                 => set({ open: false }),
}))
