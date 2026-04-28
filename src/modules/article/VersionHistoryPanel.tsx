import { useEffect, useState, useRef } from 'react'
import { X, Plus, RotateCcw, GitCompare, Trash2, Clock, Tag, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react'
import Spinner from '@components/ui/Spinner'
import { articleVersionService, type ArticleVersion } from '@services/articleVersionService'
import { useArticleStore } from '@store/articleStore'
import { timeAgo } from '@utils/formatters'
import VersionDiffModal from './VersionDiffModal'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

export default function VersionHistoryPanel({ open, onClose }: Props) {
  const { supabaseId, title, subtitle, coverImage, blocks, loadArticle } = useArticleStore()

  const [versions, setVersions]     = useState<ArticleVersion[]>([])
  const [loading, setLoading]       = useState(false)
  const [saving, setSaving]         = useState(false)
  const [labelInput, setLabelInput] = useState('')
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [deleting, setDeleting]     = useState<string | null>(null)
  const [restoring, setRestoring]   = useState<string | null>(null)
  const [diffVersion, setDiffVersion] = useState<ArticleVersion | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !supabaseId) return
    setLoading(true)
    articleVersionService.getVersions(supabaseId)
      .then(setVersions)
      .catch(() => toast.error('Versiyonlar yüklenemedi'))
      .finally(() => setLoading(false))
  }, [open, supabaseId])

  useEffect(() => {
    if (showSaveForm) setTimeout(() => labelRef.current?.focus(), 50)
  }, [showSaveForm])

  const handleSave = async () => {
    if (!supabaseId) { toast.error('Önce makaleyi kaydet'); return }
    setSaving(true)
    try {
      const v = await articleVersionService.saveVersion({
        articleId:  supabaseId,
        title:      title || 'Başlıksız Makale',
        subtitle,
        coverImage,
        blocks,
        label:      labelInput.trim() || undefined,
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

  const handleRestore = async (v: ArticleVersion) => {
    if (!window.confirm(`v${v.versionNumber} versiyonuna geri dönmek istediğine emin misin? Kaydedilmemiş değişiklikler kaybolur.`)) return
    setRestoring(v.id)
    try {
      // Load version content into store
      loadArticle({
        id:          supabaseId!,
        authorId:    '',
        title:       v.title,
        subtitle:    v.subtitle,
        coverImage:  v.coverImage,
        blocks:      v.blocks,
        isPublished: false,
        viewsCount:  0,
        likesCount:  0,
        savesCount:  0,
        commentsCount: 0,
        isLiked:     false,
        isSaved:     false,
        createdAt:   '',
        updatedAt:   '',
      })
      toast.success(`v${v.versionNumber} yüklendi — kaydetmeyi unutma!`)
      onClose()
    } catch {
      toast.error('Geri yükleme başarısız')
    } finally {
      setRestoring(null)
    }
  }

  const handleDelete = async (v: ArticleVersion) => {
    if (!window.confirm(`v${v.versionNumber} versiyonunu silmek istediğine emin misin?`)) return
    setDeleting(v.id)
    try {
      await articleVersionService.deleteVersion(v.id)
      setVersions((prev) => prev.filter((x) => x.id !== v.id))
      toast.success('Versiyon silindi')
    } catch {
      toast.error('Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`
        fixed z-50 bg-surface border-surface-border shadow-2xl flex flex-col
        /* Mobile: bottom sheet */
        bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[85vh]
        /* Desktop: right side panel */
        lg:top-14 lg:right-0 lg:bottom-0 lg:left-auto lg:rounded-none lg:rounded-l-xl
        lg:border-l lg:border-t-0 lg:w-80 lg:max-h-none
        transition-transform duration-300
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <h2 className="text-sm font-semibold text-white">Versiyon Geçmişi</h2>
            {versions.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-surface-raised text-gray-400">
                {versions.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Save form */}
        <div className="px-4 py-3 border-b border-surface-border shrink-0">
          {showSaveForm ? (
            <div className="flex flex-col gap-2">
              <input
                ref={labelRef}
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setShowSaveForm(false) }}
                placeholder="Versiyon notu (opsiyonel)..."
                className="w-full px-3 py-2 rounded-lg bg-surface-raised border border-surface-border text-white text-sm placeholder:text-gray-600 outline-none focus:border-brand-500 transition-colors"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !supabaseId}
                  className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-50 transition-colors"
                >
                  {saving ? <Spinner size="sm" /> : <><CheckCircle2 className="w-3.5 h-3.5" />Kaydet</>}
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-3 h-8 rounded-lg border border-surface-border text-gray-400 hover:text-white text-xs transition-colors"
                >
                  İptal
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { if (!supabaseId) { toast.error('Önce makaleyi kaydet'); return } setShowSaveForm(true) }}
              className="w-full flex items-center justify-center gap-2 h-8 rounded-lg border border-dashed border-surface-border hover:border-brand-500 text-gray-500 hover:text-brand-400 text-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Şu anki versiyonu kaydet
            </button>
          )}
        </div>

        {/* Version list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : versions.length === 0 ? (
            <div className="text-center py-10 px-4">
              <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
              <p className="text-sm text-gray-500 font-medium">Henüz versiyon yok</p>
              <p className="text-xs text-gray-600 mt-1">Yukarıdan ilk versiyonunu kaydet</p>
            </div>
          ) : (
            <ul className="divide-y divide-surface-border">
              {versions.map((v) => {
                const isExpanded = expandedId === v.id
                return (
                  <li key={v.id} className="group">
                    {/* Version row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : v.id)}
                      className="w-full flex items-start gap-3 px-4 py-3 hover:bg-surface-raised transition-colors text-left"
                    >
                      {/* Version number badge */}
                      <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center text-[10px] font-bold text-gray-400">
                        {v.versionNumber}
                      </span>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {v.label && (
                            <span className="flex items-center gap-1 text-xs text-brand-300 font-medium">
                              <Tag className="w-3 h-3" />
                              {v.label}
                            </span>
                          )}
                          {!v.label && (
                            <span className="text-xs text-gray-500">v{v.versionNumber}</span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5">{timeAgo(v.createdAt)}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{v.title || 'Başlıksız'}</p>
                      </div>

                      {isExpanded
                        ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-1" />
                        : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-1" />
                      }
                    </button>

                    {/* Expanded actions */}
                    {isExpanded && (
                      <div className="px-4 pb-3 flex flex-col gap-2">
                        <button
                          onClick={() => setDiffVersion(v)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white transition-colors"
                        >
                          <GitCompare className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                          Bu versiyon ile mevcut durumu karşılaştır
                        </button>
                        <button
                          onClick={() => handleRestore(v)}
                          disabled={restoring === v.id}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                        >
                          {restoring === v.id
                            ? <Spinner size="sm" />
                            : <RotateCcw className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                          }
                          Bu versiyona geri dön
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          disabled={deleting === v.id}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs text-gray-600 hover:text-red-400 disabled:opacity-50 transition-colors"
                        >
                          {deleting === v.id
                            ? <Spinner size="sm" />
                            : <Trash2 className="w-3.5 h-3.5 shrink-0" />
                          }
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

        {/* Footer info */}
        {versions.length > 0 && (
          <div className="px-4 py-2 border-t border-surface-border shrink-0">
            <p className="text-[10px] text-gray-700 text-center">
              Son {Math.min(versions.length, 50)} versiyon saklanır
            </p>
          </div>
        )}
      </div>

      {/* Diff modal */}
      {diffVersion && (
        <VersionDiffModal
          open={!!diffVersion}
          onClose={() => setDiffVersion(null)}
          versionA={diffVersion}
          versionB="current"
          currentTitle={title}
          currentSubtitle={subtitle}
          currentBlocks={blocks}
        />
      )}
    </>
  )
}
