import { useEffect, useMemo, useState, useRef } from 'react'
import {
  X, Plus, RotateCcw, GitCompare, Trash2, Clock, Tag, ChevronDown, ChevronUp,
  CheckCircle2, Loader2, Maximize2, Minimize2, Search, Pin, PinOff, FileCode,
  Eye, Download, FileText, Hash, ArrowLeft, Copy, Check, RefreshCw,
} from 'lucide-react'
import { projectVersionService, type ProjectVersion, type ProjectVersionFile } from '@services/projectVersionService'
import { fullDate, timeAgo } from '@utils/formatters'
import ProjectVersionDiffModal from './ProjectVersionDiffModal'
import toast from 'react-hot-toast'
import type { UiColors } from '@editor/themes'

interface Props {
  open: boolean
  onClose: () => void
  projectId: string | null
  projectTitle: string
  currentFiles: ProjectVersionFile[]
  onRestore: (files: ProjectVersionFile[], title: string) => void
  ui: UiColors
}

interface ProjectStats {
  fileCount: number
  lineCount: number
  byteCount: number
}

function computeStats(files: ProjectVersionFile[]): ProjectStats {
  let lineCount = 0
  let byteCount = 0
  for (const f of files) {
    const content = f.content ?? ''
    byteCount += content.length
    lineCount += content === '' ? 0 : content.split('\n').length
  }
  return { fileCount: files.length, lineCount, byteCount }
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n}B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`
  return `${(n / 1024 / 1024).toFixed(2)}MB`
}

function computeFilesChanged(oldFiles: ProjectVersionFile[], newFiles: ProjectVersionFile[]): number {
  let changed = 0
  for (const nf of newFiles) {
    const of_ = oldFiles.find((f) => f.name === nf.name)
    if (!of_ || of_.content !== nf.content) changed++
  }
  for (const of_ of oldFiles) {
    if (!newFiles.find((f) => f.name === of_.name)) changed++
  }
  return changed
}

function groupKey(date: Date): 'today' | 'yesterday' | 'week' | 'month' | 'older' {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const day = 24 * 60 * 60 * 1000
  const sameDay = now.toDateString() === date.toDateString()
  if (sameDay) return 'today'
  if (diff < 2 * day) return 'yesterday'
  if (diff < 7 * day) return 'week'
  if (diff < 30 * day) return 'month'
  return 'older'
}

const groupLabel: Record<string, string> = {
  today: 'Bugün', yesterday: 'Dün', week: 'Bu hafta', month: 'Bu ay', older: 'Daha eski',
}

const PIN_KEY = 'project-version-pins'

function loadPins(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch { return new Set<string>() }
}
function savePins(pins: Set<string>) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(Array.from(pins))) } catch { /* noop */ }
}

const MOBILE_QUERY = '(max-width: 767px)'

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(MOBILE_QUERY).matches
  })
  useEffect(() => {
    if (typeof window === 'undefined') return
    const mq = window.matchMedia(MOBILE_QUERY)
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isMobile
}

export default function ProjectVersionPanel({
  open, onClose, projectId, projectTitle, currentFiles, onRestore, ui,
}: Props) {
  const [versions,      setVersions]      = useState<ProjectVersion[]>([])
  const [loading,       setLoading]       = useState(false)
  const [saving,        setSaving]        = useState(false)
  const [labelInput,    setLabelInput]    = useState('')
  const [showSaveForm,  setShowSaveForm]  = useState(false)
  const [deleting,      setDeleting]      = useState<string | null>(null)
  const [restoring,     setRestoring]     = useState<string | null>(null)
  const [diffPair,      setDiffPair]      = useState<{ a: ProjectVersion; bFiles: ProjectVersionFile[]; rightLabel: string } | null>(null)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)

  const isMobile = useIsMobile()
  // Default fullscreen on all devices so tablet/desktop also gets the dual-pane view.
  // Users can click the minimize button to switch to compact side-panel.
  const [fullscreen, setFullscreen]   = useState<boolean>(true)
  const [search, setSearch]           = useState('')
  const [pins, setPins]               = useState<Set<string>>(() => loadPins())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewId, setPreviewId]     = useState<string | null>(null)
  const [previewFileIdx, setPreviewFileIdx] = useState(0)
  const [mobileView, setMobileView]   = useState<'list' | 'detail'>('list')
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)
  const [autoSave, setAutoSave]         = useState(false)
  const [lastAutoSave, setLastAutoSave] = useState<Date | null>(null)
  const currentFilesRef = useRef<ProjectVersionFile[]>(currentFiles)
  const filteredRef     = useRef<ProjectVersion[]>([])

  // On mobile, always run in fullscreen — the side-panel layout doesn't fit
  // the rich features the user expects to see at a glance.
  useEffect(() => { if (isMobile) setFullscreen(true) }, [isMobile])

  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !projectId) return
    setLoading(true)
    projectVersionService.getVersions(projectId)
      .then((rows) => {
        setVersions(rows)
        if (rows.length > 0) setPreviewId(rows[0].id)
      })
      .catch(() => toast.error('Versiyonlar yüklenemedi'))
      .finally(() => setLoading(false))
  }, [open, projectId])

  useEffect(() => {
    if (showSaveForm) setTimeout(() => labelRef.current?.focus(), 50)
  }, [showSaveForm])

  useEffect(() => {
    if (!open) { setSelectedIds([]); setSearch(''); setMobileView('list') }
  }, [open])

  useEffect(() => { setPreviewFileIdx(0) }, [previewId])

  // Keep refs in sync so callbacks don't close over stale values
  useEffect(() => { currentFilesRef.current = currentFiles }, [currentFiles])

  // Auto-save: save a version every 5 minutes when enabled
  useEffect(() => {
    if (!autoSave || !open || !projectId) return
    const handle = setInterval(async () => {
      try {
        const v = await projectVersionService.saveVersion({
          projectId,
          title: projectTitle || 'Başlıksız Proje',
          files: currentFilesRef.current.map((f) => ({
            id: f.id, name: f.name, language: f.language, content: f.content,
          })),
          label: 'Otomatik',
        })
        setVersions((prev) => [v, ...prev])
        setLastAutoSave(new Date())
      } catch { /* silent — auto-save failures are non-critical */ }
    }, 5 * 60 * 1000)
    return () => clearInterval(handle)
  }, [autoSave, open, projectId, projectTitle])

  // Keyboard navigation: ↑/↓ to browse versions in the list
  useEffect(() => {
    if (!open || !fullscreen) return
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return
      e.preventDefault()
      setPreviewId((prev) => {
        const list = filteredRef.current
        const idx  = list.findIndex((v) => v.id === prev)
        if (e.key === 'ArrowUp' && idx > 0) return list[idx - 1].id
        if (e.key === 'ArrowDown' && idx === -1 && list.length > 0) return list[0].id
        if (e.key === 'ArrowDown' && idx >= 0 && idx < list.length - 1) return list[idx + 1].id
        return prev
      })
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, fullscreen])


  const togglePin = (id: string) => {
    setPins((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      savePins(next)
      return next
    })
  }

  const handleSave = async () => {
    if (!projectId) { toast.error('Önce projeyi kaydet'); return }
    setSaving(true)
    try {
      const v = await projectVersionService.saveVersion({
        projectId,
        title: projectTitle || 'Başlıksız Proje',
        files: currentFiles.map((f) => ({
          id: f.id, name: f.name, language: f.language, content: f.content,
        })),
        label: labelInput.trim() || undefined,
      })
      setVersions((prev) => [v, ...prev])
      setLabelInput('')
      setShowSaveForm(false)
      toast.success('Versiyon kaydedildi')
    } catch (err) {
      toast.error((err as Error).message || 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  const handleRestore = async (v: ProjectVersion) => {
    if (!window.confirm(`v${v.versionNumber} versiyonuna geri dönmek istediğine emin misin? Kaydedilmemiş değişiklikler kaybolur.`)) return
    setRestoring(v.id)
    try {
      onRestore(v.files, v.title)
      toast.success(`v${v.versionNumber} yüklendi — kaydetmeyi unutma!`)
      onClose()
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (v: ProjectVersion) => {
    if (pins.has(v.id)) { toast.error('Sabitlenmiş versiyonu silemezsin'); return }
    if (!window.confirm(`v${v.versionNumber} versiyonunu silmek istediğine emin misin?`)) return
    setDeleting(v.id)
    try {
      await projectVersionService.deleteVersion(v.id)
      setVersions((prev) => prev.filter((x) => x.id !== v.id))
      if (previewId === v.id) setPreviewId(null)
      setSelectedIds((prev) => prev.filter((id) => id !== v.id))
      toast.success('Versiyon silindi')
    } catch {
      toast.error('Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const handleExport = (v: ProjectVersion) => {
    const data = {
      title: v.title, label: v.label,
      versionNumber: v.versionNumber, createdAt: v.createdAt,
      files: v.files.map((f) => ({ name: f.name, language: f.language, content: f.content })),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(v.title || 'project').slice(0, 40)}-v${v.versionNumber}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Versiyon indirildi')
  }

  const handleCopyFile = (content: string, id: string) => {
    navigator.clipboard.writeText(content ?? '').then(() => {
      setCopiedFileId(id)
      setTimeout(() => setCopiedFileId(null), 1500)
    })
  }

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const compareSelected = () => {
    if (selectedIds.length !== 2) return
    const sorted = [...selectedIds]
      .map((id) => versions.find((v) => v.id === id)!)
      .filter(Boolean)
      .sort((a, b) => a.versionNumber - b.versionNumber)
    if (sorted.length === 2) {
      setDiffPair({
        a: sorted[0],
        bFiles: sorted[1].files,
        rightLabel: `v${sorted[1].versionNumber}${sorted[1].label ? ` · ${sorted[1].label}` : ''}`,
      })
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return versions
    return versions.filter((v) =>
      (v.label ?? '').toLowerCase().includes(q) ||
      (v.title ?? '').toLowerCase().includes(q) ||
      `v${v.versionNumber}`.includes(q) ||
      v.files.some((f) => f.name.toLowerCase().includes(q))
    )
  }, [versions, search])

  const groups = useMemo(() => {
    const pinnedList = filtered.filter((v) => pins.has(v.id))
    const rest       = filtered.filter((v) => !pins.has(v.id))
    const buckets: Record<string, ProjectVersion[]> = {}
    for (const v of rest) {
      const key = groupKey(new Date(v.createdAt))
      ;(buckets[key] ??= []).push(v)
    }
    const order: Array<keyof typeof groupLabel> = ['today', 'yesterday', 'week', 'month', 'older']
    const out: Array<{ key: string; label: string; items: ProjectVersion[] }> = []
    if (pinnedList.length > 0) out.push({ key: 'pinned', label: 'Sabitlenmiş', items: pinnedList })
    for (const k of order) if (buckets[k]?.length) out.push({ key: k, label: groupLabel[k], items: buckets[k] })
    return out
  }, [filtered, pins])

  const previewVersion = useMemo(
    () => versions.find((v) => v.id === previewId) ?? null,
    [versions, previewId],
  )

  const previewStats = useMemo(
    () => previewVersion ? computeStats(previewVersion.files) : null,
    [previewVersion],
  )

  const currentStats = useMemo(() => computeStats(currentFiles), [currentFiles])

  // How many files changed between each version and the one before it
  const fileDiffs = useMemo(() => {
    const map = new Map<string, number>()
    for (let i = 0; i < versions.length; i++) {
      const curr = versions[i]
      const prev = versions[i + 1]
      if (prev) map.set(curr.id, computeFilesChanged(prev.files, curr.files))
    }
    return map
  }, [versions])

  // Keep filteredRef current so keyboard handler doesn't close over stale list
  filteredRef.current = filtered

  if (!open) return null

  const noProject = !projectId

  // ── Sub-renderers ─────────────────────────────────────────────────
  const renderHeader = () => {
    const showBack = isMobile && fullscreen && mobileView === 'detail'
    return (
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ borderBottom: `1px solid ${ui.border}` }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {showBack ? (
            <button
              onClick={() => setMobileView('list')}
              className="p-1.5 -ml-1.5 rounded transition-colors"
              style={{ color: ui.text }}
              title="Listeye dön"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          ) : (
            <Clock className="w-4 h-4" style={{ color: '#8aa8ff' }} />
          )}
          <h2 className="text-sm font-semibold truncate" style={{ color: ui.text }}>
            {showBack ? (previewVersion ? `v${previewVersion.versionNumber}` : 'Versiyon') : 'Versiyon Geçmişi'}
          </h2>
          {!showBack && versions.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full"
              style={{ background: ui.raisedBg, color: ui.textMuted }}
            >
              {versions.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Auto-save toggle */}
          {!showBack && !noProject && (
            <button
              onClick={() => setAutoSave((a) => !a)}
              className="p-1.5 rounded transition-colors"
              style={{ color: autoSave ? '#34d399' : ui.textMuted }}
              title={
                autoSave
                  ? `Otomatik kayıt aktif (5 dk'da bir)${lastAutoSave ? ` · Son: ${timeAgo(lastAutoSave)}` : ''} — kapatmak için tıkla`
                  : 'Otomatik kayıt (5 dk\'da bir)'
              }
            >
              <RefreshCw className="w-4 h-4" style={autoSave ? { animation: 'spin 3s linear infinite' } : {}} />
            </button>
          )}
          {!isMobile && (
            <button
              onClick={() => setFullscreen((f) => !f)}
              className="p-1.5 rounded transition-colors"
              style={{ color: ui.textMuted }}
              title={fullscreen ? 'Yan panele geç' : 'Tam ekran'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: ui.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  const renderSaveForm = () => (
    <div className="px-4 py-3 shrink-0" style={{ borderBottom: `1px solid ${ui.border}` }}>
      {showSaveForm ? (
        <div className="flex flex-col gap-2">
          <input
            ref={labelRef}
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave()
              if (e.key === 'Escape') setShowSaveForm(false)
            }}
            placeholder="Versiyon notu (opsiyonel)..."
            className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: ui.raisedBg,
              border: `1px solid ${ui.border}`,
              color: ui.text,
            }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || noProject}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-medium disabled:opacity-50 transition-colors"
              style={{ background: '#2a3a56', color: '#8aa8ff', border: '1px solid #3a4a6a' }}
            >
              {saving
                ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                : <><CheckCircle2 className="w-3.5 h-3.5" />Kaydet</>}
            </button>
            <button
              onClick={() => setShowSaveForm(false)}
              className="px-3 h-8 rounded-lg text-xs transition-colors"
              style={{ border: `1px solid ${ui.border}`, color: ui.textMuted }}
            >
              İptal
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (noProject) { toast.error('Önce projeyi kaydet'); return }
            setShowSaveForm(true)
          }}
          className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed text-xs transition-colors"
          style={{ borderColor: ui.border, color: ui.textMuted }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#8aa8ff'; e.currentTarget.style.color = '#8aa8ff' }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = ui.border; e.currentTarget.style.color = ui.textMuted }}
        >
          <Plus className="w-3.5 h-3.5" />
          Şu anki versiyonu kaydet
        </button>
      )}
    </div>
  )

  const renderRow = (v: ProjectVersion) => {
    const isExpanded = !fullscreen && expandedId === v.id
    const isPinned   = pins.has(v.id)
    const isSelected = selectedIds.includes(v.id)
    const isPreview  = fullscreen && previewId === v.id
    const stats      = computeStats(v.files)

    return (
      <li
        key={v.id}
        style={{ borderBottom: `1px solid ${ui.border}22` }}
      >
        <div
          className="flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer"
          style={{
            color: ui.text,
            background: isPreview ? 'rgba(138,168,255,0.08)' : 'transparent',
            outline: isSelected ? '1px solid rgba(138,168,255,0.5)' : 'none',
            outlineOffset: '-1px',
          }}
          onClick={() => {
            if (fullscreen) {
              setPreviewId(v.id)
              if (isMobile) setMobileView('detail')
            } else {
              setExpandedId(isExpanded ? null : v.id)
            }
          }}
          onMouseEnter={(e) => { if (!isPreview) e.currentTarget.style.background = ui.raisedBg }}
          onMouseLeave={(e) => { if (!isPreview) e.currentTarget.style.background = 'transparent' }}
        >
          {fullscreen && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); toggleSelect(v.id) }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 shrink-0 w-3.5 h-3.5"
              style={{ accentColor: '#8aa8ff' }}
              title="Karşılaştırmak için seç"
            />
          )}

          <span
            className="mt-0.5 shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
          >
            {v.versionNumber}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {v.label ? (
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#8aa8ff' }}>
                  <Tag className="w-3 h-3" />
                  {v.label}
                </span>
              ) : (
                <span className="text-xs" style={{ color: ui.textMuted }}>v{v.versionNumber}</span>
              )}
              {isPinned && <Pin className="w-3 h-3" style={{ color: '#fbbf24', fill: 'rgba(251,191,36,0.4)' }} />}
            </div>
            <p className="text-[11px] mt-0.5" style={{ color: ui.border }} title={fullDate(v.createdAt)}>
              {timeAgo(v.createdAt)}
            </p>
            <p className="text-xs mt-0.5 truncate" style={{ color: ui.textMuted }}>
              {stats.fileCount} dosya · {stats.lineCount} satır · {formatBytes(stats.byteCount)}
              {fileDiffs.get(v.id) !== undefined && (
                <span className="ml-1.5 text-[10px] font-medium" style={{ color: '#8aa8ff' }}>
                  · {fileDiffs.get(v.id)} değişik
                </span>
              )}
            </p>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); togglePin(v.id) }}
            className="p-1 rounded transition-colors"
            style={{ color: isPinned ? '#fbbf24' : ui.border }}
            title={isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

          {!fullscreen && (
            isExpanded
              ? <ChevronUp className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: ui.border }} />
              : <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: ui.border }} />
          )}
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            <button
              onClick={() => setDiffPair({ a: v, bFiles: currentFiles, rightLabel: 'Mevcut durum' })}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
              style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ui.text }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ui.textMuted }}
            >
              <GitCompare className="w-3.5 h-3.5 shrink-0" style={{ color: '#8aa8ff' }} />
              Bu versiyon ile mevcut durumu karşılaştır
            </button>

            <button
              onClick={() => handleRestore(v)}
              disabled={restoring === v.id}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-50 transition-colors"
              style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ui.text }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ui.textMuted }}
            >
              {restoring === v.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                : <RotateCcw className="w-3.5 h-3.5 shrink-0" style={{ color: '#fbbf24' }} />}
              Bu versiyona geri dön
            </button>

            <button
              onClick={() => handleExport(v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
              style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
              onMouseEnter={(e) => { e.currentTarget.style.color = ui.text }}
              onMouseLeave={(e) => { e.currentTarget.style.color = ui.textMuted }}
            >
              <Download className="w-3.5 h-3.5 shrink-0" style={{ color: '#34d399' }} />
              JSON olarak indir
            </button>

            <button
              onClick={() => handleDelete(v)}
              disabled={deleting === v.id || pins.has(v.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs disabled:opacity-50 transition-colors"
              style={{ border: '1px solid transparent', color: ui.border }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'
                e.currentTarget.style.color = '#f87171'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'transparent'
                e.currentTarget.style.color = ui.border
              }}
            >
              {deleting === v.id
                ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                : <Trash2 className="w-3.5 h-3.5 shrink-0" />}
              Versiyonu sil{pins.has(v.id) ? ' (sabitli)' : ''}
            </button>
          </div>
        )}
      </li>
    )
  }

  const renderList = () => (
    <>
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: ui.textMuted }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: ui.border }} />
          <p className="text-sm font-medium" style={{ color: ui.textMuted }}>
            {search ? 'Eşleşen versiyon yok' : 'Henüz versiyon yok'}
          </p>
          <p className="text-xs mt-1" style={{ color: ui.border }}>
            {search ? 'Aramayı değiştirmeyi dene' : (noProject ? 'Projeyi kaydet, sonra versiyon ekle' : 'Yukarıdan ilk versiyonunu kaydet')}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((g) => (
            <div key={g.key}>
              <div
                className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sticky top-0 backdrop-blur-sm flex items-center gap-1.5 z-10"
                style={{
                  color: ui.textMuted,
                  background: `${ui.panelBg}cc`,
                  borderBottom: `1px solid ${ui.border}66`,
                }}
              >
                {g.key === 'pinned' && <Pin className="w-3 h-3" style={{ color: '#fbbf24' }} />}
                {g.label}
                <span style={{ color: ui.border }}>· {g.items.length}</span>
              </div>
              <ul>
                {g.items.map(renderRow)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  )

  // ── Side-panel layout ─────────────────────────────────────────────
  if (!fullscreen) {
    return (
      <>
        <div
          className="fixed inset-0 z-[60]"
          style={{ background: 'rgba(0,0,0,0.6)' }}
          onClick={onClose}
        />
        <div
          className="fixed z-[70] flex flex-col
            bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]
            md:top-0 md:right-0 md:bottom-0 md:left-auto md:rounded-none md:w-96 md:max-h-none"
          style={{ background: ui.panelBg, borderColor: ui.border, borderTop: `1px solid ${ui.border}` }}
        >
          <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full" style={{ background: ui.border }} />
          </div>
          {renderHeader()}
          {renderSaveForm()}
          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {renderList()}
          </div>
          {versions.length > 0 && (
            <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${ui.border}` }}>
              <p className="text-[10px] text-center" style={{ color: ui.border }}>
                Son {Math.min(versions.length, 50)} versiyon saklanır
              </p>
            </div>
          )}
        </div>

        {diffPair && (
          <ProjectVersionDiffModal
            open={!!diffPair}
            onClose={() => setDiffPair(null)}
            versionA={diffPair.a}
            currentFiles={diffPair.bFiles}
            rightLabel={diffPair.rightLabel}
            ui={ui}
          />
        )}
      </>
    )
  }

  // ── Fullscreen layout ─────────────────────────────────────────────
  const previewFile = previewVersion?.files[previewFileIdx] ?? null

  return (
    <>
      <div
        className="fixed inset-0 z-[70] flex flex-col"
        style={{ background: ui.panelBg }}
      >
        {renderHeader()}

        {/* Toolbar — hidden on mobile detail view */}
        <div
          className={`items-center gap-2 px-4 py-2 shrink-0 flex-wrap ${
            isMobile && mobileView === 'detail' ? 'hidden' : 'flex'
          }`}
          style={{ borderBottom: `1px solid ${ui.border}` }}
        >
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: ui.border }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Etiket, başlık, versiyon veya dosya adına göre ara..."
              className="w-full pl-8 pr-3 h-8 rounded-lg text-xs outline-none transition-colors"
              style={{
                background: ui.raisedBg,
                border: `1px solid ${ui.border}`,
                color: ui.text,
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] hidden sm:inline" style={{ color: ui.border }}>
              {selectedIds.length}/2 seçildi
            </span>
            <button
              onClick={compareSelected}
              disabled={selectedIds.length !== 2}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              style={{ background: '#2a3a56', color: '#8aa8ff', border: '1px solid #3a4a6a' }}
            >
              <GitCompare className="w-3.5 h-3.5" />
              Seçilenleri karşılaştır
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="h-8 px-3 rounded-lg text-xs transition-colors"
                style={{ border: `1px solid ${ui.border}`, color: ui.textMuted }}
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: list — full width on mobile list view, fixed width on desktop, hidden on mobile detail view */}
          <div
            className={`flex-col shrink-0 ${
              isMobile
                ? (mobileView === 'list' ? 'flex w-full' : 'hidden')
                : 'flex w-full md:w-96 lg:w-[380px]'
            }`}
            style={{ borderRight: isMobile ? undefined : `1px solid ${ui.border}` }}
          >
            {renderSaveForm()}
            <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
              {renderList()}
            </div>
            {versions.length > 0 && (
              <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${ui.border}` }}>
                <p className="text-[10px] text-center" style={{ color: ui.border }}>
                  Son {Math.min(versions.length, 50)} versiyon · Sabitlenenler her zaman üstte
                </p>
              </div>
            )}
          </div>

          {/* Right: detail / preview — full width on mobile detail, side pane on desktop */}
          <div className={`flex-1 flex-col overflow-hidden ${
            isMobile
              ? (mobileView === 'detail' ? 'flex' : 'hidden')
              : 'hidden md:flex'
          }`}>
            {previewVersion ? (
              <>
                <div className="px-4 sm:px-6 py-3 sm:py-4 shrink-0" style={{ borderBottom: `1px solid ${ui.border}` }}>
                  <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[11px] px-2 py-0.5 rounded-full font-mono"
                          style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
                        >
                          v{previewVersion.versionNumber}
                        </span>
                        {previewVersion.label && (
                          <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#8aa8ff' }}>
                            <Tag className="w-3 h-3" />{previewVersion.label}
                          </span>
                        )}
                        {pins.has(previewVersion.id) && (
                          <span className="flex items-center gap-1 text-[10px]" style={{ color: '#fbbf24' }}>
                            <Pin className="w-3 h-3" style={{ fill: 'rgba(251,191,36,0.4)' }} />Sabit
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold mt-1.5 line-clamp-2" style={{ color: ui.text }}>
                        {previewVersion.title || 'Başlıksız'}
                      </h3>
                      <p className="text-[11px] mt-1" style={{ color: ui.border }}>
                        {fullDate(previewVersion.createdAt)} · {timeAgo(previewVersion.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 flex-wrap w-full sm:w-auto">
                      <button
                        onClick={() => setDiffPair({ a: previewVersion, bFiles: currentFiles, rightLabel: 'Mevcut durum' })}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-colors"
                        style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = ui.text }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = ui.textMuted }}
                      >
                        <GitCompare className="w-3.5 h-3.5" style={{ color: '#8aa8ff' }} />
                        <span className="hidden sm:inline">Mevcutla karşılaştır</span>
                        <span className="sm:hidden">Karşılaştır</span>
                      </button>
                      <button
                        onClick={() => handleRestore(previewVersion)}
                        disabled={restoring === previewVersion.id}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs disabled:opacity-50 transition-colors"
                        style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
                      >
                        {restoring === previewVersion.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <RotateCcw className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                        Geri yükle
                      </button>
                      <button
                        onClick={() => handleExport(previewVersion)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-colors"
                        style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
                      >
                        <Download className="w-3.5 h-3.5" style={{ color: '#34d399' }} />
                        İndir
                      </button>
                      <button
                        onClick={() => togglePin(previewVersion.id)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs transition-colors"
                        style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.textMuted }}
                        title={pins.has(previewVersion.id) ? 'Sabitlemeyi kaldır' : 'Sabitle'}
                      >
                        {pins.has(previewVersion.id)
                          ? <PinOff className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />
                          : <Pin className="w-3.5 h-3.5" style={{ color: '#fbbf24' }} />}
                        <span className="hidden sm:inline">{pins.has(previewVersion.id) ? 'Çıkar' : 'Sabitle'}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(previewVersion)}
                        disabled={deleting === previewVersion.id || pins.has(previewVersion.id)}
                        className="flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs disabled:opacity-40 transition-colors ml-auto sm:ml-0"
                        style={{ border: '1px solid transparent', color: ui.border }}
                        title={pins.has(previewVersion.id) ? 'Sabitlenmiş versiyon silinemez' : 'Sil'}
                      >
                        {deleting === previewVersion.id
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stats compared to current */}
                  {previewStats && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <StatBadge ui={ui} icon={<FileCode className="w-3 h-3" />} label="Dosya" value={previewStats.fileCount} delta={previewStats.fileCount - currentStats.fileCount} />
                      <StatBadge ui={ui} icon={<Hash className="w-3 h-3" />} label="Satır" value={previewStats.lineCount} delta={previewStats.lineCount - currentStats.lineCount} />
                      <StatBadge ui={ui} icon={<FileText className="w-3 h-3" />} label="Boyut" value={formatBytes(previewStats.byteCount)} deltaText={
                        previewStats.byteCount === currentStats.byteCount
                          ? '±0'
                          : (previewStats.byteCount > currentStats.byteCount
                              ? `+${formatBytes(previewStats.byteCount - currentStats.byteCount)}`
                              : `-${formatBytes(currentStats.byteCount - previewStats.byteCount)}`)
                      } deltaColor={
                        previewStats.byteCount > currentStats.byteCount ? '#4ade80'
                          : previewStats.byteCount < currentStats.byteCount ? '#f87171'
                          : ui.border
                      } />
                      <span className="text-[10px]" style={{ color: ui.border }}>(mevcut duruma göre fark)</span>
                    </div>
                  )}
                </div>

                {/* File tabs */}
                {previewVersion.files.length > 0 && (
                  <div
                    className="flex items-center gap-1 px-3 py-2 overflow-x-auto shrink-0"
                    style={{ borderBottom: `1px solid ${ui.border}`, scrollbarWidth: 'none' }}
                  >
                    {previewVersion.files.map((f, idx) => (
                      <button
                        key={f.id || `${f.name}-${idx}`}
                        onClick={() => setPreviewFileIdx(idx)}
                        className="px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all flex items-center gap-1.5"
                        style={previewFileIdx === idx
                          ? { background: ui.raisedBg, color: ui.text, border: `1px solid ${ui.border}` }
                          : { color: ui.textMuted, border: '1px solid transparent' }}
                      >
                        <FileCode className="w-3 h-3" />
                        {f.name}
                      </button>
                    ))}
                  </div>
                )}

                {/* File content */}
                <div className="flex-1 overflow-auto relative">
                  {previewFile ? (
                    <>
                      <button
                        onClick={() => handleCopyFile(previewFile.content || '', previewFile.id || previewFile.name)}
                        className="absolute top-3 right-3 z-10 flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors"
                        style={{
                          background: ui.raisedBg,
                          border: `1px solid ${ui.border}`,
                          color: copiedFileId === (previewFile.id || previewFile.name) ? '#34d399' : ui.textMuted,
                        }}
                        title="Kodu kopyala"
                      >
                        {copiedFileId === (previewFile.id || previewFile.name)
                          ? <><Check className="w-3 h-3" /> Kopyalandı</>
                          : <><Copy className="w-3 h-3" /> Kopyala</>}
                      </button>
                      <pre
                        className="font-mono text-[12px] leading-5 p-4 m-0 pt-10"
                        style={{ color: ui.text }}
                      >
                        <code>{previewFile.content || '(boş)'}</code>
                      </pre>
                    </>
                  ) : (
                    <div className="flex items-center justify-center py-16 text-sm" style={{ color: ui.textMuted }}>
                      Bu versiyonda dosya yok
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center" style={{ color: ui.border }}>
                <Eye className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Önizlemek için soldan bir versiyon seç</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {diffPair && (
        <ProjectVersionDiffModal
          open={!!diffPair}
          onClose={() => setDiffPair(null)}
          versionA={diffPair.a}
          currentFiles={diffPair.bFiles}
          rightLabel={diffPair.rightLabel}
          ui={ui}
        />
      )}
    </>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────
function StatBadge({
  ui, icon, label, value, delta, deltaText, deltaColor,
}: {
  ui: UiColors
  icon: React.ReactNode
  label: string
  value: number | string
  delta?: number
  deltaText?: string
  deltaColor?: string
}) {
  let text  = deltaText
  let color = deltaColor
  if (text === undefined && delta !== undefined) {
    text  = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0'
    color = delta > 0 ? '#4ade80' : delta < 0 ? '#f87171' : ui.border
  }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md"
      style={{ background: ui.raisedBg, border: `1px solid ${ui.border}`, color: ui.text }}
    >
      <span style={{ color: ui.textMuted }}>{icon}</span>
      <span className="font-medium">{value}</span>
      <span style={{ color: ui.border }}>{label}</span>
      {text && <span className="font-mono" style={{ color }}>{text}</span>}
    </span>
  )
}
