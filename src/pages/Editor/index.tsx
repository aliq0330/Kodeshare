import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import {
  Files, Code2, Eye, WrapText, Sun, Moon, Plus, Trash2, X,
  RefreshCw, ExternalLink, Monitor, Tablet, Smartphone,
  Loader2, Save, ChevronRight, ChevronDown, FolderOpen, Cloud,
  Pencil, Check, GripHorizontal,
} from 'lucide-react'
import { useEditor } from '@editor/hooks/useEditor'
import { useAutoSave } from '@editor/hooks/useAutoSave'
import { useEditorStore } from '@store/editorStore'
import { useProjectStore } from '@store/projectStore'
import { useAuthStore } from '@store/authStore'
import { projectService, type SavedProject } from '@services/projectService'
import { languageFromFilename, defaultContentForLanguage } from '@editor/utils/languageUtils'
import { LANGUAGE_COLORS } from '@utils/constants'
import EditorPane from '@editor/components/EditorPane'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'
import type { EditorLanguage, EditorTheme } from '@/types'
import '@/styles/editor.css'

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
  projects, loading, activeProjectId, activeFileId, isAuthenticated,
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
      style={{ background: '#0a0f1a', borderRight: '1px solid #1e2535' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-[#1e2535]">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-[#8aa8ff]" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Projelerim
          </span>
        </div>
        {isAuthenticated && (
          <button
            onClick={onAddProject}
            title="Yeni proje"
            className="p-1.5 rounded-md hover:bg-[#1e2535] text-gray-600 hover:text-[#8aa8ff] transition-colors"
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
                className={cn(
                  'group flex items-center gap-1 px-2 py-2.5 cursor-pointer select-none transition-colors',
                  isActive ? 'bg-[#151e30]' : 'hover:bg-[#111827]',
                )}
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
                    className={cn(
                      'flex-1 text-sm font-medium truncate transition-colors',
                      isActive ? 'text-[#8aa8ff]' : 'text-[#7a8aa8] hover:text-[#c8d8f0]',
                    )}
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
                        className={cn(
                          'group/file flex items-center gap-2 pl-8 pr-2 py-1.5 cursor-pointer select-none transition-colors',
                          isFileActive
                            ? 'bg-[#1e2a4a] text-[#8aa8ff]'
                            : 'text-[#6b7a99] hover:bg-[#111827] hover:text-[#c0cce0]',
                        )}
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

function FileTabs({ files, activeFileId, onSelect, onClose, mobileShowPreview, onToggleMobilePreview }: {
  files: ReturnType<typeof useEditor>['files']
  activeFileId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
  mobileShowPreview?: boolean
  onToggleMobilePreview?: () => void
}) {
  return (
    <div
      className="flex items-center gap-0.5 px-2 overflow-x-auto scrollbar-none shrink-0"
      style={{ height: 34, background: '#0d1117', borderBottom: '1px solid #1e2535' }}
    >
      {/* Mobil Önizleme toggle — en solda */}
      {onToggleMobilePreview !== undefined && (
        <button
          onClick={onToggleMobilePreview}
          className={cn(
            'sm:hidden flex items-center gap-1 px-2 h-[26px] rounded text-[12px] font-medium whitespace-nowrap transition-all shrink-0 border mr-1',
            mobileShowPreview
              ? 'bg-[#1e2a3a] text-[#8aa8ff] border-[#2a3a56]'
              : 'text-[#6b7a99] hover:bg-[#161e2d] hover:text-[#c0cce0] border-transparent',
          )}
        >
          <Eye className="w-3 h-3" />
          <span>Önizleme</span>
        </button>
      )}
      {files.map((file) => {
        const color    = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
        const ext      = file.name.split('.').pop() ?? ''
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

function PreviewPanel({ files }: { files: ReturnType<typeof useEditor>['files'] }) {
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
      style={{ background: '#0d1117', borderLeft: '1px solid #1e2535' }}
    >
      <div
        className="hidden sm:flex items-center gap-1 px-3 shrink-0"
        style={{ height: 34, borderBottom: '1px solid #1e2535' }}
      >
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
          <button
            onClick={() => setKey((k) => k + 1)}
            title="Yenile"
            className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-[#1e2535] transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => window.open(src, '_blank')}
            title="Yeni sekmede aç"
            className="p-1 rounded text-gray-600 hover:text-gray-300 hover:bg-[#1e2535] transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-hidden flex items-start justify-center bg-[#1a1a2e]">
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

// ─── Main Editor Page ──────────────────────────────────────────────────────

export default function EditorPage() {
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>()
  const { isAuthenticated } = useAuthStore()
  const {
    files, activeFile, activeFileId, theme, wordWrap,
    setActiveFile, addFile, removeFile, updateActiveFile, toggleWordWrap, setTheme,
  } = useEditor()
  const { projectTitle, setProjectTitle, loadProject, markAllSaved } = useEditorStore()
  const {
    projects, loading, activeProjectId,
    fetch: fetchProjects, setActiveId, addProject, patch: patchProject, remove: removeProject,
  } = useProjectStore()

  const [showProjects,      setShowProjects]      = useState(true)
  const [showPreview,       setShowPreview]        = useState(true)
  const [isSaving,          setIsSaving]           = useState(false)
  const [mobilePanel,       setMobilePanel]        = useState<'projects' | 'editor'>('editor')
  const [mobileShowPreview, setMobileShowPreview]  = useState(true)

  // Mobil dikey bölme: editör yüzdesi (20–80)
  const [mobileEditorPct, setMobileEditorPct] = useState(50)
  const mobileDragRef    = useRef<{ startY: number; startPct: number } | null>(null)
  const mobileContentRef = useRef<HTMLDivElement>(null)

  // Fetch saved projects on auth
  useEffect(() => {
    if (isAuthenticated) fetchProjects()
  }, [isAuthenticated]) // eslint-disable-line

  // Auto-open project from URL param
  useEffect(() => {
    if (!urlProjectId || !projects.length) return
    const found = projects.find((p) => p.id === urlProjectId)
    if (found) {
      loadProject(found.title, found.files)
      setActiveId(found.id)
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
    if (!isAuthenticated || !activeProjectId) return
    setIsSaving(true)
    try {
      await projectService.save(activeProjectId, projectTitle, files)
      markAllSaved()
      patchProject(activeProjectId, {
        title: projectTitle,
        files: files.map((f) => ({ ...f, isModified: false })),
      })
      toast.success('Proje kaydedildi')
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }, [activeProjectId, projectTitle, files, isAuthenticated, markAllSaved, patchProject])

  useAutoSave(handleSave)

  // ── Open project / file ───────────────────────────────────────────────────

  const handleOpenFile = useCallback((project: SavedProject, fileId: string) => {
    if (project.id !== activeProjectId) {
      loadProject(project.title, project.files)
      setActiveId(project.id)
    }
    setActiveFile(fileId)
    if (window.innerWidth < 640) setMobilePanel('editor')
  }, [activeProjectId, loadProject, setActiveId, setActiveFile])

  // ── Add project ───────────────────────────────────────────────────────────

  const handleAddProject = async () => {
    if (!isAuthenticated) { toast.error('Giriş yapmalısın'); return }
    const name = prompt('Proje adı:')
    if (!name?.trim()) return
    const project = await addProject(name.trim())
    if (project) {
      loadProject(project.title, project.files)
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
        if (next) { loadProject(next.title, next.files); setActiveId(next.id) }
        else { loadProject('Yeni Proje', []); setActiveId(null) }
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

  const handleAddFile = async (project: SavedProject) => {
    const name = prompt('Dosya adı (örn. app.js):')
    if (!name?.trim()) return
    try {
      const newFile = await projectService.addFile(project.id, name.trim(), project.files.length)
      patchProject(project.id, { files: [...project.files, newFile] })
      if (project.id === activeProjectId) {
        addFile({ name: newFile.name, language: newFile.language, content: '', isModified: false })
      }
    } catch {
      toast.error('Dosya eklenemedi')
    }
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
    const name = prompt('Dosya adı (örn. script.js):')
    if (!name) return
    const lang = languageFromFilename(name)
    addFile({ name, language: lang, content: defaultContentForLanguage(lang), isModified: false })
  }

  const handleMobileDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    mobileDragRef.current = { startY: e.clientY, startPct: mobileEditorPct }
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handleMobileDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!mobileDragRef.current || !mobileContentRef.current) return
    const totalH = mobileContentRef.current.clientHeight
    if (totalH === 0) return
    const delta = e.clientY - mobileDragRef.current.startY
    setMobileEditorPct(Math.min(80, Math.max(20, mobileDragRef.current.startPct + (delta / totalH) * 100)))
  }

  const handleMobileDragEnd = () => { mobileDragRef.current = null }

  const hasUnsaved = files.some((f) => f.isModified)
  const isDark     = theme !== 'vs-light'

  // ── Panel bar ─────────────────────────────────────────────────────────────

  const PanelBar = (
    <div
      className="hidden sm:flex items-center gap-1 px-3 shrink-0"
      style={{ height: 40, background: '#07090f', borderBottom: '1px solid #1e2535' }}
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
        onClick={() => setTheme(isDark ? 'vs-light' : 'vs-dark')}
        title={isDark ? 'Açık tema' : 'Koyu tema'}
        className="p-1.5 rounded text-gray-600 hover:text-gray-300 transition-colors"
      >
        {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
      </button>

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
            disabled={isSaving || !activeProjectId}
            title="Kaydet (Ctrl+S)"
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              !activeProjectId
                ? 'text-gray-700 border border-transparent cursor-not-allowed'
                : hasUnsaved
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
      style={{ background: '#07090f', borderBottom: '1px solid #1e2535' }}
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
      {isAuthenticated && activeProjectId && (
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

  const EditorColumn = (
    <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
      <FileTabs
        files={files}
        activeFileId={activeFileId}
        onSelect={setActiveFile}
        onClose={removeFile}
      />
      <div className="flex-1 overflow-hidden">
        <EditorPane
          file={activeFile}
          theme={theme}
          wordWrap={wordWrap}
          onChange={updateActiveFile}
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
    <div className="flex flex-col h-full overflow-hidden" style={{ background: '#0d1117' }}>
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
            <PreviewPanel files={files} />
          </div>
        )}
      </div>

      {/* Mobile: projeler veya editör+önizleme dikey bölme */}
      <div className="sm:hidden flex-1 overflow-hidden">
        {mobilePanel === 'projects' && (
          <ProjectsSidebar {...sidebarProps} />
        )}
        {mobilePanel === 'editor' && (
          <div ref={mobileContentRef} className="flex flex-col h-full overflow-hidden">
            {/* Editör — önizleme açıksa sürüklenebilir, kapalıysa tüm ekran */}
            <div
              className="flex flex-col overflow-hidden shrink-0"
              style={{ height: mobileShowPreview ? `${mobileEditorPct}%` : '100%' }}
            >
              <FileTabs
                files={files}
                activeFileId={activeFileId}
                onSelect={setActiveFile}
                onClose={removeFile}
                mobileShowPreview={mobileShowPreview}
                onToggleMobilePreview={() => setMobileShowPreview((p) => !p)}
              />
              <div className="flex-1 overflow-hidden">
                <EditorPane
                  file={activeFile}
                  theme={theme}
                  wordWrap={wordWrap}
                  onChange={updateActiveFile}
                />
              </div>
            </div>

            {/* Sürükleme tutacağı + önizleme — sadece Önizleme açıkken */}
            {mobileShowPreview && (
              <>
                <div
                  className="h-3 shrink-0 flex items-center justify-center touch-none select-none cursor-row-resize transition-colors"
                  style={{ background: '#1e2535' }}
                  onPointerDown={handleMobileDragStart}
                  onPointerMove={handleMobileDragMove}
                  onPointerUp={handleMobileDragEnd}
                  onPointerCancel={handleMobileDragEnd}
                >
                  <GripHorizontal className="w-6 h-3 text-gray-600" />
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <PreviewPanel files={files} />
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
