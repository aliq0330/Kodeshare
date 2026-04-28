import { useMemo } from 'react'
import { X, BookOpen, Code2, Image, Quote, Minus, Lightbulb, Type } from 'lucide-react'
import { diffText, diffBlocks, type DiffPart } from '@utils/diffUtils'
import type { ArticleVersion } from '@services/articleVersionService'
import type { ArticleBlock } from '@store/articleStore'
import { timeAgo } from '@utils/formatters'

interface Props {
  open: boolean
  onClose: () => void
  versionA: ArticleVersion       // older
  versionB: ArticleVersion | 'current'
  currentTitle?: string
  currentSubtitle?: string
  currentBlocks?: ArticleBlock[]
}

function TextDiff({ parts }: { parts: DiffPart[] }) {
  return (
    <span>
      {parts.map((p, i) => {
        if (p.type === 'same') return <span key={i}>{p.text}</span>
        if (p.type === 'add')  return <mark key={i} className="bg-green-500/20 text-green-300 rounded px-0.5 no-underline">{p.text}</mark>
        return <mark key={i} className="bg-red-500/20 text-red-400 line-through rounded px-0.5">{p.text}</mark>
      })}
    </span>
  )
}

function blockIcon(type: string) {
  const cls = 'w-3.5 h-3.5 shrink-0 mt-0.5'
  switch (type) {
    case 'heading1': case 'heading2': case 'heading3': return <Type className={cls} />
    case 'code':     return <Code2 className={cls} />
    case 'image':    return <Image className={cls} />
    case 'quote':    return <Quote className={cls} />
    case 'divider':  return <Minus className={cls} />
    case 'callout':  return <Lightbulb className={cls} />
    default:         return <BookOpen className={cls} />
  }
}

function blockLabel(type: string): string {
  const map: Record<string, string> = {
    paragraph: 'Paragraf', heading1: 'Başlık 1', heading2: 'Başlık 2', heading3: 'Başlık 3',
    code: 'Kod', image: 'Görsel', quote: 'Alıntı', divider: 'Ayraç', callout: 'Bilgi kutusu',
    'post-embed': 'Gönderi',
  }
  return map[type] ?? type
}

function blockPreviewText(block: { type: string; content?: string; code?: string; src?: string }): string {
  const raw = block.content ?? block.code ?? block.src ?? ''
  const plain = raw.replace(/<[^>]*>/g, '')
  return plain.length > 120 ? plain.slice(0, 120) + '…' : plain
}

