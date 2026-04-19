import { useCallback, useEffect, useRef, useState } from 'react'
import { Code2, Image, Link2, Video, FileText, FolderOpen, Plus, ChevronDown, X, Trash2, Pencil } from 'lucide-react'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Spinner from '@components/ui/Spinner'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { projectService, type SavedProject } from '@services/projectService'
import { postService } from '@services/postService'
import { LANGUAGE_COLORS } from '@utils/constants'
import toast from 'react-hot-toast'
import type { Post, PostBlock, PostBlockType, EditorFile, EditorLanguage } from '@/types'

const VALID_LANGS: SnippetLang[] = ['javascript', 'css', 'html']
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
  return VALID_LANGS.includes(lang as SnippetLang) ? (lang as SnippetLang) : DEFAULT_LANG
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

function postBlockToComposer(b: PostBlock): ComposerBlock {
  switch (b.type) {
    case 'snippet':
      return { localId: b.id, type: 'snippet', code: (b.data.content as string) ?? '', language: toSnippetLang((b.data.language as string) ?? DEFAULT_LANG), manual: true }
    case 'project':
      return {
        localId: b.id,
        type: 'project',
        project: {
          id: b.id,
          title: 'Proje',
          files: ((b.data.files as any[]) ?? []).map((f, i): EditorFile => ({ id: String(i), name: f.name as string, language: f.language as EditorLanguage, content: f.content as string, isModified: false })),
          updatedAt: '',
        },
      }
    case 'image':   return { localId: b.id, type: 'image',   url: (b.data.url as string) ?? '' }
    case 'link':    return { localId: b.id, type: 'link',    url: (b.data.url as string) ?? '', title: (b.data.title as string) ?? '' }
    case 'video':   return { localId: b.id, type: 'video',   url: (b.data.url as string) ?? '' }
    case 'article': return { localId: b.id, type: 'article', content: (b.data.content as string) ?? '' }
    default:        return { localId: b.id, type: 'snippet', code: '', language: DEFAULT_LANG, manual: false }
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

interface EditPostModalProps {
  open: boolean
  onClose: () => void
  post: Post
  onSaved: (updated: { title: string; description: string | null; tags: string[]; blocks: PostBlock[] }) => void
}

export default function EditPostModal({ open, onClose, post, onSaved }: EditPostModalProps) {
  const [title, setTitle]             = useState(post.title)
  const [description, setDescription] = useState(post.description ?? '')
  const [tagsInput, setTagsInput]     = useState(post.tags.join(', '))
  const [blocks, setBlocks]           = useState<ComposerBlock[]>(() => post.blocks.map(postBlockToComposer))
  const [loading, setLoading]         = useState(false)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)

  const addMenuRef = useRef<HTMLDivElement>(null)

  const [pickerBlockId, setPickerBlockId]   = useState<string | null>(null)
  const [pickerProjects, setPickerProjects] = useState<SavedProject[]>([])
  const [pickerLoading, setPickerLoading]   = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    setTitle(post.title)
    setDescription(post.description ?? '')
    setTagsInput(post.tags.join(', '))
    setBlocks(post.blocks.map(postBlockToComposer))
    setExpandedId(null)
    setPickerBlockId(null)
    setAddMenuOpen(false)
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!expandedId) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExpandedId(null) } }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [expandedId])

  useEffect(() => {
    if (!addMenuOpen) return
    const h = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [addMenuOpen])

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

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Başlık boş olamaz'); return }
    setLoading(true)
    try {
      const tags = tagsInput.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean)

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

      await postService.editPost(post.id, {
        title:       title.trim(),
        description: description.trim() || undefined,
        tags,
        blocks:      validBlocks as PostBlock[],
      })

      const updatedBlocks: PostBlock[] = validBlocks.map((b, i) => ({
        id:       newId(),
        type:     b.type,
        position: i,
        data:     b.data,
      }))

      onSaved({ title: title.trim(), description: description.trim() || null, tags, blocks: updatedBlocks })
      toast.success('Gönderi güncellendi')
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Gönderiyi Düzenle" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gönderi başlığı"
        />
        <Textarea
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kısa açıklama..."
          rows={2}
        />
        <Input
          label="Etiketler"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="javascript, react, css  (virgülle ayır)"
        />

        {/* Block list */}
        {blocks.length > 0 && (
          <div className="flex flex-col gap-3">
            {blocks.map((block) => (
              <div key={block.localId} className="rounded-xl border border-surface-border p-3 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                    {BLOCK_OPTIONS.find((o) => o.type === block.type)?.label}
                  </span>
                  <button type="button" onClick={() => removeBlock(block.localId)} className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

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

                {block.type === 'article' && (
                  <Textarea
                    value={block.content}
                    onChange={(e) => updateBlock(block.localId, { content: e.target.value })}
                    placeholder="Makale içeriğini yaz..."
                    rows={5}
                  />
                )}

                {block.type === 'image' && (
                  <Input
                    value={block.url}
                    onChange={(e) => updateBlock(block.localId, { url: e.target.value })}
                    placeholder="Görsel URL (https://...)"
                  />
                )}

                {block.type === 'link' && (
                  <div className="flex flex-col gap-2">
                    <Input value={block.url} onChange={(e) => updateBlock(block.localId, { url: e.target.value })} placeholder="URL (https://...)" />
                    <Input value={block.title} onChange={(e) => updateBlock(block.localId, { title: e.target.value })} placeholder="Başlık (opsiyonel)" />
                  </div>
                )}

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

        <div className="flex justify-end gap-2 pt-1 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>
            <Pencil className="w-3.5 h-3.5" />
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  )
}
