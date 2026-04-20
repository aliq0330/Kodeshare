import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Files, Code2, Eye, WrapText, Sun, Moon, Plus, Trash2, X,
  RefreshCw, ExternalLink, Monitor, Tablet, Smartphone,
  Loader2, Save, ChevronRight, ChevronDown, FolderOpen, Cloud,
  Pencil, Check, Palette,
} from 'lucide-react'
import { useEditor } from '@editor/hooks/useEditor'
import { useAutoSave } from '@editor/hooks/useAutoSave'
import { useEditorStore } from '@store/editorStore'
import { useProjectStore } from '@store/projectStore'
import { useAuthStore } from '@store/authStore'
import { projectService, type SavedProject } from '@services/projectService'
import { languageFromFilename, defaultContentForLanguage } from '@editor/utils/languageUtils'
import { LANGUAGE_COLORS } from '@utils/constants'
import EditorPane, { type SelectionCoords } from '@editor/components/EditorPane'
import { getThemeConfig, EDITOR_THEMES, type UiColors, type PreviewColors } from '@editor/themes'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'
import type { EditorLanguage, EditorTheme } from '@/types'
import { useComposerStore } from '@store/composerStore'
import '@/styles/editor.css'

// ─── ThemePreview ──────────────────────────────────────────────────────────

function ThemePreview({ p, bg }: { p: PreviewColors; bg: string }) {
  const s: React.CSSProperties = {
    background: bg, borderRadius: 6, padding: '6px 8px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 9, lineHeight: 1.7, overflow: 'hidden',
  }
  const line = (n: number, content: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 6 }}>
      <span style={{ color: p.gutter, minWidth: 8, userSelect: 'none' }}>{n}</span>
      <span>{content}</span>
    </div>
  )
  return (
    <div style={s}>
      {line(1, <span style={{ color: p.comment }}>{'// kodeshare'}</span>)}
      {line(2, <><span style={{ color: p.keyword }}>function </span><span style={{ color: p.fn }}>greet</span><span style={{ color: p.text }}>{'(name) {'}</span></>)}
      {line(3, <><span style={{ color: p.keyword }}>{'  return '}</span><span style={{ color: p.string }}>"Hi" </span><span style={{ color: p.text }}>+ name</span></>)}
      {line(4, <span style={{ color: p.text }}>{'}'}</span>)}
    </div>
  )
}

// ─── ThemePicker ───────────────────────────────────────────────────────────

