import { create } from 'zustand'

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

interface ArticleState {
  id: string
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
  activeBlockId: string | null
  isDirty: boolean

  setTitle: (t: string) => void
  setSubtitle: (t: string) => void
  setCoverImage: (src: string | null) => void
  setActiveBlock: (id: string | null) => void
  addBlock: (afterId: string | null, type: BlockType, partial?: Partial<ArticleBlock>) => string
  updateBlock: (id: string, updates: Partial<ArticleBlock>) => void
  removeBlock: (id: string) => void
  moveBlock: (id: string, dir: 'up' | 'down') => void
  reset: () => void
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const makeInitialBlocks = (): ArticleBlock[] => [
  { id: genId(), type: 'paragraph', content: '' },
]

export const useArticleStore = create<ArticleState>()((set) => ({
  id: genId(),
  title: '',
  subtitle: '',
  coverImage: null,
  blocks: makeInitialBlocks(),
  activeBlockId: null,
  isDirty: false,

  setTitle: (t) => set({ title: t, isDirty: true }),
  setSubtitle: (t) => set({ subtitle: t, isDirty: true }),
  setCoverImage: (src) => set({ coverImage: src, isDirty: true }),
  setActiveBlock: (id) => set({ activeBlockId: id }),

  addBlock: (afterId, type, partial = {}) => {
    const id = genId()
    const defaults: Partial<ArticleBlock> = {}
    if (type === 'code') { defaults.language = 'javascript'; defaults.code = '' }
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
    set((s) => ({
      blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      isDirty: true,
    })),

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
      if (dir === 'up' && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
      if (dir === 'down' && idx < next.length - 1)
        [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
      return { blocks: next, isDirty: true }
    }),

  reset: () =>
    set({
      id: genId(),
      title: '',
      subtitle: '',
      coverImage: null,
      blocks: makeInitialBlocks(),
      activeBlockId: null,
      isDirty: false,
    }),
}))
