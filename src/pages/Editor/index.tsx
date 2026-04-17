import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Files, Code2, Eye, WrapText, Sun, Moon, Plus, Trash2, X, RefreshCw, ExternalLink, Monitor, Tablet, Smartphone, Cloud, Loader2, Save } from 'lucide-react'
import { useEditor } from '@editor/hooks/useEditor'
import { useAutoSave } from '@editor/hooks/useAutoSave'
import { useEditorStore } from '@store/editorStore'
import { useAuthStore } from '@store/authStore'
import { postService } from '@services/postService'
import { languageFromFilename, defaultContentForLanguage } from '@editor/utils/languageUtils'
import { LANGUAGE_COLORS } from '@utils/constants'
import EditorPane from '@editor/components/EditorPane'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'
import type { EditorLanguage, EditorTheme } from '@/types'
import '@/styles/editor.css'

// ─── Panel toggle button ───────────────────────────────────────────────────

function PanelBtn({ active, onClick, icon: Icon, label }: {
  active: boolean; onClick: () => void; icon: React.ElementType; label: string
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all select-none',
        active
          ? 'bg-[#1e2a3a] text-[#8aa8ff] border border-[#2a3a56]'
          : 'text-gray-500 hover:text-gray-300 border border-transparent',
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}

// ─── File tree ─────────────────────────────────────────────────────────────

function FileTree({ files, activeFileId, onSelect, onAdd, onDelete }: {
  files: ReturnType<typeof useEditor>['files']
  activeFileId: string | null
  onSelect: (id: string) => void
  onAdd: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', borderRight: '1px solid #1e2535' }}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[#1e2535]">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Dosyalar</span>
        <button onClick={onAdd} title="Yeni dosya" className="p-1 rounded hover:bg-[#1e2535] text-gray-500 hover:text-gray-300 transition-colors">
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {files.map((file) => {
          const color = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
          const ext = file.name.split('.').pop() ?? ''
          return (
            <div
              key={file.id}
              onClick={() => onSelect(file.id)}
              className={cn(
                'group flex items-center justify-between gap-2 px-3 py-1.5 cursor-pointer transition-colors',
                file.id === activeFileId
                  ? 'bg-[#1e2a4a] text-[#8aa8ff]'
                  : 'text-[#8b9ab5] hover:bg-[#1e2535] hover:text-[#e2e8f0]',
              )}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[9px] font-bold shrink-0" style={{ color }}>{ext.toUpperCase()}</span>
                <span className="truncate text-[13px] font-mono">{file.name}</span>
                {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(file.id) }}
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400 transition-all shrink-0"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          )
        })}
        {files.length === 0 && (
          <p className="px-3 py-4 text-[12px] text-gray-600 text-center">+ ile dosya ekle</p>
        )}
      </div>
    </div>
  )
}

// ─── File tabs ─────────────────────────────────────────────────────────────

function FileTabs({ files, activeFileId, onSelect, onClose }: {
  files: ReturnType<typeof useEditor>['files']
  activeFileId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
}) {
  return (
    <div className="flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-none shrink-0" style={{ height: 34, background: '#0d1117', borderBottom: '1px solid #1e2535' }}>
      {files.map((file) => {
        const color = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
        const ext = file.name.split('.').pop() ?? ''
        const isActive = file.id === activeFileId
        return (
          <div
            key={file.id}
            onClick={() => onSelect(file.id)}
            className={cn(
              'group flex items-center gap-1.5 px-3 h-[26px] rounded cursor-pointer whitespace-nowrap transition-all text-[12px] font-mono',
              isActive
                ? 'bg-[#1e2535] text-[#e2e8f0] border border-[#2a3347]'
                : 'text-[#6b7a99] hover:bg-[#161e2d] hover:text-[#c0cce0] border border-transparent',
            )}
          >
            <span className="text-[9px] font-bold" style={{ color }}>{ext.toUpperCase()}</span>
            <span>{file.name}</span>
            {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            <button
              onClick={(e) => { e.stopPropagation(); onClose(file.id) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-[#2a3347] text-gray-600 hover:text-gray-300 transition-all -mr-1"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── Preview ───────────────────────────────────────────────────────────────

const VIEWPORTS = [
  { id: 'desktop', icon: Monitor, label: 'Masaüstü', width: '100%' },
  { id: 'tablet',  icon: Tablet,  label: 'Tablet',   width: '768px' },
  { id: 'mobile',  icon: Smartphone, label: 'Mobil', width: '375px' },
] as const

function buildPreviewDoc(files: ReturnType<typeof useEditor>['files']) {
  const htmlFile = files.find((f) => f.language === 'html')
  const cssFiles = files.filter((f) => f.language === 'css')
  const jsFiles  = files.filter((f) => f.language === 'javascript' || f.language === 'typescript')
  const base = htmlFile?.content ?? '<!DOCTYPE html><html><body></body></html>'
  const style = cssFiles.map((f) => f.content).join('\n')
  const script = jsFiles.map((f) => f.content).join('\n')
  return base
    .replace('</head>', `<style>${style}</style></head>`)
    .replace('</body>', `<script>${script}</script></body>`)
}

function PreviewPanel({ files }: { files: ReturnType<typeof useEditor>['files'] }) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [src, setSrc] = useState('')
  const [key, setKey] = useState(0)

  useEffect(() => {
    const doc = buildPreviewDoc(files)
    setSrc(`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`)
  }, [files])

  const vp = VIEWPORTS.find((v) => v.id === viewport)!

  return (
    <div className="flex flex-col h-full" style={{ background: '#0d1117', borderLeft: '1px solid #1e2535' }}>
      <div className="flex items-center gap-1 px-3 shrink-0" style={{ height: 34, borderBottom: '1px solid #1e2535' }}>
        <div className="flex items-center gap-0.5 bg-[#161e2d] rounded-md p-0.5">
          {VIEWPORTS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              title={label}
              className={cn(
                'p-1 rounded transition-colors',
                viewport === id ? 'bg-[#2a3347] text-white' : 'text-gray-600 hover:text-gray-300',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setKey((k) => k + 1)} title="Yenile" className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-[#1e2535] transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => window.open(src, '_blank')} title="Yeni sekmede aç" className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-[#1e2535] transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-[#1a1a2e]">
        <div
          className="h-full transition-all duration-300 bg-white"
          style={{ width: vp.width, maxWidth: '100%' }}
        >
          <iframe key={key} src={src} className="w-full h-full border-none" sandbox="allow-scripts allow-same-origin" />
        </div>
      </div>
    </div>
  )
}

// ─── Main Editor Page ──────────────────────────────────────────────────────

export default function EditorPage() {
  const { projectId } = useParams<{ projectId?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { files, activeFile, activeFileId, theme, wordWrap, setActiveFile, addFile, removeFile, updateActiveFile, toggleWordWrap, setTheme } = useEditor()
  const { projectTitle, markAllSaved, loadProject } = useEditorStore()

  const [showFiles,   setShowFiles]   = useState(true)
  const [showPreview, setShowPreview] = useState(true)
  const [isSaving,    setIsSaving]    = useState(false)
  const [savedId,     setSavedId]     = useState<string | null>(projectId ?? null)
  // Mobile panel: 'files' | 'editor' | 'preview'
  const [mobilePanel, setMobilePanel] = useState<'files' | 'editor' | 'preview'>('editor')

  useEffect(() => {
    if (!projectId) return
    postService.getPost(projectId).then((post) => {
      loadProject(post.title, post.files.map((f) => ({
        id: f.id, name: f.name,
        language: f.language as EditorLanguage,
        content: f.content, isModified: false,
      })))
      setSavedId(post.id)
    }).catch(() => toast.error('Proje yüklenemedi'))
  }, [projectId]) // eslint-disable-line

  const saveProject = useCallback(async () => {
    if (!isAuthenticated) return
    setIsSaving(true)
    try {
      const payload = {
        type: 'snippet' as const,
        title: projectTitle || 'İsimsiz Proje',
        description: undefined,
        tags: [],
        files: files.map((f, i) => ({ name: f.name, language: f.language, content: f.content, order: i })),
      }
      if (savedId) {
        await postService.update(savedId, payload)
      } else {
        const post = await postService.create(payload)
        setSavedId(post.id)
        navigate(`/editor/${post.id}`, { replace: true })
      }
      markAllSaved()
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }, [savedId, projectTitle, files, isAuthenticated, navigate, markAllSaved])

  useAutoSave(saveProject)

  const handleAddFile = () => {
    const name = prompt('Dosya adı (örn. script.js):')
    if (!name) return
    const lang = languageFromFilename(name)
    addFile({ name, language: lang, content: defaultContentForLanguage(lang), isModified: false })
  }

  const hasUnsaved = files.some((f) => f.isModified)
  const isDark = theme !== 'vs-light'

  // ── Panel bar ──────────────────────────────────────────────────────────
  const PanelBar = (
    <div className="hidden sm:flex items-center gap-1 px-3 shrink-0" style={{ height: 38, background: '#0a0f1a', borderBottom: '1px solid #1e2535' }}>
      <div className="flex items-center gap-1">
        <PanelBtn active={showFiles}   onClick={() => setShowFiles((p) => !p)}   icon={Files}  label="Dosyalar" />
        <PanelBtn active={showPreview} onClick={() => setShowPreview((p) => !p)} icon={Eye}    label="Önizleme" />
      </div>

      <div className="w-px h-4 bg-[#1e2535] mx-2" />

      <button
        onClick={toggleWordWrap}
        title="Kelime Kaydır"
        className={cn('p-1.5 rounded transition-colors', wordWrap ? 'text-[#8aa8ff]' : 'text-gray-600 hover:text-gray-300')}
      >
        <WrapText className="w-3.5 h-3.5" />
      </button>

      <button
        onClick={() => setTheme(isDark ? 'vs-light' : 'vs-dark')}
        title={isDark ? 'Açık tema' : 'Koyu tema'}
        className="p-1.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
      >
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>

      {isAuthenticated && (
        <div className="ml-auto">
          <button
            onClick={saveProject}
            disabled={isSaving}
            title="Kaydet (Ctrl+S)"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-all',
              hasUnsaved
                ? 'bg-[#1e2a3a] text-[#8aa8ff] border border-[#2a3a56] hover:bg-[#243247]'
                : 'text-gray-600 border border-transparent',
            )}
          >
            {isSaving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : hasUnsaved ? <Save className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Kaydediliyor' : hasUnsaved ? 'Kaydet' : 'Kaydedildi'}</span>
          </button>
        </div>
      )}
    </div>
  )

  // ── Mobile tab bar ─────────────────────────────────────────────────────
  const MobileTabBar = (
    <div className="sm:hidden flex border-b border-[#1e2535] shrink-0" style={{ background: '#0a0f1a' }}>
      {([
        { id: 'files',   icon: Files, label: 'Dosyalar' },
        { id: 'editor',  icon: Code2, label: 'Editör' },
        { id: 'preview', icon: Eye,   label: 'Önizleme' },
      ] as const).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setMobilePanel(id)}
          className={cn(
            'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors border-b-2',
            mobilePanel === id
              ? 'text-[#8aa8ff] border-[#8aa8ff]'
              : 'text-gray-600 border-transparent hover:text-gray-400',
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  )

  // ── Editor column (tabs + CM6) ─────────────────────────────────────────
  const EditorColumn = (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <FileTabs files={files} activeFileId={activeFileId} onSelect={setActiveFile} onClose={removeFile} />
      <div className="flex-1 overflow-hidden">
        <EditorPane file={activeFile} theme={theme} wordWrap={wordWrap} onChange={updateActiveFile} />
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1117' }}>
      {PanelBar}
      {MobileTabBar}

      {/* ── Desktop: side-by-side panels ──────────────────────────────── */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {showFiles && (
          <div className="w-48 shrink-0 overflow-hidden">
            <FileTree
              files={files}
              activeFileId={activeFileId}
              onSelect={setActiveFile}
              onAdd={handleAddFile}
              onDelete={removeFile}
            />
          </div>
        )}
        {EditorColumn}
        {showPreview && (
          <div className="flex-1 overflow-hidden">
            <PreviewPanel files={files} />
          </div>
        )}
      </div>

      {/* ── Mobile: single panel ──────────────────────────────────────── */}
      <div className="sm:hidden flex-1 overflow-hidden">
        {mobilePanel === 'files' && (
          <FileTree
            files={files}
            activeFileId={activeFileId}
            onSelect={(id) => { setActiveFile(id); setMobilePanel('editor') }}
            onAdd={handleAddFile}
            onDelete={removeFile}
          />
        )}
        {mobilePanel === 'editor' && EditorColumn}
        {mobilePanel === 'preview' && <PreviewPanel files={files} />}
      </div>
    </div>
  )
}