function ThemePicker({ theme, setTheme, ui, align = 'right' }: {
  theme: EditorTheme
  setTheme: (t: EditorTheme) => void
  ui: UiColors
  align?: 'left' | 'right'
}) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={wrapRef} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        title="Editör teması"
        className={cn(
          'p-1.5 rounded transition-colors',
          open ? 'text-[#8aa8ff]' : 'text-gray-500 hover:text-gray-300',
        )}
        style={open ? { background: ui.raisedBg } : undefined}
      >
        <Palette className="w-3.5 h-3.5" />
      </button>

      {open && (
        <div
          className="absolute top-full mt-1 z-50 w-64 rounded-xl border shadow-2xl overflow-hidden"
          style={{
            background: ui.panelBg,
            borderColor: ui.border,
            [align === 'right' ? 'right' : 'left']: 0,
          }}
        >
          <div className="px-3 py-2 border-b" style={{ borderColor: ui.border }}>
            <span className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: ui.textMuted }}>
              Editör Teması
            </span>
          </div>
          <div className="p-2 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto scrollbar-none">
            {EDITOR_THEMES.map((t) => {
              const active = theme === (t.id as EditorTheme)
              return (
                <button
                  key={t.id}
                  onClick={() => { setTheme(t.id as EditorTheme); setOpen(false) }}
                  className="flex flex-col rounded-lg border overflow-hidden text-left transition-all"
                  style={{ borderColor: active ? '#4a7aff' : ui.border, boxShadow: active ? '0 0 0 1px #4a7aff44' : undefined }}
                >
                  <div className="w-full pointer-events-none">
                    <ThemePreview p={t.preview} bg={t.bg} />
                  </div>
                  <div className="flex items-center justify-between px-2 py-1.5" style={{ background: t.dark ? '#0d0e14' : '#f0f0f0' }}>
                    <span className={cn('text-[10px] font-medium', t.dark ? 'text-gray-300' : 'text-gray-700')}>
                      {t.name}
                    </span>
                    {active && <Check className="w-3 h-3 text-[#4a7aff] shrink-0" />}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── InlineEdit ────────────────────────────────────────────────────────────

function InlineEdit({
  value, onSave, onCancel, className,
}: {
  value: string; onSave: (v: string) => void; onCancel: () => void; className?: string
}) {
  const [v, setV] = useState(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter')  { e.preventDefault(); e.stopPropagation(); onSave(v.trim() || value) }
        if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() }
        e.stopPropagation()
      }}
      onBlur={() => onSave(v.trim() || value)}
      onClick={(e) => e.stopPropagation()}
      className={cn('outline-none min-w-0 w-full bg-transparent', className)}
      style={{ borderBottom: '1px solid #4a7aff' }}
    />
  )
}

// ─── PanelBtn ──────────────────────────────────────────────────────────────

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

// ─── ProjectsSidebar ───────────────────────────────────────────────────────

interface ProjectsSidebarProps {
  projects: SavedProject[]
  loading: boolean
  activeProjectId: string | null
  activeFileId: string | null
  isAuthenticated: boolean
  ui: UiColors
  onOpenFile: (project: SavedProject, fileId: string) => void
  onAddProject: () => void
  onSaveProject: (project: SavedProject) => void
  onDeleteProject: (project: SavedProject) => void
  onRenameProject: (project: SavedProject, newTitle: string) => void
  onAddFile: (project: SavedProject) => void
  onDeleteFile: (project: SavedProject, fileId: string) => void
  onRenameFile: (project: SavedProject, fileId: string, newName: string) => void
}

function ProjectsSidebar({
  projects, loading, activeProjectId, activeFileId, isAuthenticated, ui,
  onOpenFile, onAddProject, onSaveProject, onDeleteProject, onRenameProject,
  onAddFile, onDeleteFile, onRenameFile,
}: ProjectsSidebarProps) {
  const [expanded,       setExpanded]       = useState<Record<string, boolean>>({})
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [editingFile,    setEditingFile]    = useState<string | null>(null)

  // Auto-expand active project
  useEffect(() => {
    if (activeProjectId) setExpanded((s) => ({ ...s, [activeProjectId]: true }))
  }, [activeProjectId])

  const toggleExpand = (id: string) => setExpanded((s) => ({ ...s, [id]: !s[id] }))

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: ui.sidebarBg, borderRight: `1px solid ${ui.border}`, color: ui.text }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3" style={{ borderBottom: `1px solid ${ui.border}` }}>
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[#8aa8ff]" />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: ui.textMuted }}>
            Projelerim
          </span>
        </div>
        {isAuthenticated && (
          <button
            onClick={onAddProject}
            title="Yeni proje"
            className="p-1.5 rounded-md transition-colors text-[#8aa8ff]"
            style={{ color: ui.textMuted }}
            onMouseEnter={(e) => (e.currentTarget.style.background = ui.raisedBg)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto scrollbar-none py-1">
        {!isAuthenticated && (
          <p className="px-3 py-6 text-[12px] text-gray-600 text-center leading-relaxed">
            Projelerini kaydetmek için<br />giriş yapmalısın.
          </p>
        )}

        {isAuthenticated && loading && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
          </div>
        )}

        {isAuthenticated && !loading && projects.length === 0 && (
          <p className="px-3 py-6 text-[12px] text-gray-600 text-center leading-relaxed">
            + ile ilk projeyi oluştur
          </p>
        )}

        {projects.map((project) => {
          const isActive   = project.id === activeProjectId
          const isExpanded = expanded[project.id] ?? false

          return (
            <div key={project.id}>
              {/* Project row */}
              <div
                className="group flex items-center gap-1 px-2 py-2.5 cursor-pointer select-none transition-colors"
                style={{ background: isActive ? ui.raisedBg : undefined }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = ui.raisedBg }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent' }}
              >
                {/* Chevron — expand/collapse */}
                <button
                  onClick={() => toggleExpand(project.id)}
                  className="p-0.5 rounded text-gray-600 hover:text-gray-300 shrink-0 transition-colors"
                >
                  {isExpanded
                    ? <ChevronDown  className="w-4 h-4" />
                    : <ChevronRight className="w-4 h-4" />}
                </button>

                {/* Proje adı — tıklayınca expand/collapse */}
                {editingProject === project.id ? (
                  <InlineEdit
                    value={project.title}
                    onSave={(v) => { onRenameProject(project, v); setEditingProject(null) }}
                    onCancel={() => setEditingProject(null)}
                    className="flex-1 text-sm font-medium text-[#8aa8ff]"
                  />
                ) : (
                  <span
                    onClick={() => toggleExpand(project.id)}
                    className="flex-1 text-sm font-medium truncate transition-colors"
                    style={{ color: isActive ? '#8aa8ff' : ui.textMuted }}
                    title="Dosyaları göster / gizle"
                  >
                    {project.title}
                  </span>
                )}

                {/* Active indicator dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                )}

                {/* Hover eylemleri */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
                  {/* Aç butonu */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleExpand(project.id)
                      if (project.files[0]) onOpenFile(project, project.files[0].id)
                    }}
                    className="px-2 py-0.5 rounded text-xs font-medium bg-brand-500/20 text-brand-300 hover:bg-brand-500 hover:text-white transition-all shrink-0 focus:opacity-100"
                    title="Projeyi aç"
                  >
                    Aç
                  </button>
                  {/* Kalem — yeniden adlandır */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingProject(project.id) }}
                    className="p-1.5 rounded hover:bg-[#1e2a3a] text-gray-600 hover:text-[#8aa8ff] transition-colors"
                    title="Yeniden adlandır"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onSaveProject(project) }}
                    className="p-1 rounded hover:bg-[#1e2a3a] text-gray-600 hover:text-[#8aa8ff] transition-colors"
                    title="Kaydet"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteProject(project) }}
                    className="p-1 rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-colors"
                    title="Projeyi sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Files list */}
              {isExpanded && (
                <div className="pb-1">
                  {project.files.map((file) => {
                    const color = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
                    const ext   = file.name.split('.').pop() ?? ''
                    const isFileActive = file.id === activeFileId && isActive

                    return (
                      <div
                        key={file.id}
                        onClick={() => onOpenFile(project, file.id)}
                        className="group/file flex items-center gap-2 pl-8 pr-2 py-1.5 cursor-pointer select-none transition-colors"
                        style={{ background: isFileActive ? ui.raisedBg : undefined, color: isFileActive ? '#8aa8ff' : ui.textMuted }}
                        onMouseEnter={(e) => { if (!isFileActive) e.currentTarget.style.background = ui.raisedBg }}
                        onMouseLeave={(e) => { if (!isFileActive) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span
                          className="text-[10px] font-bold shrink-0 w-8"
                          style={{ color }}
                        >
                          {ext.toUpperCase()}
                        </span>

                        {editingFile === file.id ? (
                          <InlineEdit
                            value={file.name}
                            onSave={(v) => {
                              onRenameFile(project, file.id, v)
                              setEditingFile(null)
                            }}
                            onCancel={() => setEditingFile(null)}
                            className="flex-1 text-[13px] font-mono text-[#c0cce0]"
                          />
                        ) : (
                          <span className="flex-1 text-[13px] font-mono truncate">
                            {file.name}
                          </span>
                        )}

                        {/* Kalem — yeniden adlandır */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingFile(file.id) }}
                          className="opacity-0 group-hover/file:opacity-100 p-1 rounded hover:bg-[#2a3347] text-gray-600 hover:text-gray-300 transition-all shrink-0"
                          title="Dosyayı yeniden adlandır"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteFile(project, file.id) }}
                          className="opacity-0 group-hover/file:opacity-100 p-1 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400 transition-all shrink-0"
                          title="Dosyayı sil"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  })}

                  {/* Add file to project */}
                  <button
                    onClick={() => onAddFile(project)}
                    className="flex items-center gap-1.5 pl-8 pr-2 py-1.5 w-full text-xs text-gray-600 hover:text-[#8aa8ff] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Dosya ekle
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── FileTabs ──────────────────────────────────────────────────────────────

function FileTabs({ files, activeFileId, onSelect, onClose, ui }: {
  files: ReturnType<typeof useEditor>['files']
  activeFileId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  ui: UiColors
}) {
  return (
    <div
      className="flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-none shrink-0"
      style={{ height: 34, background: ui.panelBg, borderBottom: `1px solid ${ui.border}` }}
    >
      {files.map((file) => {
        const color    = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
        const ext      = file.name.split('.').pop() ?? ''
        const isActive = file.id === activeFileId
        return (
          <div
            key={file.id}
            onMouseDown={() => onSelect(file.id)}
            className="group flex items-center gap-1.5 px-3 h-[26px] rounded cursor-pointer whitespace-nowrap transition-all text-[12px] font-mono border select-none"
            style={isActive
              ? { background: ui.raisedBg, color: ui.text, borderColor: ui.border }
              : { color: ui.textMuted, borderColor: 'transparent' }}
          >
            <span className="text-[9px] font-bold" style={{ color }}>{ext.toUpperCase()}</span>
            <span>{file.name}</span>
            {file.isModified && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
            <button
              onMouseDown={(e) => { e.stopPropagation(); onClose(file.id) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-all -mr-1"
              style={{ color: ui.textMuted }}
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

// ─── PreviewPanel ──────────────────────────────────────────────────────────

const VIEWPORTS = [
  { id: 'desktop', icon: Monitor,    label: 'Masaüstü', width: '100%' },
  { id: 'tablet',  icon: Tablet,     label: 'Tablet',   width: '768px' },
  { id: 'mobile',  icon: Smartphone, label: 'Mobil',    width: '375px' },
] as const

function buildPreviewDoc(files: ReturnType<typeof useEditor>['files']) {
  const htmlFile = files.find((f) => f.language === 'html')
  const cssFiles = files.filter((f) => f.language === 'css')
  const jsFiles  = files.filter((f) => f.language === 'javascript' || f.language === 'typescript')
  const base     = htmlFile?.content ?? '<!DOCTYPE html><html><body></body></html>'
  const style    = cssFiles.map((f) => f.content).join('\n')
  const script   = jsFiles.map((f) => f.content).join('\n')
  return base
    .replace('</head>', `<style>${style}</style></head>`)
    .replace('</body>', `<script>${script}<\/script></body>`)
}

function PreviewPanel({ files, ui }: { files: ReturnType<typeof useEditor>['files']; ui: UiColors }) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [src, setSrc]           = useState('')
  const [key, setKey]           = useState(0)

  useEffect(() => {
    const doc = buildPreviewDoc(files)
    setSrc(`data:text/html;charset=utf-8,${encodeURIComponent(doc)}`)
  }, [files])

  const vp = VIEWPORTS.find((v) => v.id === viewport)!

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: ui.pageBg, borderLeft: `1px solid ${ui.border}` }}
    >
      <div
        className="hidden sm:flex items-center gap-1 px-3 shrink-0"
        style={{ height: 34, borderBottom: `1px solid ${ui.border}` }}
      >
        <div className="flex items-center gap-0.5 rounded-md p-0.5" style={{ background: ui.raisedBg }}>
          {VIEWPORTS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              title={label}
              className="p-1 rounded transition-colors"
              style={viewport === id ? { background: ui.border, color: ui.text } : { color: ui.textMuted }}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setKey((k) => k + 1)}
            title="Yenile"
            className="p-1 rounded transition-colors"
            style={{ color: ui.textMuted }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.open(src, '_blank')}
            title="Yeni sekmede aç"
            className="p-1 rounded transition-colors"
            style={{ color: ui.textMuted }}
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-start justify-center" style={{ background: ui.raisedBg }}>
        <div
          className="h-full transition-all duration-300 bg-white"
          style={{ width: vp.width, maxWidth: '100%' }}
        >
          <iframe
            key={key}
            src={src}
            className="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function getAutoFilename(type: 'html' | 'css' | 'js', existingNames: string[]): string {
  const bases = { html: 'index', css: 'style', js: 'script' }
  const base = bases[type]
  if (!existingNames.includes(`${base}.${type}`)) return `${base}.${type}`
  let i = 1
  while (existingNames.includes(`${base}${i}.${type}`)) i++
  return `${base}${i}.${type}`
}

// ─── Main Editor Page ──────────────────────────────────────────────────────

export default function EditorPage() {
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>()
  const { isAuthenticated } = useAuthStore()
  const {
    files, activeFile, activeFileId, theme, fontSize, wordWrap,
    setActiveFile, addFile, removeFile, updateActiveFile, toggleWordWrap, setTheme,
  } = useEditor()
  const { projectTitle, setProjectTitle, loadProject, markAllSaved, activeProjectId, setActiveProjectId } = useEditorStore()
  const {
    projects, loading,
    fetch: fetchProjects, addProject, patch: patchProject, remove: removeProject,
  } = useProjectStore()

  const { openWithSnippet } = useComposerStore()
  const [selectedCode,      setSelectedCode]       = useState('')
  const [tooltipCoords,     setTooltipCoords]      = useState<SelectionCoords | null>(null)

  const [showProjects,      setShowProjects]      = useState(true)
  const [showPreview,       setShowPreview]        = useState(true)
  const [isSaving,          setIsSaving]           = useState(false)
  const [mobilePanel,       setMobilePanel]        = useState<'projects' | 'editor'>('editor')
  const [mobileShowPreview, setMobileShowPreview]  = useState(false)
  const [addFileTarget,     setAddFileTarget]      = useState<SavedProject | 'local' | null>(null)

  // Fetch saved projects on auth
  useEffect(() => {
    if (isAuthenticated) fetchProjects()
  }, [isAuthenticated]) // eslint-disable-line

  // Auto-open project from URL param
  useEffect(() => {
    if (!urlProjectId || !projects.length) return
    const found = projects.find((p) => p.id === urlProjectId)
    if (found) {
      loadProject(found.title, found.files, found.id)
      setActiveFile(found.files[0]?.id ?? null)
    }
  }, [urlProjectId, projects.length]) // eslint-disable-line

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }) // eslint-disable-line

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!isAuthenticated) { toast.error('Kaydetmek için giriş yapmalısın'); return }
    const hasContent = files.some((f) => f.content.trim())
    if (!hasContent) return

    // activeProjectId persist edilse de proje silinmiş olabilir; kontrol et
    const projectExists = activeProjectId && projects.some((p) => p.id === activeProjectId)
    const targetProjectId = projectExists ? activeProjectId : null

    setIsSaving(true)
    try {
      if (!targetProjectId) {
        // Proje yok — yeni proje oluştur ve mevcut dosyaları kaydet
        const newProject = await addProject(projectTitle)
        if (!newProject) throw new Error('Proje oluşturulamadı')
        await projectService.save(newProject.id, projectTitle, files)
        markAllSaved()
        setActiveProjectId(newProject.id)
        patchProject(newProject.id, { title: projectTitle, files: files.map((f) => ({ ...f, isModified: false })) })
        toast.success('Proje oluşturuldu ve kaydedildi')
      } else {
        await projectService.save(targetProjectId, projectTitle, files)
        markAllSaved()
        patchProject(targetProjectId, {
          title: projectTitle,
          files: files.map((f) => ({ ...f, isModified: false })),
        })
        toast.success('Proje kaydedildi')
      }
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }, [activeProjectId, projects, projectTitle, files, isAuthenticated, markAllSaved, patchProject, addProject, setActiveProjectId])

  useAutoSave(handleSave)

  // ── Open project / file ───────────────────────────────────────────────────

  const handleOpenFile = useCallback((project: SavedProject, fileId: string) => {
    if (project.id !== activeProjectId) {
      loadProject(project.title, project.files, project.id)
    }
    setActiveFile(fileId)
    if (window.innerWidth < 640) setMobilePanel('editor')
  }, [activeProjectId, loadProject, setActiveFile])

  // ── Add project ───────────────────────────────────────────────────────────

  const handleAddProject = async () => {
    if (!isAuthenticated) { toast.error('Giriş yapmalısın'); return }
    const name = prompt('Proje adı:')
    if (!name?.trim()) return
    const project = await addProject(name.trim())
    if (project) {
      loadProject(project.title, project.files, project.id)
      setActiveFile(project.files[0]?.id ?? null)
      if (window.innerWidth < 640) setMobilePanel('editor')
    }
  }

  // ── Save specific project ─────────────────────────────────────────────────

  const handleSaveProject = async (project: SavedProject) => {
    setIsSaving(true)
    try {
      const isActive = project.id === activeProjectId
      const filesToSave = isActive ? files : project.files
      const titleToSave = isActive ? projectTitle : project.title
      await projectService.save(project.id, titleToSave, filesToSave)
      if (isActive) { markAllSaved() }
      patchProject(project.id, { files: filesToSave.map((f) => ({ ...f, isModified: false })), title: titleToSave })
      toast.success('Kaydedildi')
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }

  // ── Delete project ────────────────────────────────────────────────────────

  const handleDeleteProject = async (project: SavedProject) => {
    if (!window.confirm(`"${project.title}" projesini silmek istediğine emin misin?`)) return
    try {
      await projectService.remove(project.id)
      removeProject(project.id)
      if (project.id === activeProjectId) {
        const next = projects.find((p) => p.id !== project.id)
        if (next) { loadProject(next.title, next.files, next.id) }
        else { loadProject('Yeni Proje', [], null) }
      }
      toast.success('Proje silindi')
    } catch {
      toast.error('Silinemedi')
    }
  }

  // ── Rename project ────────────────────────────────────────────────────────

  const handleRenameProject = async (project: SavedProject, newTitle: string) => {
    if (newTitle === project.title) return
    try {
      await projectService.rename(project.id, newTitle)
      patchProject(project.id, { title: newTitle })
      if (project.id === activeProjectId) setProjectTitle(newTitle)
    } catch {
      toast.error('Yeniden adlandırılamadı')
    }
  }

  // ── Add file to project ───────────────────────────────────────────────────

  const handleAddFile = (project: SavedProject) => {
    setAddFileTarget(project)
  }

  // ── Delete file ───────────────────────────────────────────────────────────

  const handleDeleteFile = async (project: SavedProject, fileId: string) => {
    const file = project.files.find((f) => f.id === fileId)
    if (!file) return
    if (!window.confirm(`"${file.name}" dosyasını silmek istediğine emin misin?`)) return
    try {
      await projectService.deleteFile(fileId)
      patchProject(project.id, { files: project.files.filter((f) => f.id !== fileId) })
      if (project.id === activeProjectId) removeFile(fileId)
    } catch {
      toast.error('Dosya silinemedi')
    }
  }

  // ── Rename file ───────────────────────────────────────────────────────────

  const handleRenameFile = async (project: SavedProject, fileId: string, newName: string) => {
    const file = project.files.find((f) => f.id === fileId)
    if (!file || newName === file.name) return
    try {
      await projectService.renameFile(fileId, newName)
      const lang = languageFromFilename(newName)
      patchProject(project.id, {
        files: project.files.map((f) => f.id === fileId ? { ...f, name: newName, language: lang } : f),
      })
      if (project.id === activeProjectId) {
        // update in editorStore too
        const store = useEditorStore.getState()
        store.updateFile(fileId, { name: newName, language: lang })
      }
    } catch {
      toast.error('Yeniden adlandırılamadı')
    }
  }

  // ── Inline add file (local only, for current editor session) ──────────────

  const handleAddLocalFile = () => {
    setAddFileTarget('local')
  }

  // ── File type selection (from modal) ──────────────────────────────────────

  const handleFileTypeSelect = async (type: 'html' | 'css' | 'js') => {
    const target = addFileTarget
    setAddFileTarget(null)
    if (!target) return

    if (target === 'local') {
      const name = getAutoFilename(type, files.map((f) => f.name))
      const lang = languageFromFilename(name)
      addFile({ name, language: lang, content: defaultContentForLanguage(lang), isModified: false })
      return
    }

    const project = target
    const name = getAutoFilename(type, project.files.map((f) => f.name))
    try {
      const newFile = await projectService.addFile(project.id, name, project.files.length)
      patchProject(project.id, { files: [...project.files, newFile] })
      if (project.id === activeProjectId) {
        addFile({ id: newFile.id, name: newFile.name, language: newFile.language, content: defaultContentForLanguage(newFile.language), isModified: false })
      }
    } catch {
      toast.error('Dosya eklenemedi')
    }
  }

  // ── Close tab (editör sekmesindeki X) ────────────────────────────────────
  // Aktif proje varsa DB + projectStore'dan da siler; yoksa sadece editörden kaldırır

  const handleCloseTab = useCallback(async (fileId: string) => {
    removeFile(fileId)
    if (!activeProjectId) return
    const project = projects.find((p) => p.id === activeProjectId)
    if (!project?.files.some((f) => f.id === fileId)) return
    try {
      await projectService.deleteFile(fileId)
      patchProject(activeProjectId, { files: project.files.filter((f) => f.id !== fileId) })
    } catch {
      toast.error('Dosya projeden silinemedi')
    }
  }, [activeProjectId, projects, removeFile, patchProject])

  const handleSelectionChange = useCallback((text: string, coords: SelectionCoords | null) => {
    setSelectedCode(text)
    setTooltipCoords(coords)
  }, [])

  const themeConfig = getThemeConfig(theme)
  const ui          = themeConfig.ui
  const hasUnsaved  = files.some((f) => f.isModified)
  const isDark      = themeConfig.dark

  // ── Panel bar ─────────────────────────────────────────────────────────────

  const PanelBar = (
    <div
      className="hidden sm:flex items-center gap-1 px-3 shrink-0"
      style={{ height: 40, background: ui.panelBg, borderBottom: `1px solid ${ui.border}`, color: ui.text }}
    >
      <div className="flex items-center gap-1">
        <PanelBtn active={showProjects} onClick={() => setShowProjects((p) => !p)} icon={Files}  label="Projeler"  />
        <PanelBtn active={showPreview}  onClick={() => setShowPreview((p)  => !p)} icon={Eye}    label="Önizleme" />
      </div>

      <div className="w-px h-4 bg-[#1e2535] mx-1" />

      <button
        onClick={toggleWordWrap}
        title="Kelime kaydır"
        className={cn('p-1.5 rounded transition-colors', wordWrap ? 'text-[#8aa8ff]' : 'text-gray-600 hover:text-gray-300')}
      >
        <WrapText className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => setTheme(isDark ? 'github-light' : 'one-dark')}
        title={isDark ? 'Açık tema' : 'Koyu tema'}
        className="p-1.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
      >
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>
      <ThemePicker theme={theme} setTheme={setTheme} ui={ui} />

      {/* Project title */}
      {activeProjectId && (
        <>
          <div className="w-px h-4 bg-[#1e2535] mx-1" />
          <span className="text-[12px] text-gray-500 font-mono truncate max-w-[180px]">
            {projectTitle}
          </span>
        </>
      )}

      {isAuthenticated && (
        <div className="ml-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            title="Kaydet (Ctrl+S)"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              hasUnsaved || !activeProjectId
                ? 'bg-[#1e2a3a] text-[#8aa8ff] border border-[#2a3a56] hover:bg-[#243247]'
                : 'text-gray-600 border border-transparent',
            )}
          >
            {isSaving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : hasUnsaved ? <Save className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Kaydediliyor…' : hasUnsaved ? 'Kaydet' : 'Kaydedildi'}</span>
          </button>
        </div>
      )}
    </div>
  )

  // ── Mobile tab bar ────────────────────────────────────────────────────────

  const MobileTabBar = (
    <div
      className="sm:hidden flex shrink-0"
      style={{ background: ui.panelBg, borderBottom: `1px solid ${ui.border}` }}
    >
      {([
        { id: 'projects', icon: Files, label: 'Projeler' },
        { id: 'editor',   icon: Code2, label: 'Editör'   },
      ] as const).map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setMobilePanel(id)}
          className={cn(
            'flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] font-medium transition-colors',
            mobilePanel === id
              ? 'text-[#8aa8ff] border-b-2 border-[#8aa8ff]'
              : 'text-gray-600 border-b-2 border-transparent hover:text-gray-400',
          )}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}

      {/* Mobile save button */}
      {isAuthenticated && (
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={cn(
            'flex flex-col items-center justify-center gap-0.5 px-3 py-2.5 text-[11px] font-medium transition-colors border-b-2 border-transparent',
            hasUnsaved ? 'text-[#8aa8ff]' : 'text-gray-600',
          )}
        >
          {isSaving
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : hasUnsaved ? <Save className="w-4 h-4" /> : <Check className="w-4 h-4" />}
          <span>{isSaving ? '…' : 'Kaydet'}</span>
        </button>
      )}
    </div>
  )

  // ── Editor column ─────────────────────────────────────────────────────────

  const EditorColumn = files.length === 0 ? (
    <div className="flex flex-col flex-1 min-w-0 items-center justify-center gap-4 select-none" style={{ background: ui.pageBg }}>
      <p className="text-sm font-medium" style={{ color: ui.textMuted }}>Proje Ekle</p>
      <button
        onClick={handleAddProject}
        className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ borderColor: ui.border, color: ui.textMuted }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8aa8ff'; e.currentTarget.style.color = '#8aa8ff' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.textMuted }}
        title="Yeni proje oluştur"
      >
        <Plus className="w-10 h-10" />
      </button>
    </div>
  ) : (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <FileTabs
        files={files}
        activeFileId={activeFileId}
        onSelect={setActiveFile}
        onClose={handleCloseTab}
        ui={ui}
      />
      <div className="flex-1 overflow-hidden">
        <EditorPane
          file={activeFile}
          theme={theme}
          fontSize={fontSize}
          wordWrap={wordWrap}
          onChange={updateActiveFile}
          onSelectionChange={handleSelectionChange}
        />
      </div>
    </div>
  )

  // ── Sidebar props ─────────────────────────────────────────────────────────

  const sidebarProps: ProjectsSidebarProps = {
    projects,
    loading,
    activeProjectId,
    activeFileId,
    isAuthenticated,
    ui,
    onOpenFile:      handleOpenFile,
    onAddProject:    handleAddProject,
    onSaveProject:   handleSaveProject,
    onDeleteProject: handleDeleteProject,
    onRenameProject: handleRenameProject,
    onAddFile:       handleAddFile,
    onDeleteFile:    handleDeleteFile,
    onRenameFile:    handleRenameFile,
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: ui.pageBg, color: ui.text }}>
      {/* ── File type selection modal ─────────────────────────────────── */}
      {addFileTarget !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={() => setAddFileTarget(null)}
        >
          <div
            className="rounded-xl border shadow-2xl p-6 w-72"
            style={{ background: ui.panelBg, borderColor: ui.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-center mb-5" style={{ color: ui.text }}>
              Dosya türünü seçin
            </p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { type: 'html', color: '#e34c26' },
                { type: 'css',  color: '#264de4' },
                { type: 'js',   color: '#f7df1e' },
              ] as const).map(({ type, color }) => (
                <button
                  key={type}
                  onClick={() => handleFileTypeSelect(type)}
                  className="flex flex-col items-center gap-1 py-5 rounded-xl border-2 font-bold text-lg transition-all hover:scale-105 active:scale-95 select-none"
                  style={{ borderColor: color + '66', background: color + '11', color }}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
            <button
              onClick={() => setAddFileTarget(null)}
              className="mt-4 w-full py-2 text-xs rounded-lg transition-colors"
              style={{ color: ui.textMuted }}
            >
              İptal
            </button>
          </div>
        </div>
      )}

      {tooltipCoords && selectedCode && (
        <div
          style={{
            position: 'fixed',
            top: tooltipCoords.top - 44,
            left: Math.max(8, Math.min(tooltipCoords.left, window.innerWidth - 210)),
            zIndex: 9999,
          }}
        >
          <button
            onMouseDown={(e) => {
              e.preventDefault()
              openWithSnippet(selectedCode, activeFile?.language ?? 'javascript')
              setTooltipCoords(null)
              setSelectedCode('')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition-colors whitespace-nowrap"
          >
            <Code2 className="w-3.5 h-3.5" />
            Snippet olarak paylaş
          </button>
        </div>
      )}
      {PanelBar}
      {MobileTabBar}

      {/* Desktop: side-by-side */}
      <div className="hidden sm:flex flex-1 overflow-hidden">
        {showProjects && (
          <div className="w-60 shrink-0 overflow-hidden">
            <ProjectsSidebar {...sidebarProps} />
          </div>
        )}
        {EditorColumn}
        {showPreview && (
          <div className="flex-1 overflow-hidden">
            <PreviewPanel files={files} ui={ui} />
          </div>
        )}
      </div>

      {/* Mobile: projeler veya editör/önizleme */}
      <div className="sm:hidden flex-1 overflow-hidden">
        {mobilePanel === 'projects' && (
          <ProjectsSidebar {...sidebarProps} />
        )}
        {mobilePanel === 'editor' && (
          <div className="flex flex-col h-full overflow-hidden">
            {/* Modern segmented control */}
            <div className="shrink-0 flex items-center gap-2 px-3 py-2" style={{ background: ui.panelBg, borderBottom: `1px solid ${ui.border}` }}>
              <div className="flex flex-1 rounded-xl p-1" style={{ background: ui.raisedBg }}>
                {([
                  { show: false, icon: Code2, label: 'Kod'       },
                  { show: true,  icon: Eye,   label: 'Önizleme'  },
                ] as const).map(({ show, icon: Icon, label }) => {
                  const isActive = mobileShowPreview === show
                  return (
                    <button
                      key={String(show)}
                      onPointerDown={(e) => { e.preventDefault(); setMobileShowPreview(show) }}
                      className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all select-none touch-manipulation"
                      style={isActive
                        ? { background: ui.pageBg, color: '#8aa8ff', boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }
                        : { color: ui.textMuted }}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  )
                })}
              </div>
              <ThemePicker theme={theme} setTheme={setTheme} ui={ui} align="right" />
            </div>

            {/* Full-screen editor or preview */}
            {!mobileShowPreview ? (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                <FileTabs
                  files={files}
                  activeFileId={activeFileId}
                  onSelect={setActiveFile}
                  onClose={handleCloseTab}
                  ui={ui}
                />
                <div className="flex-1 overflow-hidden">
                  <EditorPane
                    file={activeFile}
                    theme={theme}
                    fontSize={fontSize}
                    wordWrap={wordWrap}
                    onChange={updateActiveFile}
                    onSelectionChange={handleSelectionChange}
                  />
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-0 overflow-hidden">
                <PreviewPanel files={files} ui={ui} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
