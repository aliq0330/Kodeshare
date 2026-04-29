import { useCallback, useEffect, useRef, useState } from 'react'
import { Code2, Image, Link2, Video, FileText, FolderOpen, Plus, ChevronDown, X, Trash2, Cloud, UploadCloud, Clock, Hash, Eye, Pencil } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Spinner from '@components/ui/Spinner'
import BlockView from '@modules/post/BlockView'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useComposerStore } from '@store/composerStore'
import { projectService, type SavedProject } from '@services/projectService'
import { articleService } from '@services/articleService'
import { draftService, type CloudDraft } from '@services/draftService'
import { searchTags } from '@services/postService'
import type { ArticleRecord } from '@services/articleService'
import { LANGUAGE_COLORS } from '@utils/constants'
import { timeAgo } from '@utils/formatters'
import toast from 'react-hot-toast'
import type { PostBlock, PostBlockType } from '@/types'

const DRAFT_KEY = 'kodeshare:composer-draft-v3'
const DEFAULT_LANG: SnippetLang = 'javascript'

const EXT_MAP: Record<SnippetLang, string> = {
  javascript: 'js',
  css: 'css',
  html: 'html',
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
}

function toSnippetLang(lang: string): SnippetLang {
  if (lang === 'css' || lang === 'html') return lang
  return 'javascript'
}

