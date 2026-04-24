import { create } from 'zustand'
import type { SavedProject } from '@services/projectService'

interface PrefilledSnippet {
  code: string
  language: string
}

export interface PrefilledArticle {
  id: string
  title: string
  coverImage: string | null
  content: string
}

interface ComposerStore {
  open: boolean
  prefilledProject: SavedProject | null
  prefilledSnippet: PrefilledSnippet | null
  prefilledArticle: PrefilledArticle | null
  openWithProject: (project: SavedProject) => void
  openWithSnippet: (code: string, language: string) => void
  openWithArticle: (article: PrefilledArticle) => void
  openComposer: () => void
  closeComposer: () => void
}

export const useComposerStore = create<ComposerStore>((set) => ({
  open:              false,
  prefilledProject:  null,
  prefilledSnippet:  null,
  prefilledArticle:  null,
  openWithProject:   (project)          => set({ open: true, prefilledProject: project, prefilledSnippet: null, prefilledArticle: null }),
  openWithSnippet:   (code, language)   => set({ open: true, prefilledSnippet: { code, language }, prefilledProject: null, prefilledArticle: null }),
  openWithArticle:   (article)          => set({ open: true, prefilledArticle: article, prefilledProject: null, prefilledSnippet: null }),
  openComposer:      ()                 => set({ open: true, prefilledProject: null, prefilledSnippet: null, prefilledArticle: null }),
  closeComposer:     ()                 => set({ open: false }),
}))
