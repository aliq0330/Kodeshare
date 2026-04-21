import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type BlockType = 'p' | 'h1' | 'h2' | 'h3' | 'quote' | 'code' | 'image' | 'divider'

export interface ArticleBlock {
  id: string
  type: BlockType
  content: string
}

export interface Article {
  id: string
  title: string
  subtitle: string
  coverImage: string
  blocks: ArticleBlock[]
  tags: string[]
  published: boolean
  readingTime: number
  createdAt: string
  updatedAt: string
}

let seq = 1
export const genBlockId = () => `b${Date.now()}-${seq++}`

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()

const calcReadingTime = (title: string, subtitle: string, blocks: ArticleBlock[]) => {
  const words = [title, subtitle, ...blocks.map(b => b.content)]
    .map(stripHtml).join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

interface ArticleStore {
  articles: Article[]
  create:  () => Article
  save:    (id: string, data: Pick<Article, 'title' | 'subtitle' | 'coverImage' | 'blocks' | 'tags'>) => void
  publish: (id: string, published: boolean) => void
  remove:  (id: string) => void
}

export const useArticleStore = create<ArticleStore>()(
  persist(
    (set) => ({
      articles: [],

      create: () => {
        const article: Article = {
          id:          genBlockId(),
          title:       '',
          subtitle:    '',
          coverImage:  '',
          blocks:      [{ id: genBlockId(), type: 'p', content: '' }],
          tags:        [],
          published:   false,
          readingTime: 1,
          createdAt:   new Date().toISOString(),
          updatedAt:   new Date().toISOString(),
        }
        set(s => ({ articles: [article, ...s.articles] }))
        return article
      },

      save: (id, data) =>
        set(s => ({
          articles: s.articles.map(a =>
            a.id !== id ? a : {
              ...a, ...data,
              readingTime: calcReadingTime(data.title, data.subtitle, data.blocks),
              updatedAt: new Date().toISOString(),
            }
          ),
        })),

      publish: (id, published) =>
        set(s => ({
          articles: s.articles.map(a =>
            a.id !== id ? a : { ...a, published, updatedAt: new Date().toISOString() }
          ),
        })),

      remove: (id) => set(s => ({ articles: s.articles.filter(a => a.id !== id) })),
    }),
    { name: 'kodeshare-articles' }
  )
)