function detectLangFromContent(code: string): SnippetLang | null {
  const c = code.trim()
  if (!c) return null
  if (/^<!(doctype|--)|^<\s*(html|head|body|main|section|article|nav|header|footer|div|span|p|a|ul|ol|li|h[1-6]|form|input|button|script|style|link|meta|img|table|tr|td|thead|tbody|label|textarea|select|option|br|hr|iframe|svg|canvas)\b/i.test(c)) return 'html'
  if (/^\s*@(import|media|keyframes|charset|font-face|supports|page)\b/m.test(c)) return 'css'
  if (/(^|\n)\s*[.#:\w][^{}\n]{0,200}\{\s*[-\w]+\s*:\s*[^;{}]+/.test(c)) return 'css'
  if (/\b(function|const|let|var|import|export|class|return|console\.|=>|typeof|new\s+\w|document\.|window\.)\b/.test(c)) return 'javascript'
  return null
}

type ComposerBlock =
  | { localId: string; type: 'snippet'; code: string; language: SnippetLang; manual: boolean }
  | { localId: string; type: 'project'; project: SavedProject | null }
  | { localId: string; type: 'image'; url: string }
  | { localId: string; type: 'link'; url: string; title: string }
  | { localId: string; type: 'video'; url: string }
  | { localId: string; type: 'article'; articleId: string | null; articleTitle: string; coverImage: string | null; content: string }

interface Draft {
  description: string
  tags: string[]
  blocks: ComposerBlock[]
}

function loadDraft(): Partial<Draft> | null {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function saveDraft(d: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* noop */ }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
}

const BLOCK_OPTIONS: { type: PostBlockType; label: string; icon: React.ReactNode }[] = [
  { type: 'snippet', label: 'Snippet', icon: <Code2 className="w-4 h-4" /> },
  { type: 'project', label: 'Proje',   icon: <FolderOpen className="w-4 h-4" /> },
  { type: 'article', label: 'Makale',  icon: <FileText className="w-4 h-4" /> },
  { type: 'image',   label: 'Görsel',  icon: <Image className="w-4 h-4" /> },
  { type: 'link',    label: 'Link',    icon: <Link2 className="w-4 h-4" /> },
  { type: 'video',   label: 'Video',   icon: <Video className="w-4 h-4" /> },
]

function extractArticleContent(article: ArticleRecord): string {
  return article.blocks
    .map((b) => {
      if (['paragraph', 'heading1', 'heading2', 'heading3', 'quote', 'callout'].includes(b.type))
        return (b.content ?? '').replace(/<[^>]*>/g, '')
      if (b.type === 'code') return b.code ?? ''
      return ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function articleWordCount(article: ArticleRecord): number {
  return article.blocks
    .map((b) => (b.content ?? '').replace(/<[^>]*>/g, '') + ' ' + (b.code ?? ''))
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
}

function makeBlock(type: PostBlockType): ComposerBlock {
  switch (type) {
    case 'snippet': return { localId: newId(), type: 'snippet', code: '', language: DEFAULT_LANG, manual: false }
    case 'project': return { localId: newId(), type: 'project', project: null }
    case 'image':   return { localId: newId(), type: 'image',   url: '' }
    case 'link':    return { localId: newId(), type: 'link',    url: '', title: '' }
    case 'video':   return { localId: newId(), type: 'video',   url: '' }
    case 'article': return { localId: newId(), type: 'article', articleId: null, articleTitle: '', coverImage: null, content: '' }
  }
}

function blockToPayload(b: ComposerBlock, position: number) {
  switch (b.type) {
    case 'snippet': return { type: 'snippet' as const, position, data: { language: b.language, content: b.code, name: `snippet.${EXT_MAP[b.language]}` } }
    case 'project': return { type: 'project' as const, position, data: { files: b.project?.files?.map(f => ({ name: f.name, language: f.language, content: f.content })) ?? [] } }
    case 'image':   return { type: 'image'   as const, position, data: { url: b.url } }
    case 'link':    return { type: 'link'    as const, position, data: { url: b.url, title: b.title } }
    case 'video':   return { type: 'video'   as const, position, data: { url: b.url } }
    case 'article': return { type: 'article' as const, position, data: { content: b.content, title: b.articleTitle, articleId: b.articleId, coverImage: b.coverImage } }
  }
}

function composerBlocksToPostBlocks(bs: ComposerBlock[]): PostBlock[] {
  return bs
    .filter((b) => {
      if (b.type === 'snippet') return b.code.trim()
      if (b.type === 'project') return !!b.project
      if (b.type === 'image')   return b.url.trim()
      if (b.type === 'link')    return b.url.trim()
      if (b.type === 'video')   return b.url.trim()
      if (b.type === 'article') return !!b.articleId
      return false
    })
    .map((b, i) => {
      const p = blockToPayload(b, i)
      return { id: b.localId, type: p.type, position: i, data: p.data }
    })
}

interface PostComposerProps {
  hideCard?: boolean
}

export default function PostComposer({ hideCard = false }: PostComposerProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { createPost } = usePostStore()
  const { open, prefilledProject, prefilledSnippet, prefilledArticle, openComposer, closeComposer } = useComposerStore()

  const [composerMode, setComposerMode] = useState<'edit' | 'preview'>('edit')
  const [description, setDescription] = useState('')
  const [tags, setTags]               = useState<string[]>([])
  const [tagInput, setTagInput]       = useState('')
  const [tagSuggestions, setTagSuggestions] = useState<string[]>([])
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [blocks, setBlocks]           = useState<ComposerBlock[]>([])
  const [loading, setLoading]         = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const addMenuRef      = useRef<HTMLDivElement>(null)
  const tagSuggestRef   = useRef<HTMLDivElement>(null)
  const searchDebounce  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedRef     = useRef(false)

  // Cloud draft state
  const [cloudDraftId, setCloudDraftId]   = useState<string | null>(null)
  const [cloudSaving, setCloudSaving]     = useState(false)
  const [draftsOpen, setDraftsOpen]       = useState(false)
  const [cloudDrafts, setCloudDrafts]     = useState<CloudDraft[]>([])
  const [draftsLoading, setDraftsLoading] = useState(false)

  // Project picker state (per project block)
  const [pickerBlockId, setPickerBlockId]       = useState<string | null>(null)
  const [pickerProjects, setPickerProjects]     = useState<SavedProject[]>([])
  const [pickerLoading, setPickerLoading]       = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Article picker state (per article block)
  const [articlePickerBlockId, setArticlePickerBlockId] = useState<string | null>(null)
  const [pickerArticles, setPickerArticles]             = useState<ArticleRecord[]>([])
  const [articlePickerLoading, setArticlePickerLoading] = useState(false)
  const articlePickerRef = useRef<HTMLDivElement>(null)

  // Restore draft / prefilled content
  useEffect(() => {
    if (!open || hydratedRef.current) return
    hydratedRef.current = true
    if (prefilledSnippet) {
      const b: ComposerBlock = { localId: newId(), type: 'snippet', code: prefilledSnippet.code, language: toSnippetLang(prefilledSnippet.language), manual: true }
      setBlocks([b])
      return
    }
    if (prefilledProject) {
      const b: ComposerBlock = { localId: newId(), type: 'project', project: prefilledProject }
      setBlocks([b])
      return
    }
    if (prefilledArticle) {
      const b: ComposerBlock = { localId: newId(), type: 'article', articleId: prefilledArticle.id, articleTitle: prefilledArticle.title, coverImage: prefilledArticle.coverImage, content: prefilledArticle.content }
      setBlocks([b])
      return
    }
    const d = loadDraft()
    if (!d) return
    if (d.description) setDescription(d.description)
    if (d.tags?.length) setTags(d.tags)
    if (d.blocks?.length) setBlocks(d.blocks)
  }, [open, prefilledProject, prefilledSnippet, prefilledArticle])

  useEffect(() => {
    if (!open || !prefilledSnippet) return
    const b: ComposerBlock = { localId: newId(), type: 'snippet', code: prefilledSnippet.code, language: toSnippetLang(prefilledSnippet.language), manual: true }
    setBlocks([b])
  }, [prefilledSnippet, open])

  useEffect(() => {
    if (!open || !prefilledProject) return
    const b: ComposerBlock = { localId: newId(), type: 'project', project: prefilledProject }
    setBlocks([b])
  }, [prefilledProject, open])

  useEffect(() => {
    if (!open || !prefilledArticle) return
    const b: ComposerBlock = { localId: newId(), type: 'article', articleId: prefilledArticle.id, articleTitle: prefilledArticle.title, coverImage: prefilledArticle.coverImage, content: prefilledArticle.content }
    setBlocks([b])
  }, [prefilledArticle, open])

  // Auto-save draft to localStorage
  useEffect(() => {
    if (!open) return
    const hasContent = description || tags.length > 0 || blocks.length > 0
    if (!hasContent) return
    saveDraft({ description, tags, blocks })
  }, [open, description, tags, blocks])

  // ESC closes expanded editor
  useEffect(() => {
    if (!expandedId) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExpandedId(null) } }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [expandedId])

  // Close tag suggestions on outside click
  useEffect(() => {
    if (!suggestionsOpen) return
    const h = (e: MouseEvent) => {
      if (tagSuggestRef.current && !tagSuggestRef.current.contains(e.target as Node)) setSuggestionsOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [suggestionsOpen])

  // Close add-block menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return
    const h = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [addMenuOpen])

  // Close project picker on outside click
  useEffect(() => {
    if (!pickerBlockId) return
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerBlockId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerBlockId])

  // Close article picker on outside click
  useEffect(() => {
    if (!articlePickerBlockId) return
    const h = (e: MouseEvent) => {
      if (articlePickerRef.current && !articlePickerRef.current.contains(e.target as Node)) setArticlePickerBlockId(null)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [articlePickerBlockId])

  const loadPickerProjects = useCallback(async () => {
    setPickerLoading(true)
    try {
      setPickerProjects(await projectService.list())
    } catch {
      toast.error('Projeler yüklenemedi')
    } finally {
      setPickerLoading(false)
    }
  }, [])

  const loadPickerArticles = useCallback(async () => {
    setArticlePickerLoading(true)
    try {
      setPickerArticles(await articleService.list())
    } catch {
      toast.error('Makaleler yüklenemedi')
    } finally {
      setArticlePickerLoading(false)
    }
  }, [])

  const addBlock = (type: PostBlockType) => {
    setBlocks((bs) => [...bs, makeBlock(type)])
    setAddMenuOpen(false)
  }

  const removeBlock = (localId: string) => {
    setBlocks((bs) => bs.filter((b) => b.localId !== localId))
    if (expandedId === localId) setExpandedId(null)
    if (pickerBlockId === localId) setPickerBlockId(null)
    if (articlePickerBlockId === localId) setArticlePickerBlockId(null)
  }

  const updateBlock = <T extends ComposerBlock>(localId: string, patch: Partial<T>) => {
    setBlocks((bs) => bs.map((b) => b.localId === localId ? { ...b, ...patch } as ComposerBlock : b))
  }

  const handleSnippetCodeChange = (localId: string, value: string) => {
    setBlocks((bs) => bs.map((b) => {
      if (b.localId !== localId || b.type !== 'snippet') return b
      const next = { ...b, code: value }
      if (!b.manual) {
        const detected = detectLangFromContent(value)
        if (detected) next.language = detected
      }
      return next
    }))
  }

  const addTag = (raw: string) => {
    const t = raw.toLowerCase().trim().replace(/^#+/, '')
    if (!t || tags.length >= 5 || tags.includes(t)) return
    setTags((prev) => [...prev, t])
    setTagInput('')
    setTagSuggestions([])
    setSuggestionsOpen(false)
  }

  const removeTag = (tag: string) => setTags((prev) => prev.filter((t) => t !== tag))

  const handleTagInputChange = (value: string) => {
    setTagInput(value)
    if (searchDebounce.current) clearTimeout(searchDebounce.current)
    const q = value.trim()
    if (!q) { setTagSuggestions([]); setSuggestionsOpen(false); return }
    searchDebounce.current = setTimeout(async () => {
      const results = await searchTags(q)
      const filtered = results.filter((s) => !tags.includes(s))
      setTagSuggestions(filtered)
      setSuggestionsOpen(filtered.length > 0)
    }, 200)
  }

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) }
    if (e.key === 'Escape') setSuggestionsOpen(false)
  }

  const reset = () => {
    setComposerMode('edit')
    setDescription(''); setTags([]); setTagInput(''); setTagSuggestions([]); setSuggestionsOpen(false)
    setBlocks([])
    setExpandedId(null); setPickerBlockId(null); setArticlePickerBlockId(null); setAddMenuOpen(false)
    setCloudDraftId(null)
    hydratedRef.current = false
  }

  const handleClose = () => { closeComposer(); reset() }

  // Cloud draft: save
  const handleCloudSave = async () => {
    if (!isAuthenticated) { toast.error('Taslak kaydetmek için giriş yapmalısın'); return }
    setCloudSaving(true)
    try {
      const saved = await draftService.save(cloudDraftId, { description, tags: tags.join(', '), blocks })
      setCloudDraftId(saved.id)
      toast.success('Taslak buluta kaydedildi')
    } catch {
      toast.error('Taslak kaydedilemedi')
    } finally {
      setCloudSaving(false)
    }
  }

  // Cloud draft: load list
  const handleOpenDrafts = async () => {
    if (!isAuthenticated) { toast.error('Taslakları görmek için giriş yapmalısın'); return }
    setDraftsOpen(true)
    setDraftsLoading(true)
    try {
      setCloudDrafts(await draftService.list())
    } catch {
      toast.error('Taslaklar yüklenemedi')
    } finally {
      setDraftsLoading(false)
    }
  }

  // Cloud draft: restore a draft
  const handleRestoreDraft = (draft: CloudDraft) => {
    setDescription(draft.description ?? '')
    const rawTags = draft.tags ?? ''
    setTags(rawTags ? rawTags.split(',').map((t) => t.trim()).filter(Boolean) : [])
    setBlocks((draft.blocks as ComposerBlock[]) ?? [])
    setCloudDraftId(draft.id)
    setDraftsOpen(false)
    toast.success('Taslak yüklendi')
  }

  // Cloud draft: delete a draft
  const handleDeleteDraft = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await draftService.delete(id)
      setCloudDrafts((prev) => prev.filter((d) => d.id !== id))
      if (cloudDraftId === id) setCloudDraftId(null)
      toast.success('Taslak silindi')
    } catch {
      toast.error('Taslak silinemedi')
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const validBlocks = blocks
        .filter((b) => {
          if (b.type === 'snippet')  return b.code.trim()
          if (b.type === 'project')  return !!b.project
          if (b.type === 'image')    return b.url.trim()
          if (b.type === 'link')     return b.url.trim()
          if (b.type === 'video')    return b.url.trim()
          if (b.type === 'article')  return !!b.articleId
          return false
        })
        .map((b, i) => blockToPayload(b, i))

      const desc = description.trim()
      const autoTitle = desc.split('\n')[0].slice(0, 100) || 'Gönderi'

      await createPost({
        type: 'post',
        title: autoTitle,
        description: desc || undefined,
        tags,
        blocks: validBlocks,
      })
      // Delete cloud draft on successful publish
      if (cloudDraftId) {
        void draftService.delete(cloudDraftId).catch(() => { /* noop */ })
      }
      toast.success('Gönderi paylaşıldı!')
      clearDraft(); reset(); closeComposer()
    } catch (err) {
      toast.error((err as Error).message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const triggerCard = !hideCard && (
    <div className="card p-4 flex items-center gap-3 cursor-pointer hover:border-surface-raised transition-colors" onClick={openComposer}>
      <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" />
      <span className="flex-1 text-sm text-gray-500 bg-surface-raised rounded-lg px-4 py-2 hover:bg-surface-border transition-colors">
        Ne paylaşmak istiyorsun?
      </span>
      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); openComposer() }}>
        <Code2 className="w-4 h-4" />
        Paylaş
      </Button>
    </div>
  )

  return (
    <>
      {triggerCard}

      <Modal
        open={open}
        onClose={handleClose}
        title="Yeni Gönderi"
        size="fullscreen"
        titleAction={isAuthenticated ? (
          <Button variant="ghost" size="sm" className="text-gray-500" onClick={handleOpenDrafts}>
            <Cloud className="w-4 h-4" />
            Taslaklar
          </Button>
        ) : undefined}
      >
        {/* Edit / Preview tabs */}
        <div className="sticky top-0 -mx-4 -mt-4 px-4 flex gap-0 border-b border-surface-border bg-surface-card z-10 mb-4">
          <button
            type="button"
            onClick={() => setComposerMode('edit')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${composerMode === 'edit' ? 'border-brand-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Pencil className="w-3.5 h-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setComposerMode('preview')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${composerMode === 'preview' ? 'border-brand-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
            <Eye className="w-3.5 h-3.5" />
            Önizleme
          </button>
        </div>

        {composerMode === 'edit' && (
        <div className="flex flex-col gap-4 flex-1">
          <Textarea
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ne hakkında?"
            rows={2}
          />
          {/* Tag input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-300">
              Etiketler
              <span className="ml-1.5 text-xs text-gray-500 font-normal">({tags.length}/5)</span>
            </label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/15 text-brand-400 text-xs font-medium border border-brand-500/30">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            {tags.length < 5 && (
              <div className="relative flex gap-2" ref={tagSuggestRef}>
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    <Hash className="w-3.5 h-3.5" />
                  </span>
                  <input
                    value={tagInput}
                    onChange={(e) => handleTagInputChange(e.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="etiket yaz, Enter ile ekle"
                    className="w-full bg-surface-card border border-surface-border rounded-lg pl-8 pr-3 py-2 text-sm text-white placeholder:text-gray-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                  {suggestionsOpen && tagSuggestions.length > 0 && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-20 card shadow-2xl py-1 max-h-44 overflow-y-auto">
                      {tagSuggestions.map((s) => (
                        <button
                          key={s}
                          type="button"
                          onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-surface-raised text-gray-300 hover:text-white transition-colors"
                        >
                          <Hash className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => addTag(tagInput)}
                  className="shrink-0 px-3 py-2 text-sm rounded-lg border border-surface-border text-gray-400 hover:text-white hover:border-brand-500 transition-colors"
                >
                  Ekle
                </button>
              </div>
            )}
          </div>

          {/* Block list */}
          {blocks.length > 0 && (
            <div className="flex flex-col gap-3">
              {blocks.map((block) => (
                <div key={block.localId} className="rounded-xl border border-surface-border p-3 flex flex-col gap-2">
                  {/* Block header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      {BLOCK_OPTIONS.find((o) => o.type === block.type)?.label}
                    </span>
                    <button type="button" onClick={() => removeBlock(block.localId)} className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Snippet editor */}
                  {block.type === 'snippet' && (
                    <SnippetCodeEditor
                      value={block.code}
                      onChange={(v) => handleSnippetCodeChange(block.localId, v)}
                      language={block.language}
                      onLanguageChange={(l) => updateBlock(block.localId, { language: l, manual: true })}
                      expanded={expandedId === block.localId}
                      onToggleExpand={() => setExpandedId((cur) => cur === block.localId ? null : block.localId)}
                    />
                  )}

                  {/* Project picker */}
                  {block.type === 'project' && (
                    block.project ? (
                      <div className="rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-card/60">
                          <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="text-sm font-medium text-white truncate flex-1">{block.project.title}</span>
                          <div className="flex items-center gap-1">
                            {block.project.files.map((f) => (
                              <span key={f.id} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised font-mono" style={{ color: LANGUAGE_COLORS[f.language] ?? '#8b9ab5' }}>
                                {f.name}
                              </span>
                            ))}
                            <button onClick={() => updateBlock(block.localId, { project: null })} className="ml-1 p-1 rounded hover:bg-surface-raised text-gray-500 hover:text-gray-300 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="relative" ref={pickerBlockId === block.localId ? pickerRef : undefined}>
                        <button
                          type="button"
                          onClick={() => {
                            setPickerBlockId(block.localId)
                            loadPickerProjects()
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-surface-border text-sm text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
                        >
                          <FolderOpen className="w-4 h-4" />
                          Proje Seç
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {pickerBlockId === block.localId && (
                          <div className="absolute top-full mt-1 left-0 right-0 z-20 card shadow-2xl py-1 max-h-52 overflow-y-auto">
                            {pickerLoading ? (
                              <div className="flex justify-center py-5"><Spinner /></div>
                            ) : pickerProjects.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-5">Kayıtlı proje yok</p>
                            ) : (
                              pickerProjects.map((p) => (
                                <button
                                  key={p.id}
                                  type="button"
                                  onClick={() => { updateBlock(block.localId, { project: p }); setPickerBlockId(null) }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-raised transition-colors"
                                >
                                  <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
                                  <span className="text-white flex-1 truncate">{p.title}</span>
                                  <span className="text-xs text-gray-500">{p.files.length} dosya</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Article picker */}
                  {block.type === 'article' && (
                    block.articleId ? (
                      <div className="rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-card/60">
                          <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                          <span className="text-sm font-medium text-white truncate flex-1">{block.articleTitle}</span>
                          <button
                            onClick={() => updateBlock(block.localId, { articleId: null, articleTitle: '', coverImage: null, content: '' } as Partial<ComposerBlock>)}
                            className="ml-1 p-1 rounded hover:bg-surface-raised text-gray-500 hover:text-gray-300 transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        {block.content && (
                          <p className="px-3 py-2 text-xs text-gray-500 line-clamp-3 whitespace-pre-wrap">{block.content}</p>
                        )}
                      </div>
                    ) : (
                      <div className="relative" ref={articlePickerBlockId === block.localId ? articlePickerRef : undefined}>
                        <button
                          type="button"
                          onClick={() => {
                            setArticlePickerBlockId(block.localId)
                            loadPickerArticles()
                          }}
                          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg border border-dashed border-surface-border text-sm text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
                        >
                          <FileText className="w-4 h-4" />
                          Makale Seç
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        {articlePickerBlockId === block.localId && (
                          <div className="absolute top-full mt-1 left-0 right-0 z-20 card shadow-2xl py-1 max-h-52 overflow-y-auto">
                            {articlePickerLoading ? (
                              <div className="flex justify-center py-5"><Spinner /></div>
                            ) : pickerArticles.length === 0 ? (
                              <p className="text-sm text-gray-500 text-center py-5">Kayıtlı makale yok</p>
                            ) : (
                              pickerArticles.map((a) => (
                                <button
                                  key={a.id}
                                  type="button"
                                  onClick={() => {
                                    updateBlock(block.localId, {
                                      articleId: a.id,
                                      articleTitle: a.title,
                                      coverImage: a.coverImage,
                                      content: extractArticleContent(a),
                                    } as Partial<ComposerBlock>)
                                    setArticlePickerBlockId(null)
                                  }}
                                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-raised transition-colors"
                                >
                                  <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                                  <span className="text-white flex-1 truncate">{a.title}</span>
                                  <span className="text-xs text-gray-500">{articleWordCount(a)} kelime</span>
                                </button>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  {/* Image */}
                  {block.type === 'image' && (
                    <Input
                      value={block.url}
                      onChange={(e) => updateBlock(block.localId, { url: e.target.value })}
                      placeholder="Görsel URL (https://...)"
                    />
                  )}

                  {/* Link */}
                  {block.type === 'link' && (
                    <div className="flex flex-col gap-2">
                      <Input value={block.url} onChange={(e) => updateBlock(block.localId, { url: e.target.value })} placeholder="URL (https://...)" />
                      <Input value={block.title} onChange={(e) => updateBlock(block.localId, { title: e.target.value })} placeholder="Başlık (opsiyonel)" />
                    </div>
                  )}

                  {/* Video */}
                  {block.type === 'video' && (
                    <Input
                      value={block.url}
                      onChange={(e) => updateBlock(block.localId, { url: e.target.value })}
                      placeholder="Video URL (YouTube, vb.)"
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add block button */}
          <div className="relative" ref={addMenuRef}>
            <button
              type="button"
              onClick={() => setAddMenuOpen((v) => !v)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-surface-border text-sm text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Blok Ekle
            </button>
            {addMenuOpen && (
              <div className="absolute top-full mt-1 left-0 right-0 z-20 card shadow-2xl py-1">
                {BLOCK_OPTIONS.map((opt) => (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => addBlock(opt.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-raised transition-colors text-gray-300 hover:text-white"
                  >
                    <span className="text-brand-400">{opt.icon}</span>
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
        )} {/* end composerMode === 'edit' */}

        {composerMode === 'preview' && (() => {
          const previewTitle = description.trim().split('\n')[0].slice(0, 100) || 'Gönderi'
          const previewBlocks = composerBlocksToPostBlocks(blocks)
          const hasContent = description.trim() || tags.length > 0 || previewBlocks.length > 0
          return (
            <div className="flex flex-col gap-4 flex-1">
              {hasContent ? (
                <>
                  <h2 className="text-xl font-bold text-white leading-snug">{previewTitle}</h2>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 -mt-2">
                      {tags.map((tag) => (
                        <span key={tag} className="tag">#{tag}</span>
                      ))}
                    </div>
                  )}
                  {description.trim() && (
                    <p className="text-sm text-gray-400 whitespace-pre-wrap leading-relaxed">{description.trim()}</p>
                  )}
                  {previewBlocks.length > 0 && (
                    <BlockView blocks={previewBlocks} postTitle={previewTitle} />
                  )}
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 text-gray-600 py-16">
                  <Eye className="w-8 h-8" />
                  <p className="text-sm">Önizlenecek içerik yok</p>
                </div>
              )}
            </div>
          )
        })()}

        {/* Sticky footer */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-surface-border bg-surface-card flex-wrap">
          {isAuthenticated && (
            <Button variant="ghost" size="sm" className="text-gray-500" onClick={handleCloudSave} loading={cloudSaving}>
              <UploadCloud className="w-4 h-4" />
              {cloudDraftId ? 'Taslağı Güncelle' : 'Taslak Kaydet'}
            </Button>
          )}
          <div className="flex justify-end gap-2 ml-auto">
            <Button variant="ghost" onClick={handleClose}>İptal</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading}>Paylaş</Button>
          </div>
        </div>
      </Modal>

      {/* Cloud Drafts Modal — rendered after main modal so it appears on top (same z-index, later in DOM wins) */}
      <Modal open={draftsOpen} onClose={() => setDraftsOpen(false)} title="Bulut Taslaklar" size="fullscreen">
        <div className="flex flex-col gap-3">
          {draftsLoading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : cloudDrafts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Cloud className="w-8 h-8 mx-auto mb-2 text-gray-600" />
              <p className="text-sm">Kayıtlı taslak yok</p>
            </div>
          ) : (
            cloudDrafts.map((draft) => (
              <button
                key={draft.id}
                onClick={() => handleRestoreDraft(draft)}
                className="w-full text-left card p-3 hover:border-brand-500/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white font-medium truncate">
                      {draft.description?.split('\n')[0]?.slice(0, 60) || 'Başlıksız taslak'}
                    </p>
                    {draft.tags && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{draft.tags}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(draft.updatedAt)}
                      {(draft.blocks as unknown[]).length > 0 && (
                        <span className="ml-1">· {(draft.blocks as unknown[]).length} blok</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDeleteDraft(draft.id, e)}
                    className="shrink-0 p-1.5 rounded text-gray-500 hover:text-red-400 transition-colors"
                    title="Taslağı sil"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {cloudDraftId === draft.id && (
                  <span className="text-[10px] text-brand-400 mt-1 block">Şu an düzenleniyor</span>
                )}
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
