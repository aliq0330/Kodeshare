import { create } from 'zustand'
import type { SavedProject } from '@services/projectService'
import type { Post, PostBlock } from '@/types'

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

export type EditSavedPayload = { description: string | null; tags: string[]; blocks: PostBlock[] }

interface ComposerStore {
  open: boolean
  prefilledProject: SavedProject | null
  prefilledSnippet: PrefilledSnippet | null
  prefilledArticle: PrefilledArticle | null
  editingPost: Post | null
  onEditSaved: ((updated: EditSavedPayload) => void) | null
  openWithProject: (project: SavedProject) => void
  openWithSnippet: (code: string, language: string) => void
  openWithArticle: (article: PrefilledArticle) => void
  openComposer: () => void
  openEditComposer: (post: Post, onSaved?: (updated: EditSavedPayload) => void) => void
  closeComposer: () => void
}

export const useComposerStore = create<ComposerStore>((set) => ({
  open:              false,
  prefilledProject:  null,
  prefilledSnippet:  null,
  prefilledArticle:  null,
  editingPost:       null,
  onEditSaved:       null,
  openWithProject:   (project)        => set({ open: true, prefilledProject: project, prefilledSnippet: null, prefilledArticle: null, editingPost: null, onEditSaved: null }),
  openWithSnippet:   (code, language) => set({ open: true, prefilledSnippet: { code, language }, prefilledProject: null, prefilledArticle: null, editingPost: null, onEditSaved: null }),
  openWithArticle:   (article)        => set({ open: true, prefilledArticle: article, prefilledProject: null, prefilledSnippet: null, editingPost: null, onEditSaved: null }),
  openComposer:      ()               => set({ open: true, prefilledProject: null, prefilledSnippet: null, prefilledArticle: null, editingPost: null, onEditSaved: null }),
  openEditComposer:  (post, onSaved)  => set({ open: true, editingPost: post, onEditSaved: onSaved ?? null, prefilledProject: null, prefilledSnippet: null, prefilledArticle: null }),
  closeComposer:     ()               => set({ open: false, editingPost: null, onEditSaved: null }),
}))