export default function VersionDiffModal({ open, onClose, versionA, versionB, currentTitle = '', currentSubtitle = '', currentBlocks = [] }: Props) {
  const bTitle    = versionB === 'current' ? currentTitle    : versionB.title
  const bSubtitle = versionB === 'current' ? currentSubtitle : versionB.subtitle
  const bBlocks   = versionB === 'current' ? currentBlocks   : versionB.blocks
  const bLabel    = versionB === 'current' ? 'Mevcut durum'  : (versionB.label ?? `v${versionB.versionNumber}`)
  const bTime     = versionB === 'current' ? 'Şu an'         : timeAgo(versionB.createdAt)

  const titleDiff    = useMemo(() => diffText(versionA.title,    bTitle),    [versionA.title, bTitle])
  const subtitleDiff = useMemo(() => diffText(versionA.subtitle, bSubtitle), [versionA.subtitle, bSubtitle])
  const blocksDiff   = useMemo(() => diffBlocks(versionA.blocks, bBlocks),   [versionA.blocks, bBlocks])

  const hasChanges = titleDiff.some((p) => p.type !== 'same')
    || subtitleDiff.some((p) => p.type !== 'same')
    || blocksDiff.some((e) => e.status !== 'same')

  const added   = blocksDiff.filter((e) => e.status === 'added').length
  const removed = blocksDiff.filter((e) => e.status === 'removed').length
  const changed = blocksDiff.filter((e) => e.status === 'changed').length

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-surface border border-surface-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-4 py-3 border-b border-surface-border shrink-0">
          <div className="flex-1 min-w-0">
            <h2 className="text-sm font-semibold text-white">Versiyon Karşılaştırma</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
                v{versionA.versionNumber} · {timeAgo(versionA.createdAt)}
                {versionA.label && ` · ${versionA.label}`}
              </span>
              <span className="text-gray-600 text-xs">→</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
                {bLabel} · {bTime}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stats */}
        {hasChanges && (
          <div className="flex items-center gap-3 px-4 py-2 border-b border-surface-border shrink-0 flex-wrap">
            {added   > 0 && <span className="text-xs text-green-400">+{added} blok eklendi</span>}
            {removed > 0 && <span className="text-xs text-red-400">−{removed} blok silindi</span>}
            {changed > 0 && <span className="text-xs text-yellow-400">~{changed} blok değişti</span>}
            {!added && !removed && !changed && <span className="text-xs text-gray-500">Yalnızca metin değişiklikleri</span>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!hasChanges && (
            <div className="text-center py-8 text-gray-500 text-sm">Bu iki versiyon arasında fark yok.</div>
          )}

          {/* Title diff */}
          {titleDiff.some((p) => p.type !== 'same') && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">Başlık</p>
              <div className="p-3 rounded-lg bg-surface-raised border border-surface-border text-base font-bold text-white leading-snug">
                <TextDiff parts={titleDiff} />
              </div>
            </section>
          )}

          {/* Subtitle diff */}
          {subtitleDiff.some((p) => p.type !== 'same') && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-1">Alt Başlık</p>
              <div className="p-3 rounded-lg bg-surface-raised border border-surface-border text-sm text-gray-300">
                <TextDiff parts={subtitleDiff} />
              </div>
            </section>
          )}

          {/* Blocks diff */}
          {blocksDiff.some((e) => e.status !== 'same') && (
            <section>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-600 mb-2">İçerik Blokları</p>
              <div className="flex flex-col gap-2">
                {blocksDiff.filter((e) => e.status !== 'same').map((entry, i) => {
                  if (entry.status === 'added') {
                    return (
                      <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-green-500/5 border border-green-500/20 border-l-2 border-l-green-500">
                        <span className="text-green-400 shrink-0 mt-0.5">{blockIcon(entry.block.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-green-500 font-medium uppercase mb-0.5">+ {blockLabel(entry.block.type)} eklendi</p>
                          <p className="text-xs text-green-300/70 line-clamp-2">{blockPreviewText(entry.block) || '(boş)'}</p>
                        </div>
                      </div>
                    )
                  }
                  if (entry.status === 'removed') {
                    return (
                      <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-red-500/5 border border-red-500/20 border-l-2 border-l-red-500 opacity-70">
                        <span className="text-red-400 shrink-0 mt-0.5">{blockIcon(entry.block.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-red-400 font-medium uppercase mb-0.5">− {blockLabel(entry.block.type)} silindi</p>
                          <p className="text-xs text-red-300/70 line-clamp-2 line-through">{blockPreviewText(entry.block) || '(boş)'}</p>
                        </div>
                      </div>
                    )
                  }
                  if (entry.status === 'changed') {
                    const oldText = blockPreviewText(entry.oldBlock)
                    const newText = blockPreviewText(entry.newBlock)
                    const parts   = diffText(oldText, newText)
                    return (
                      <div key={i} className="flex gap-2.5 p-3 rounded-lg bg-yellow-500/5 border border-yellow-500/20 border-l-2 border-l-yellow-500">
                        <span className="text-yellow-400 shrink-0 mt-0.5">{blockIcon(entry.newBlock.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-yellow-500 font-medium uppercase mb-0.5">~ {blockLabel(entry.newBlock.type)} değişti</p>
                          <p className="text-xs text-gray-300 leading-relaxed">
                            <TextDiff parts={parts} />
                          </p>
                        </div>
                      </div>
                    )
                  }
                  return null
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
