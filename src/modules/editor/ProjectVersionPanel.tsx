import { useEffect, useState, useRef } from 'react'
import { X, Plus, RotateCcw, GitCompare, Trash2, Clock, Tag, ChevronDown, ChevronUp, CheckCircle2, Loader2 } from 'lucide-react'
import { projectVersionService, type ProjectVersion, type ProjectVersionFile } from '@services/projectVersionService'
import { timeAgo } from '@utils/formatters'
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
  const [diffVersion,   setDiffVersion]   = useState<ProjectVersion | null>(null)
  const [expandedId,    setExpandedId]    = useState<string | null>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !projectId) return
    setLoading(true)
    projectVersionService.getVersions(projectId)
      .then(setVersions)
      .catch(() => toast.error('Versiyonlar yüklenemedi'))
      .finally(() => setLoading(false))
  }, [open, projectId])

  useEffect(() => {
    if (showSaveForm) setTimeout(() => labelRef.current?.focus(), 50)
  }, [showSaveForm])

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
    if (!window.confirm(`v${v.versionNumber} versiyonunu silmek istediğine emin misin?`)) return
    setDeleting(v.id)
    try {
      await projectVersionService.deleteVersion(v.id)
      setVersions((prev) => prev.filter((x) => x.id !== v.id))
      toast.success('Versiyon silindi')
    } catch {
      toast.error('Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  if (!open) return null

  const noProject = !projectId

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ background: 'rgba(0,0,0,0.6)' }}
        onClick={onClose}
      />

      {/* Panel: mobile = bottom sheet, desktop = right side */}
      <div
        className="fixed z-[70] flex flex-col
          bottom-0 left-0 right-0 rounded-t-2xl max-h-[85vh]
          lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto lg:rounded-none lg:w-80 lg:max-h-none"
        style={{ background: ui.panelBg, borderColor: ui.border, borderTop: `1px solid ${ui.border}` }}
      >
        {/* Handle (mobile) */}
        <div className="lg:hidden flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: ui.border }} />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${ui.border}` }}
        >
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" style={{ color: '#8aa8ff' }} />
            <h2 className="text-sm font-semibold" style={{ color: ui.text }}>
              Versiyon Geçmişi
            </h2>
            {versions.length > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{ background: ui.raisedBg, color: ui.textMuted }}
              >
                {versions.length}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: ui.textMuted }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save form */}
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

        {/* Version list */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: ui.textMuted }} />
            </div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: ui.border }} />
              <p className="text-sm font-medium" style={{ color: ui.textMuted }}>Henüz versiyon yok</p>
              <p className="text-xs mt-1" style={{ color: ui.border }}>
                {noProject ? 'Projeyi kaydet, sonra versiyon ekle' : 'Yukarıdan ilk versiyonunu kaydet'}
              </p>
            </div>
          ) : (
            <ul>
              {versions.map((v) => {
                const isExpanded = expandedId === v.id
                return (
                  <li
                    key={v.id}
                    style={{ borderBottom: `1px solid ${ui.border}22` }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 text-left transition-colors"
                      style={{ color: ui.text }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = ui.raisedBg }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    >
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
                        </div>
                        <p className="text-[11px] mt-0.5" style={{ color: ui.border }}>
                          {timeAgo(v.createdAt)}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: ui.textMuted }}>
                          {v.files.length} dosya
                          {v.files.length > 0 && ` · ${v.files.map((f) => f.name).join(', ')}`}
                        </p>
                      </div>

                      {isExpanded
                        ? <ChevronUp   className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: ui.border }} />
                        : <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-1" style={{ color: ui.border }} />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-3 flex flex-col gap-2">
                        <button
                          onClick={() => setDiffVersion(v)}
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
                          onClick={() => handleDelete(v)}
                          disabled={deleting === v.id}
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
                          Versiyonu sil
                        </button>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {versions.length > 0 && (
          <div className="px-4 py-2 shrink-0" style={{ borderTop: `1px solid ${ui.border}` }}>
            <p className="text-[10px] text-center" style={{ color: ui.border }}>
              Son {Math.min(versions.length, 50)} versiyon saklanır
            </p>
          </div>
        )}
      </div>

      {diffVersion && (
        <ProjectVersionDiffModal
          open={!!diffVersion}
          onClose={() => setDiffVersion(null)}
          versionA={diffVersion}
          currentFiles={currentFiles}
          ui={ui}
        />
      )}
    </>
  )
}
