import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Image, Link2, Maximize2, X, FolderOpen, Plus, ChevronDown } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Spinner from '@components/ui/Spinner'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useEditorStore } from '@store/editorStore'
import { useComposerStore } from '@store/composerStore'
import { projectService, type SavedProject } from '@services/projectService'
import { POST_TYPES } from '@utils/constants'
import { LANGUAGE_COLORS } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostType } from '@/types'

const DRAFT_KEY = 'kodeshare:composer-draft'
const DEFAULT_LANG: SnippetLang = 'javascript'

const EXT_MAP: Record<SnippetLang, string> = {
  javascript: 'js',
  css:        'css',
  html:       'html',
}

const TAG_TO_LANG: Record<string, SnippetLang> = {
  js: 'javascript', javascript: 'javascript', node: 'javascript',
  jsx: 'javascript', ts: 'javascript', typescript: 'javascript',
  react: 'javascript', vue: 'javascript',
  css: 'css', sass: 'css', scss: 'css', tailwind: 'css',
  html: 'html',
}

interface Draft {
  postType: PostType
  title: string
  description: string
  tags: string
  code: string
  language: SnippetLang
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
function detectLangFromTags(tags: string): SnippetLang | null {
  const parts = tags.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean)
  for (const p of parts) if (TAG_TO_LANG[p]) return TAG_TO_LANG[p]
  return null
}

