import { useEffect, useMemo, useState, useRef } from 'react'
import {
  X, Plus, RotateCcw, GitCompare, Trash2, Clock, Tag, ChevronDown, ChevronUp,
  CheckCircle2, Maximize2, Minimize2, Search, Pin, PinOff, FileText, Image as ImageIcon,
  Code2, BookOpen, Eye, Download,
} from 'lucide-react'
import Spinner from '@components/ui/Spinner'
import { articleVersionService, type ArticleVersion } from '@services/articleVersionService'
import { useArticleStore, type ArticleBlock } from '@store/articleStore'
import { fullDate, timeAgo } from '@utils/formatters'
import VersionDiffModal from './VersionDiffModal'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
}

interface VersionStats {
  blockCount: number
  wordCount: number
  charCount: number
  imageCount: number
  codeCount: number
}

function computeStats(blocks: ArticleBlock[]): VersionStats {
  let wordCount = 0
  let charCount = 0
  let imageCount = 0
  let codeCount = 0
  for (const b of blocks) {
    if (b.type === 'image') imageCount++
    if (b.type === 'code') codeCount++
    const raw = (b.content ?? b.code ?? b.caption ?? '').replace(/<[^>]*>/g, '')
    charCount += raw.length
    if (raw.trim()) wordCount += raw.trim().split(/\s+/).length
  }
  return { blockCount: blocks.length, wordCount, charCount, imageCount, codeCount }
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
  today:     'Bugün',
  yesterday: 'Dün',
  week:      'Bu hafta',
  month:     'Bu ay',
  older:     'Daha eski',
}

const PIN_KEY = 'article-version-pins'

function loadPins(): Set<string> {
  try {
    const raw = localStorage.getItem(PIN_KEY)
    return new Set<string>(raw ? JSON.parse(raw) : [])
  } catch {
    return new Set<string>()
  }
}

