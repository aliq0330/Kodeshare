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

export interface SavedArticleRecord {
  id: string
  title: string
  subtitle: string
  coverImage: string | null
  blocks: ArticleBlock[]
  savedAt: string
  updatedAt: string
}

const STORAGE_KEY = 'kodeshare_articles'

export function listArticles(): SavedArticleRecord[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeArticles(records: SavedArticleRecord[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
    return true
  } catch {
    return false
  }
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

  saveArticle: () => void
  loadArticle: (record: SavedArticleRecord) => void
  deleteArticle: (id: string) => void
}

const genId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

const makeInitialBlocks = (): ArticleBlock[] => [
  { id: genId(), type: 'paragraph', content: '' },
]

export const useArticleStore = create<ArticleState>()((set, get) => ({
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
    set((s) => {
      if (!s.blocks.some((b) => b.id === id)) return s
      return {
        blocks: s.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
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

  saveArticle: () => {
    const { id, title, subtitle, coverImage, blocks } = get()
    const records = listArticles()
    const existingIdx = records.findIndex((r) => r.id === id)
    const now = new Date().toISOString()
    const savedAt = existingIdx >= 0 ? records[existingIdx].savedAt : now

    const upsert = (recs: SavedArticleRecord[], rec: SavedArticleRecord) => {
      const next = [...recs]
      if (existingIdx >= 0) next[existingIdx] = rec
      else next.unshift(rec)
      return next
    }

    // 1. Görseller dahil kaydet
    const fullRecord: SavedArticleRecord = {
      id, title: title.trim() || 'Başlıksız Makale',
      subtitle, coverImage, blocks, savedAt, updatedAt: now,
    }
    if (writeArticles(upsert(records, fullRecord))) {
      set({ isDirty: false })
      return
    }

    // 2. Kota aşıldıysa görseller olmadan kaydet
    const lightRecord: SavedArticleRecord = {
      ...fullRecord,
      coverImage: null,
      blocks: blocks.map((b) => (b.type === 'image' ? { ...b, src: undefined } : b)),
    }
    writeArticles(upsert(records, lightRecord))
    set({ isDirty: false })
  },

  loadArticle: (record) =>
    set({
      id: record.id,
      title: record.title,
      subtitle: record.subtitle,
      coverImage: record.coverImage,
      blocks: record.blocks,
      activeBlockId: null,
      isDirty: false,
    }),

  deleteArticle: (id) => {
    writeArticles(listArticles().filter((r) => r.id !== id))
  },
}))