function buildProjectSrcdoc(files: { language: string; content: string }[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? ''
  const css  = files.filter((f) => f.language === 'css').map((f) => f.content).join('\n')
  const js   = files.filter((f) => f.language === 'javascript' || f.language === 'typescript').map((f) => f.content).join('\n')
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

interface PostComposerProps {
  hideCard?: boolean
}

export default function PostComposer({ hideCard = false }: PostComposerProps) {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createPost } = usePostStore()
  const { setProjectTitle } = useEditorStore()
  const { open, prefilledProject, openComposer, closeComposer } = useComposerStore()

  const [postType, setPostType]   = useState<PostType>('snippet')
  const [title, setTitle]         = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags]           = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [liveDemoUrl, setLiveDemoUrl]         = useState('')
  const [showImageInput, setShowImageInput]   = useState(false)
  const [showDemoInput, setShowDemoInput]     = useState(false)
  const [loading, setLoading]     = useState(false)

  // Snippet
  const [code, setCode]               = useState('')
  const [language, setLanguage]       = useState<SnippetLang>(DEFAULT_LANG)
  const [langManual, setLangManual]   = useState(false)
  const [expanded, setExpanded]       = useState(false)

  // Project picker
  const [selectedProject, setSelectedProject]   = useState<SavedProject | null>(null)
  const [pickerOpen, setPickerOpen]             = useState(false)
  const [pickerProjects, setPickerProjects]     = useState<SavedProject[]>([])
  const [pickerLoading, setPickerLoading]       = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const hydratedRef = useRef(false)

  // Restore draft
  useEffect(() => {
    if (!open || hydratedRef.current) return
    hydratedRef.current = true
    // If prefilled project, prioritize it over draft
    if (prefilledProject) {
      setPostType('project')
      setTitle(prefilledProject.title)
      setSelectedProject(prefilledProject)
      return
    }
    const d = loadDraft()
    if (!d) return
    if (d.postType) setPostType(d.postType)
    if (d.title)       setTitle(d.title)
    if (d.description) setDescription(d.description)
    if (d.tags)        setTags(d.tags)
    if (d.code)        setCode(d.code)
    if (d.language)  { setLanguage(d.language); setLangManual(true) }
  }, [open, prefilledProject])

  // Re-apply prefilled project when it changes while open
  useEffect(() => {
    if (!open || !prefilledProject) return
    setPostType('project')
    setTitle(prefilledProject.title)
    setSelectedProject(prefilledProject)
  }, [prefilledProject, open])

  // Auto-save draft
  useEffect(() => {
    if (!open) return
    const hasContent = title || description || tags || code
    if (!hasContent) return
    saveDraft({ postType, title, description, tags, code, language })
  }, [open, postType, title, description, tags, code, language])

  // Auto-detect language from tags
  useEffect(() => {
    if (langManual) return
    const detected = detectLangFromTags(tags)
    if (detected && detected !== language) setLanguage(detected)
  }, [tags, langManual, language])

  // ESC closes expanded snippet editor first
  useEffect(() => {
    if (!expanded) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExpanded(false) } }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [expanded])

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    const h = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerOpen])

  const loadPickerProjects = useCallback(async () => {
    setPickerLoading(true)
    try {
      const list = await projectService.list()
      setPickerProjects(list)
    } catch {
      toast.error('Projeler yüklenemedi')
    } finally {
      setPickerLoading(false)
    }
  }, [])

  const handleLanguageChange = (lang: SnippetLang) => { setLanguage(lang); setLangManual(true) }

  const reset = () => {
    setTitle(''); setDescription(''); setTags('')
    setPreviewImageUrl(''); setLiveDemoUrl('')
    setShowImageInput(false); setShowDemoInput(false)
    setPostType('snippet'); setCode('')
    setLanguage(DEFAULT_LANG); setLangManual(false)
    setExpanded(false); setSelectedProject(null)
    setPickerOpen(false)
    hydratedRef.current = false
  }

  const handleClose = () => { closeComposer(); setExpanded(false); hydratedRef.current = false }

  const handleOpenInEditor = () => {
    if (postType === 'snippet') { setExpanded((v) => !v); return }
    setProjectTitle(title.trim() || 'Yeni Proje')
    closeComposer(); reset(); clearDraft()
    navigate('/editor')
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    if (postType === 'project' && !selectedProject) { toast.error('Bir proje seçmelisin'); return }
    setLoading(true)
    try {
      let files: import('@/types').CreatePostPayload['files'] = []
      if (postType === 'snippet' && code.trim()) {
        files = [{ name: `snippet.${EXT_MAP[language]}`, language, content: code, order: 0 }]
      } else if (postType === 'project' && selectedProject) {
        files = selectedProject.files.map((f, i) => ({ name: f.name, language: f.language, content: f.content, order: i }))
      }
      await createPost({
        type: postType,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        files,
        previewImageUrl: previewImageUrl.trim() || undefined,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
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
    <div
      className="card p-4 flex items-center gap-3 cursor-pointer hover:border-surface-raised transition-colors"
      onClick={openComposer}
    >
      <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" />
      <span className="flex-1 text-sm text-gray-500 bg-surface-raised rounded-lg px-4 py-2 hover:bg-surface-border transition-colors">
        Ne paylaşmak istiyorsun?
      </span>
      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); openComposer() }}>
        <Code2 className="w-4 h-4" />
        Kod Paylaş
      </Button>
    </div>
  )

  return (
    <>
      {triggerCard}

      <Modal open={open} onClose={handleClose} title="Yeni Gönderi" size="lg">
        <div className="flex flex-col gap-4">
          {/* Type selector */}
          <div className="flex gap-2">
            {POST_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPostType(t.id as PostType)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  postType === t.id
                    ? 'border-brand-500 bg-brand-900/20 text-brand-300'
                    : 'border-surface-border text-gray-500 hover:border-surface-raised hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Input
            label="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Projenin adı..."
          />

          <Textarea
            label={postType === 'article' ? 'İçerik' : 'Açıklama'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={postType === 'article' ? 'Makale içeriğini yaz...' : 'Ne yaptığını anlat...'}
            rows={postType === 'article' ? 6 : 3}
          />

          {/* Snippet editor */}
          {postType === 'snippet' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Kod</label>
              <SnippetCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={handleLanguageChange}
                expanded={expanded}
                onToggleExpand={() => setExpanded((v) => !v)}
              />
              <p className="text-[11px] text-gray-600">Tab ile girinti, Ctrl/Cmd+Z ile geri al. Taslağın otomatik kaydedilir.</p>
            </div>
          )}

          {/* Project picker */}
          {postType === 'project' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Proje</label>

              {selectedProject ? (
                /* Selected project card */
                <div className="rounded-xl border border-surface-border bg-[#0d1117] overflow-hidden">
                  {/* Header: folder icon + name + file badges + remove */}
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-surface-border bg-surface-card/60">
                    <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="text-sm font-medium text-white truncate flex-1">{selectedProject.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {selectedProject.files.map((f) => (
                        <span
                          key={f.id}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-surface-raised font-mono"
                          style={{ color: LANGUAGE_COLORS[f.language] ?? '#8b9ab5' }}
                        >
                          {f.name}
                        </span>
                      ))}
                      <button
                        onClick={() => setSelectedProject(null)}
                        className="ml-1 p-1 rounded hover:bg-surface-raised text-gray-500 hover:text-gray-300 transition-colors"
                        title="Projeyi kaldır"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Live preview */}
                  <div className="h-48 bg-white">
                    <iframe
                      srcDoc={buildProjectSrcdoc(selectedProject.files)}
                      sandbox="allow-scripts allow-same-origin"
                      className="w-full h-full border-0"
                      title="Proje önizleme"
                    />
                  </div>
                </div>
              ) : (
                /* Project picker button + dropdown */
                <div className="relative" ref={pickerRef}>
                  <button
                    type="button"
                    onClick={() => { setPickerOpen((v) => !v); if (!pickerOpen) loadPickerProjects() }}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-surface-border text-sm text-gray-500 hover:border-brand-500 hover:text-brand-400 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Proje Ekle
                    <ChevronDown className="w-3.5 h-3.5 ml-auto mr-1" />
                  </button>
                  {pickerOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 z-20 card shadow-2xl py-1 max-h-52 overflow-y-auto">
                      {pickerLoading ? (
                        <div className="flex justify-center py-5"><Spinner /></div>
                      ) : pickerProjects.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-5">Kayıtlı proje bulunamadı</p>
                      ) : (
                        pickerProjects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => { setSelectedProject(p); setPickerOpen(false) }}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left hover:bg-surface-raised transition-colors"
                          >
                            <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
                            <span className="text-white flex-1 truncate">{p.title}</span>
                            <span className="text-xs text-gray-500 shrink-0">{p.files.length} dosya</span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <Input
            label="Etiketler"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, css, animation (virgülle ayır)"
          />

          {showImageInput && (
            <div className="flex items-center gap-2">
              <Input label="Görsel URL" value={previewImageUrl} onChange={(e) => setPreviewImageUrl(e.target.value)} placeholder="https://..." className="flex-1" />
              <button onClick={() => { setShowImageInput(false); setPreviewImageUrl('') }} className="mt-6 p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          )}
          {showDemoInput && (
            <div className="flex items-center gap-2">
              <Input label="Demo URL" value={liveDemoUrl} onChange={(e) => setLiveDemoUrl(e.target.value)} placeholder="https://..." className="flex-1" />
              <button onClick={() => { setShowDemoInput(false); setLiveDemoUrl('') }} className="mt-6 p-1.5 text-gray-500 hover:text-gray-300 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost" size="sm"
              className={postType === 'snippet' && expanded ? 'text-brand-400' : 'text-gray-500'}
              onClick={handleOpenInEditor}
            >
              {postType === 'snippet' ? <Maximize2 className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              {postType === 'snippet' ? (expanded ? 'Küçült' : 'Editörde Aç') : 'Editörde Aç'}
            </Button>
            <Button variant="ghost" size="sm" className={showImageInput ? 'text-brand-400' : 'text-gray-500'} onClick={() => setShowImageInput((v) => !v)}>
              <Image className="w-4 h-4" />Görsel
            </Button>
            <Button variant="ghost" size="sm" className={showDemoInput ? 'text-brand-400' : 'text-gray-500'} onClick={() => setShowDemoInput((v) => !v)}>
              <Link2 className="w-4 h-4" />Demo URL
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={handleClose}>İptal</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!title.trim()}>Paylaş</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