function savePins(pins: Set<string>) {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(Array.from(pins))) } catch { /* noop */ }
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
  const [diffPair, setDiffPair]     = useState<{ a: ArticleVersion; b: ArticleVersion | 'current' } | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [fullscreen, setFullscreen] = useState(false)
  const [search, setSearch]         = useState('')
  const [pins, setPins]             = useState<Set<string>>(() => loadPins())
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [previewId, setPreviewId]   = useState<string | null>(null)

  const labelRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open || !supabaseId) return
    setLoading(true)
    articleVersionService.getVersions(supabaseId)
      .then((rows) => {
        setVersions(rows)
        if (rows.length > 0) setPreviewId(rows[0].id)
      })
      .catch(() => toast.error('Versiyonlar yüklenemedi'))
      .finally(() => setLoading(false))
  }, [open, supabaseId])

  useEffect(() => {
    if (showSaveForm) setTimeout(() => labelRef.current?.focus(), 50)
  }, [showSaveForm])

  // Reset compare selection on close
  useEffect(() => {
    if (!open) { setSelectedIds([]); setSearch('') }
  }, [open])

  const togglePin = (id: string) => {
    setPins((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      savePins(next)
      return next
    })
  }

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
    if (pins.has(v.id)) { toast.error('Sabitlenmiş versiyonu silemezsin'); return }
    if (!window.confirm(`v${v.versionNumber} versiyonunu silmek istediğine emin misin?`)) return
    setDeleting(v.id)
    try {
      await articleVersionService.deleteVersion(v.id)
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

  const handleExport = (v: ArticleVersion) => {
    const data = {
      title: v.title, subtitle: v.subtitle, coverImage: v.coverImage,
      blocks: v.blocks, label: v.label, versionNumber: v.versionNumber,
      createdAt: v.createdAt,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(v.title || 'article').slice(0, 40)}-v${v.versionNumber}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Versiyon indirildi')
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
    if (sorted.length === 2) setDiffPair({ a: sorted[0], b: sorted[1] })
  }

  // ── Filtering + grouping ──────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return versions
    return versions.filter((v) =>
      (v.label ?? '').toLowerCase().includes(q) ||
      (v.title ?? '').toLowerCase().includes(q) ||
      `v${v.versionNumber}`.includes(q)
    )
  }, [versions, search])

  const groups = useMemo(() => {
    const pinnedList = filtered.filter((v) => pins.has(v.id))
    const rest       = filtered.filter((v) => !pins.has(v.id))
    const buckets: Record<string, ArticleVersion[]> = {}
    for (const v of rest) {
      const key = groupKey(new Date(v.createdAt))
      ;(buckets[key] ??= []).push(v)
    }
    const order: Array<keyof typeof groupLabel> = ['today', 'yesterday', 'week', 'month', 'older']
    const out: Array<{ key: string; label: string; items: ArticleVersion[] }> = []
    if (pinnedList.length > 0) out.push({ key: 'pinned', label: 'Sabitlenmiş', items: pinnedList })
    for (const k of order) if (buckets[k]?.length) out.push({ key: k, label: groupLabel[k], items: buckets[k] })
    return out
  }, [filtered, pins])

  const previewVersion = useMemo(
    () => versions.find((v) => v.id === previewId) ?? null,
    [versions, previewId],
  )

  const previewStats = useMemo(
    () => previewVersion ? computeStats(previewVersion.blocks) : null,
    [previewVersion],
  )

  const currentStats = useMemo(() => computeStats(blocks), [blocks])

  if (!open) return null

  // ── Sub-renderers ─────────────────────────────────────────────────
  const renderSaveForm = () => (
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
  )

  const renderVersionRow = (v: ArticleVersion) => {
    const isExpanded = !fullscreen && expandedId === v.id
    const isPinned   = pins.has(v.id)
    const isSelected = selectedIds.includes(v.id)
    const isPreview  = fullscreen && previewId === v.id
    const stats      = computeStats(v.blocks)

    return (
      <li key={v.id} className="group">
        <div
          className={`
            relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer
            ${isPreview ? 'bg-brand-500/10' : 'hover:bg-surface-raised'}
            ${isSelected ? 'ring-1 ring-inset ring-brand-500/60' : ''}
          `}
          onClick={() => {
            if (fullscreen) setPreviewId(v.id)
            else setExpandedId(isExpanded ? null : v.id)
          }}
        >
          {fullscreen && (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => { e.stopPropagation(); toggleSelect(v.id) }}
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 shrink-0 w-3.5 h-3.5 accent-brand-500"
              title="Karşılaştırmak için seç"
            />
          )}

          <span className="mt-0.5 shrink-0 w-7 h-7 rounded-full bg-surface-raised border border-surface-border flex items-center justify-center text-[10px] font-bold text-gray-400">
            {v.versionNumber}
          </span>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {v.label ? (
                <span className="flex items-center gap-1 text-xs text-brand-300 font-medium">
                  <Tag className="w-3 h-3" />
                  {v.label}
                </span>
              ) : (
                <span className="text-xs text-gray-500">v{v.versionNumber}</span>
              )}
              {isPinned && <Pin className="w-3 h-3 text-amber-400 fill-amber-400/40" />}
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5" title={fullDate(v.createdAt)}>
              {timeAgo(v.createdAt)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{v.title || 'Başlıksız'}</p>

            {/* Stats badges */}
            <div className="flex items-center gap-2 mt-1.5 text-[10px] text-gray-600">
              <span className="flex items-center gap-1" title="Blok"><BookOpen className="w-3 h-3" />{stats.blockCount}</span>
              <span className="flex items-center gap-1" title="Kelime"><FileText className="w-3 h-3" />{stats.wordCount}</span>
              {stats.imageCount > 0 && <span className="flex items-center gap-1" title="Görsel"><ImageIcon className="w-3 h-3" />{stats.imageCount}</span>}
              {stats.codeCount > 0 && <span className="flex items-center gap-1" title="Kod"><Code2 className="w-3 h-3" />{stats.codeCount}</span>}
            </div>
          </div>

          <button
            onClick={(e) => { e.stopPropagation(); togglePin(v.id) }}
            className="p-1 rounded text-gray-600 hover:text-amber-400 transition-colors"
            title={isPinned ? 'Sabitlemeyi kaldır' : 'Sabitle'}
          >
            {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          </button>

          {!fullscreen && (
            isExpanded
              ? <ChevronUp className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-1" />
              : <ChevronDown className="w-3.5 h-3.5 text-gray-600 shrink-0 mt-1" />
          )}
        </div>

        {isExpanded && (
          <div className="px-4 pb-3 flex flex-col gap-2">
            <button
              onClick={() => setDiffPair({ a: v, b: 'current' })}
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
              {restoring === v.id ? <Spinner size="sm" /> : <RotateCcw className="w-3.5 h-3.5 text-yellow-400 shrink-0" />}
              Bu versiyona geri dön
            </button>
            <button
              onClick={() => handleExport(v)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              JSON olarak indir
            </button>
            <button
              onClick={() => handleDelete(v)}
              disabled={deleting === v.id || pins.has(v.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs text-gray-600 hover:text-red-400 disabled:opacity-50 transition-colors"
            >
              {deleting === v.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5 shrink-0" />}
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
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 px-4">
          <Clock className="w-8 h-8 mx-auto mb-2 text-gray-700" />
          <p className="text-sm text-gray-500 font-medium">
            {search ? 'Eşleşen versiyon yok' : 'Henüz versiyon yok'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {search ? 'Aramayı değiştirmeyi dene' : 'Yukarıdan ilk versiyonunu kaydet'}
          </p>
        </div>
      ) : (
        <div>
          {groups.map((g) => (
            <div key={g.key}>
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-600 bg-surface/60 sticky top-0 backdrop-blur-sm border-b border-surface-border/40 flex items-center gap-1.5">
                {g.key === 'pinned' && <Pin className="w-3 h-3 text-amber-400" />}
                {g.label}
                <span className="text-gray-700">· {g.items.length}</span>
              </div>
              <ul className="divide-y divide-surface-border">
                {g.items.map(renderVersionRow)}
              </ul>
            </div>
          ))}
        </div>
      )}
    </>
  )

  const renderHeader = () => (
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
      <div className="flex items-center gap-1">
        <button
          onClick={() => setFullscreen((f) => !f)}
          className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
          title={fullscreen ? 'Yan panele geç' : 'Tam ekran'}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )

  // ── Side-panel layout ─────────────────────────────────────────────
  if (!fullscreen) {
    return (
      <>
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
        <div className={`
          fixed z-50 bg-surface border-surface-border shadow-2xl flex flex-col
          bottom-0 left-0 right-0 rounded-t-2xl border-t max-h-[85vh]
          lg:top-14 lg:right-0 lg:bottom-0 lg:left-auto lg:rounded-none lg:rounded-l-xl
          lg:border-l lg:border-t-0 lg:w-80 lg:max-h-none
          transition-transform duration-300
        `}>
          {renderHeader()}
          {renderSaveForm()}
          <div className="flex-1 overflow-y-auto">{renderList()}</div>
          {versions.length > 0 && (
            <div className="px-4 py-2 border-t border-surface-border shrink-0">
              <p className="text-[10px] text-gray-700 text-center">
                Son {Math.min(versions.length, 50)} versiyon saklanır
              </p>
            </div>
          )}
        </div>

        {diffPair && (
          <VersionDiffModal
            open={!!diffPair}
            onClose={() => setDiffPair(null)}
            versionA={diffPair.a}
            versionB={diffPair.b}
            currentTitle={title}
            currentSubtitle={subtitle}
            currentBlocks={blocks}
          />
        )}
      </>
    )
  }

  // ── Fullscreen layout ─────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 z-50 bg-surface flex flex-col">
        {renderHeader()}

        {/* Toolbar: search + compare button */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-border shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Etikete, başlığa veya versiyon numarasına göre ara..."
              className="w-full pl-8 pr-3 h-8 rounded-lg bg-surface-raised border border-surface-border text-white text-xs placeholder:text-gray-600 outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-gray-600 hidden sm:inline">
              {selectedIds.length}/2 seçildi
            </span>
            <button
              onClick={compareSelected}
              disabled={selectedIds.length !== 2}
              className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <GitCompare className="w-3.5 h-3.5" />
              Seçilenleri karşılaştır
            </button>
            {selectedIds.length > 0 && (
              <button
                onClick={() => setSelectedIds([])}
                className="h-8 px-3 rounded-lg border border-surface-border text-gray-400 hover:text-white text-xs transition-colors"
              >
                Temizle
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: list */}
          <div className="w-full md:w-96 lg:w-[380px] flex flex-col border-r border-surface-border shrink-0">
            {renderSaveForm()}
            <div className="flex-1 overflow-y-auto">{renderList()}</div>
            {versions.length > 0 && (
              <div className="px-4 py-2 border-t border-surface-border shrink-0">
                <p className="text-[10px] text-gray-700 text-center">
                  Son {Math.min(versions.length, 50)} versiyon · Sabitlenenler her zaman üstte
                </p>
              </div>
            )}
          </div>

          {/* Right: detail / preview */}
          <div className="flex-1 hidden md:flex flex-col overflow-hidden">
            {previewVersion ? (
              <>
                <div className="px-6 py-4 border-b border-surface-border shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-raised border border-surface-border text-gray-400 font-mono">
                          v{previewVersion.versionNumber}
                        </span>
                        {previewVersion.label && (
                          <span className="flex items-center gap-1 text-xs text-brand-300 font-medium">
                            <Tag className="w-3 h-3" />{previewVersion.label}
                          </span>
                        )}
                        {pins.has(previewVersion.id) && (
                          <span className="flex items-center gap-1 text-[10px] text-amber-400">
                            <Pin className="w-3 h-3 fill-amber-400/40" />Sabit
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1.5 line-clamp-2">
                        {previewVersion.title || 'Başlıksız'}
                      </h3>
                      {previewVersion.subtitle && (
                        <p className="text-sm text-gray-400 mt-0.5 line-clamp-2">{previewVersion.subtitle}</p>
                      )}
                      <p className="text-[11px] text-gray-600 mt-1.5">
                        {fullDate(previewVersion.createdAt)} · {timeAgo(previewVersion.createdAt)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setDiffPair({ a: previewVersion, b: 'current' })}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        <GitCompare className="w-3.5 h-3.5 text-brand-400" />
                        Mevcutla karşılaştır
                      </button>
                      <button
                        onClick={() => handleRestore(previewVersion)}
                        disabled={restoring === previewVersion.id}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white disabled:opacity-50 transition-colors"
                      >
                        {restoring === previewVersion.id ? <Spinner size="sm" /> : <RotateCcw className="w-3.5 h-3.5 text-yellow-400" />}
                        Geri yükle
                      </button>
                      <button
                        onClick={() => handleExport(previewVersion)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-surface-raised hover:bg-surface-border border border-surface-border text-xs text-gray-300 hover:text-white transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        İndir
                      </button>
                      <button
                        onClick={() => handleDelete(previewVersion)}
                        disabled={deleting === previewVersion.id || pins.has(previewVersion.id)}
                        className="flex items-center gap-1.5 h-8 px-3 rounded-lg hover:bg-red-500/10 border border-transparent hover:border-red-500/20 text-xs text-gray-500 hover:text-red-400 disabled:opacity-40 transition-colors"
                        title={pins.has(previewVersion.id) ? 'Sabitlenmiş versiyon silinemez' : 'Sil'}
                      >
                        {deleting === previewVersion.id ? <Spinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Stats compared to current */}
                  {previewStats && (
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <StatBadge icon={<BookOpen className="w-3 h-3" />} label="Blok" value={previewStats.blockCount} delta={previewStats.blockCount - currentStats.blockCount} />
                      <StatBadge icon={<FileText className="w-3 h-3" />} label="Kelime" value={previewStats.wordCount} delta={previewStats.wordCount - currentStats.wordCount} />
                      <StatBadge icon={<ImageIcon className="w-3 h-3" />} label="Görsel" value={previewStats.imageCount} delta={previewStats.imageCount - currentStats.imageCount} />
                      <StatBadge icon={<Code2 className="w-3 h-3" />} label="Kod" value={previewStats.codeCount} delta={previewStats.codeCount - currentStats.codeCount} />
                      <span className="text-[10px] text-gray-700">(mevcut duruma göre fark)</span>
                    </div>
                  )}
                </div>

                {/* Content preview */}
                <div className="flex-1 overflow-y-auto px-6 py-5">
                  {previewVersion.coverImage && (
                    <img
                      src={previewVersion.coverImage}
                      alt=""
                      className="w-full max-h-64 object-cover rounded-lg mb-4 border border-surface-border"
                    />
                  )}
                  <BlocksPreview blocks={previewVersion.blocks} />
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-600">
                <Eye className="w-10 h-10 mb-2 opacity-50" />
                <p className="text-sm">Önizlemek için soldan bir versiyon seç</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {diffPair && (
        <VersionDiffModal
          open={!!diffPair}
          onClose={() => setDiffPair(null)}
          versionA={diffPair.a}
          versionB={diffPair.b}
          currentTitle={title}
          currentSubtitle={subtitle}
          currentBlocks={blocks}
        />
      )}
    </>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────
function StatBadge({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: number; delta: number }) {
  const deltaColor = delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-600'
  const deltaText  = delta > 0 ? `+${delta}` : delta < 0 ? `${delta}` : '±0'
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-md bg-surface-raised border border-surface-border text-gray-300">
      <span className="text-gray-500">{icon}</span>
      <span className="font-medium">{value}</span>
      <span className="text-gray-700">{label}</span>
      <span className={`font-mono ${deltaColor}`}>{deltaText}</span>
    </span>
  )
}

function BlocksPreview({ blocks }: { blocks: ArticleBlock[] }) {
  if (!blocks || blocks.length === 0) {
    return <p className="text-sm text-gray-600 italic">İçerik yok</p>
  }
  return (
    <div className="prose prose-invert prose-sm max-w-none space-y-3">
      {blocks.map((b) => {
        const text = (b.content ?? '').replace(/<[^>]*>/g, '')
        switch (b.type) {
          case 'heading1': return <h1 key={b.id} className="text-2xl font-bold text-white">{text}</h1>
          case 'heading2': return <h2 key={b.id} className="text-xl font-bold text-white">{text}</h2>
          case 'heading3': return <h3 key={b.id} className="text-lg font-semibold text-white">{text}</h3>
          case 'image':
            return b.src
              ? <img key={b.id} src={b.src} alt={b.caption ?? ''} className="rounded-lg border border-surface-border max-h-72 object-cover" />
              : null
          case 'code':
            return (
              <pre key={b.id} className="bg-surface-raised border border-surface-border rounded-lg p-3 overflow-x-auto text-xs font-mono text-gray-300">
                <code>{b.code ?? ''}</code>
              </pre>
            )
          case 'quote':
            return <blockquote key={b.id} className="border-l-2 border-brand-500 pl-3 text-gray-400 italic">{text}</blockquote>
          case 'divider':
            return <hr key={b.id} className="border-surface-border" />
          case 'callout':
            return <div key={b.id} className="rounded-lg p-3 bg-brand-500/5 border border-brand-500/20 text-sm text-gray-300">{b.emoji ?? '💡'} {text}</div>
          default:
            return text ? <p key={b.id} className="text-sm text-gray-300 leading-relaxed">{text}</p> : null
        }
      })}
    </div>
  )
}
