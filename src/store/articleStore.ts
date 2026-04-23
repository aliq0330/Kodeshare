import { create } from 'zustand'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'

export type { ArticleRecord }

export type BlockType =
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'image'
  | 'code'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'post-embed'

export interface ArticleBlock {
  id: string
  type: BlockType
  content?: string
  src?: string
  caption?: string
  language?: string
  code?: string
  filename?: string
  emoji?: string
  calloutColor?: 'blue' | 'yellow' | 'green' | 'red' | 'purple'
}

// Backward compat alias
export type SavedArticleRecord = ArticleRecord

interface ArticleState {
  supabaseId:  string | null
  isPublished: boolean
  isSaving:    boolean

  title:         string
  subtitle:      string
  coverImage:    string | null
  blocks:        ArticleBlock[]
  activeBlockId: string | null
  isDirty:       boolean

  setTitle: (t: string) => void
  setSubtitle: (t: string) => void
  setCoverImage: (src: string | null) => void
  setActiveBlock: (id: string | null) => void
  addBlock: (afterId: string | null, type: BlockType, partial?: Partial<ArticleBlock>) => string
  updateBlock: (id: string, updates: Partial<ArticleBlock>) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, dir: 'up' | 'down') => void
  reset: () => void

  saveArticle: () => Promise<void>
  publishArticle: () => Promise<void>
  unpublishArticle: () => Promise<void>
  loadArticle: (record: ArticleRecord) => void
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const makeInitialBlocks = (): ArticleBlock[] => [
  { id: genId(), type: 'paragraph', content: '' },
]

export const useArticleStore = create<ArticleState>()((set, get) => ({
  supabaseId:    null,
  isPublished:   false,
  isSaving:      false,

  title:         '',
  subtitle:      '',
  coverImage:    null,
  blocks:        makeInitialBlocks(),
  activeBlockId: null,
  isDirty:       false,

  setTitle:       (t)   => set({ title: t,       isDirty: true }),
  setSubtitle:    (t)   => set({ subtitle: t,    isDirty: true }),
  setCoverImage:  (src) => set({ coverImage: src, isDirty: true }),
  setActiveBlock: (id)  => set({ activeBlockId: id }),

  addBlock: (afterId, type, partial = {}) => {
    const id = genId()
    const defaults: Partial<ArticleBlock> = {}
    if (type === 'code')    { defaults.language = 'javascript'; defaults.code = '' }
    if (type === 'callout') { defaults.emoji = '💡'; defaults.calloutColor = 'blue' }
    const block: ArticleBlock = { id, type, content: '', ...defaults, ...partial }
    set((s) => {
      if (!afterId) return { blocks: [...s.blocks, block], isDirty: true }
      const idx = s.blocks.findIndex((b) => b.id === afterId)
      const next = [...s.blocks]
      next.splice(idx + 1, 0, block)
      return { blocks: next, isDirty: true }
    })
    return id
  },

  updateBlock: (id, updates) =>
    set((s) => {
      if (!s.blocks.some((b) => b.id === id)) return s
      return {
        blocks:  s.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
        isDirty: true,
      }
    }),

  removeBlock: (id) =>
    set((s) => {
      if (s.blocks.length <= 1) return {}
      return { blocks: s.blocks.filter((b) => b.id !== id), isDirty: true }
    }),

  moveBlock: (id, dir) =>
    set((s) => {
      const idx = s.blocks.findIndex((b) => b.id === id)
      if (idx === -1) return {}
      const next = [...s.blocks]
      if (dir === 'up'   && idx > 0)               [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      if (dir === 'down' && idx < next.length - 1)  [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return { blocks: next, isDirty: true }
    }),

  reset: () =>
    set({
      supabaseId:    null,
      isPublished:   false,
      isSaving:      false,
      title:         '',
      subtitle:      '',
      coverImage:    null,
      blocks:        makeInitialBlocks(),
      activeBlockId: null,
      isDirty:       false,
    }),

  saveArticle: async () => {
    const { supabaseId, title, subtitle, coverImage, blocks } = get()
    set({ isSaving: true })
    try {
      const record = await articleService.save({
        id:         supabaseId,
        title:      title.trim() || 'Başlıksız Makale',
        subtitle,
        coverImage,
        blocks,
      })
      set({ supabaseId: record.id, isDirty: false })
    } finally {
      set({ isSaving: false })
    }
  },

  publishArticle: async () => {
    const { supabaseId, title, subtitle, coverImage, blocks, isDirty } = get()
    set({ isSaving: true })
    try {
      let id = supabaseId
      if (!id || isDirty) {
        const saved = await articleService.save({
          id,
          title: title.trim() || 'Başlıksız Makale',
          subtitle,
          coverImage,
          blocks,
        })
        id = saved.id
        set({ supabaseId: id, isDirty: false })
      }
      await articleService.publish(id!)
      set({ isPublished: true })
    } finally {
      set({ isSaving: false })
    }
  },

  unpublishArticle: async () => {
    const { supabaseId } = get()
    if (!supabaseId) return
    set({ isSaving: true })
    try {
      await articleService.unpublish(supabaseId)
      set({ isPublished: false })
    } finally {
      set({ isSaving: false })
    }
  },

  loadArticle: (record) =>
    set({
      supabaseId:    record.id,
      isPublished:   record.isPublished,
      isSaving:      false,
      title:         record.title,
      subtitle:      record.subtitle,
      coverImage:    record.coverImage,
      blocks:        record.blocks.length ? record.blocks : makeInitialBlocks(),
      activeBlockId: null,
      isDirty:       false,
    }),
}))
