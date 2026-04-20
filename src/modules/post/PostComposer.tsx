import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Image, Link2, Video, FileText, FolderOpen, Plus, ChevronDown, X, Trash2 } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Spinner from '@components/ui/Spinner'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useComposerStore } from '@store/composerStore'
import { projectService, type SavedProject } from '@services/projectService'
import { LANGUAGE_COLORS } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostBlockType } from '@/types'

const DRAFT_KEY = 'kodeshare:composer-draft-v2'
const DEFAULT_LANG: SnippetLang = 'javascript'

const EXT_MAP: Record<SnippetLang, string> = {
  javascript: 'js',
  css: 'css',
  html: 'html',
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10)
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
  | { localId: string; type: 'article'; content: string }

interface Draft {
  title: string
  description: string
  tags: string
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

function makeBlock(type: PostBlockType): ComposerBlock {
  switch (type) {
    case 'snippet': return { localId: newId(), type: 'snippet', code: '', language: DEFAULT_LANG, manual: false }
    case 'project': return { localId: newId(), type: 'project', project: null }
    case 'image':   return { localId: newId(), type: 'image',   url: '' }
    case 'link':    return { localId: newId(), type: 'link',    url: '', title: '' }
    case 'video':   return { localId: newId(), type: 'video',   url: '' }
    case 'article': return { localId: newId(), type: 'article', content: '' }
  }
}

function blockToPayload(b: ComposerBlock, position: number) {
  switch (b.type) {
    case 'snippet': return { type: 'snippet' as const, position, data: { language: b.language, content: b.code, name: `snippet.${EXT_MAP[b.language]}` } }
    case 'project': return { type: 'project' as const, position, data: { files: b.project?.files?.map(f => ({ name: f.name, language: f.language, content: f.content })) ?? [] } }
    case 'image':   return { type: 'image'   as const, position, data: { url: b.url } }
    case 'link':    return { type: 'link'    as const, position, data: { url: b.url, title: b.title } }
    case 'video':   return { type: 'video'   as const, position, data: { url: b.url } }
    case 'article': return { type: 'article' as const, position, data: { content: b.content } }
  }
}

interface PostComposerProps {
  hideCard?: boolean
}

export default function PostComposer({ hideCard = false }: PostComposerProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createPost } = usePostStore()
  const { open, prefilledProject, openComposer, closeComposer } = useComposerStore()

  const [title, setTitle]             = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags]               = useState('')
  const [blocks, setBlocks]           = useState<ComposerBlock[]>([])
  const [loading, setLoading]         = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const addMenuRef  = useRef<HTMLDivElement>(null)
  const hydratedRef = useRef(false)

  // Project picker state (per project block)
  const [pickerBlockId, setPickerBlockId]       = useState<string | null>(null)
  const [pickerProjects, setPickerProjects]     = useState<SavedProject[]>([])
  const [pickerLoading, setPickerLoading]       = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  // Restore draft / prefilled project
  useEffect(() => {
    if (!open || hydratedRef.current) return
    hydratedRef.current = true
    if (prefilledProject) {
      const b: ComposerBlock = { localId: newId(), type: 'project', project: prefilledProject }
      setBlocks([b])
      setTitle(prefilledProject.title)
      return
    }
    const d = loadDraft()
    if (!d) return
    if (d.title)       setTitle(d.title)
    if (d.description) setDescription(d.description)
    if (d.tags)        setTags(d.tags)
    if (d.blocks?.length) setBlocks(d.blocks)
  }, [open, prefilledProject])

  useEffect(() => {
    if (!open || !prefilledProject) return
    const b: ComposerBlock = { localId: newId(), type: 'project', project: prefilledProject }
    setBlocks([b])
    setTitle(prefilledProject.title)
  }, [prefilledProject, open])

  // Auto-save draft
  useEffect(() => {
    if (!open) return
    const hasContent = title || description || tags || blocks.length > 0
    if (!hasContent) return
    saveDraft({ title, description, tags, blocks })
  }, [open, title, description, tags, blocks])

  // ESC closes expanded editor
  useEffect(() => {
    if (!expandedId) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExpandedId(null) } }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [expandedId])

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

  const addBlock = (type: PostBlockType) => {
    setBlocks((bs) => [...bs, makeBlock(type)])
    setAddMenuOpen(false)
  }

  const removeBlock = (localId: string) => {
    setBlocks((bs) => bs.filter((b) => b.localId !== localId))
    if (expandedId === localId) setExpandedId(null)
    if (pickerBlockId === localId) setPickerBlockId(null)
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

  const reset = () => {
    setTitle(''); setDescription(''); setTags(''); setBlocks([])
    setExpandedId(null); setPickerBlockId(null); setAddMenuOpen(false)
    hydratedRef.current = false
  }

  const handleClose = () => { closeComposer(); reset() }

  const handleOpenInEditor = () => {
    navigate('/editor')
    closeComposer(); reset(); clearDraft()
  }

  const handleSubmit = async () => {
    const t = title.trim()
    if (!t) { toast.error('Başlık gerekli'); return }
    setLoading(true)
    try {
      const validBlocks = blocks
        .filter((b) => {
          if (b.type === 'snippet')  return b.code.trim()
          if (b.type === 'project')  return !!b.project
          if (b.type === 'image')    return b.url.trim()
          if (b.type === 'link')     return b.url.trim()
          if (b.type === 'video')    return b.url.trim()
          if (b.type === 'article')  return b.content.trim()
          return false
        })
        .map((b, i) => blockToPayload(b, i))

      await createPost({
        type: 'post',
        title: t,
        description: description.trim() || undefined,
        tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
        blocks: validBlocks,
      })
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

      <Modal open={open} onClose={handleClose} title="Yeni Gönderi" size="lg">
        <div className="flex flex-col gap-4">
          <Input
            label="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Gönderi başlığı... (Boş bırakılamaz)"
          />
          <Textarea
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ne hakkında?"
            rows={2}
          />
          <Input
            label="Etiketler"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, css, animation (virgülle ayır)"
          />

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

                  {/* Article */}
                  {block.type === 'article' && (
                    <Textarea
                      value={block.content}
                      onChange={(e) => updateBlock(block.localId, { content: e.target.value })}
                      placeholder="Makale içeriğini yaz..."
                      rows={5}
                    />
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

          <div className="flex items-center gap-2 pt-1">
            <Button variant="ghost" size="sm" className="text-gray-500" onClick={handleOpenInEditor}>
              <Code2 className="w-4 h-4" />
              Editörde Aç
            </Button>
            <div className="flex justify-end gap-2 ml-auto">
              <Button variant="ghost" onClick={handleClose}>İptal</Button>
              <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!title.trim()}>Paylaş</Button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
}
