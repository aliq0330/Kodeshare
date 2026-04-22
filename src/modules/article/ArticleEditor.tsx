import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus, X, ChevronUp, ChevronDown, Trash2,
  Plus, AlignLeft, Heading1, Heading2, Heading3,
  Image, Code2, Quote, Lightbulb, Minus,
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'
import FloatingFormatToolbar from './FloatingFormatToolbar'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import CodeBlock from './blocks/CodeBlock'
import QuoteBlock from './blocks/QuoteBlock'
import DividerBlock from './blocks/DividerBlock'
import CalloutBlock from './blocks/CalloutBlock'

const BLOCK_TYPES: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph',  label: 'Metin',         icon: <AlignLeft  className="w-4 h-4" />, desc: 'Düz metin paragrafı' },
  { type: 'heading1',   label: 'Büyük Başlık',  icon: <Heading1   className="w-4 h-4" />, desc: 'H1 — Ana başlık' },
  { type: 'heading2',   label: 'Orta Başlık',   icon: <Heading2   className="w-4 h-4" />, desc: 'H2 — Alt başlık' },
  { type: 'heading3',   label: 'Küçük Başlık',  icon: <Heading3   className="w-4 h-4" />, desc: 'H3 — Bölüm başlığı' },
  { type: 'image',      label: 'Görsel',         icon: <Image      className="w-4 h-4" />, desc: 'Fotoğraf ekle' },
  { type: 'code',       label: 'Kod Bloğu',      icon: <Code2      className="w-4 h-4" />, desc: 'Syntax highlighted kod' },
  { type: 'quote',      label: 'Alıntı',         icon: <Quote      className="w-4 h-4" />, desc: 'Blok alıntı' },
  { type: 'callout',    label: 'Çağrı Kutusu',   icon: <Lightbulb  className="w-4 h-4" />, desc: 'Renkli bildirim kutusu' },
  { type: 'divider',    label: 'Ayırıcı',        icon: <Minus      className="w-4 h-4" />, desc: 'Bölüm ayırıcı' },
]

function BlockWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { moveBlock, removeBlock, addBlock, blocks } = useArticleStore()
  const [hovered, setHovered]     = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerDesktopRef = useRef<HTMLDivElement>(null)
  const pickerMobileRef  = useRef<HTMLDivElement>(null)
  const idx = blocks.findIndex((b) => b.id === id)

  useEffect(() => {
    if (!pickerOpen) return
    const h = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        (!pickerDesktopRef.current || !pickerDesktopRef.current.contains(t)) &&
        (!pickerMobileRef.current  || !pickerMobileRef.current.contains(t))
      ) setPickerOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerOpen])

  const handleAdd = (type: BlockType) => {
    setPickerOpen(false)
    const newId = addBlock(id, type)
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
    })
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Desktop: sol kenar */}
      <div
        className={cn(
          'absolute -left-10 top-0 hidden md:flex flex-col items-center gap-0.5 transition-opacity',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        {/* + butonu */}
        <div ref={pickerDesktopRef} className="relative">
          <button
            type="button"
            title="Blok ekle"
            onClick={() => setPickerOpen((v) => !v)}
            className="w-6 h-6 flex items-center justify-center rounded-full text-gray-600 hover:text-white hover:bg-surface-raised transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {pickerOpen && (
            <div className="absolute left-8 top-0 z-50 w-60 bg-surface-card border border-surface-border rounded-xl shadow-2xl">
              <div className="p-1.5 max-h-72 overflow-y-auto">
                {BLOCK_TYPES.map((b) => (
                  <button
                    key={b.type}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleAdd(b.type) }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-raised transition-colors text-left"
                  >
                    <span className="shrink-0 p-1.5 rounded-md bg-surface-raised text-gray-400">{b.icon}</span>
                    <span>
                      <span className="block text-sm font-medium text-gray-200">{b.label}</span>
                      <span className="block text-xs text-gray-500">{b.desc}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Taşıma / silme */}
        <button type="button" onClick={() => moveBlock(id, 'up')} disabled={idx === 0}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20" title="Yukarı taşı">
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={() => moveBlock(id, 'down')} disabled={idx === blocks.length - 1}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20" title="Aşağı taşı">
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {blocks.length > 1 && (
          <button type="button" onClick={() => removeBlock(id)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Bloğu sil">
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {children}

      {/* Mobil: alt satır */}
      <div className="flex md:hidden items-center justify-between gap-1 mt-1">
        {/* Mobil + butonu */}
        <div className="relative" ref={pickerMobileRef}>
          <button type="button" onClick={() => setPickerOpen((v) => !v)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-gray-600 hover:text-white hover:bg-surface-raised transition-colors text-xs">
            <Plus className="w-3.5 h-3.5" />
          </button>
          {pickerOpen && (
            <div className="absolute left-0 bottom-full mb-1 z-50 w-56 bg-surface-card border border-surface-border rounded-xl shadow-2xl">
              <div className="p-1.5 max-h-64 overflow-y-auto">
                {BLOCK_TYPES.map((b) => (
                  <button key={b.type} type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleAdd(b.type) }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-raised transition-colors text-left">
                    <span className="shrink-0 text-gray-400">{b.icon}</span>
                    <span className="text-sm text-gray-200">{b.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button type="button" onClick={() => moveBlock(id, 'up')} disabled={idx === 0}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20">
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
          <button type="button" onClick={() => moveBlock(id, 'down')} disabled={idx === blocks.length - 1}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20">
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {blocks.length > 1 && (
            <button type="button" onClick={() => removeBlock(id)}
              className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const TEXT_TYPES: BlockType[] = ['paragraph', 'heading1', 'heading2', 'heading3', 'quote', 'callout']

export default function ArticleEditor() {
  const { title, subtitle, coverImage, blocks, setTitle, setSubtitle, setCoverImage, addBlock, setActiveBlock } = useArticleStore()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const titleRef      = useRef<HTMLTextAreaElement>(null)
  const subtitleRef   = useRef<HTMLTextAreaElement>(null)

  const handleCoverFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => setCoverImage(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const autoGrow = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const focusBlock = (id: string) => {
    document.querySelector<HTMLElement>(`[data-block-id="${id}"]`)?.focus()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Floating format toolbar (fixed, portal-like) */}
      <FloatingFormatToolbar />

      {/* Cover image */}
      {coverImage ? (
        <div className="relative group">
          <img src={coverImage} alt="Kapak görseli" className="w-full h-48 sm:h-72 md:h-96 object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <button
              onClick={() => setCoverImage(null)}
              className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2 px-4 py-2 rounded-lg bg-black/60 text-white text-sm hover:bg-black/80"
            >
              <X className="w-4 h-4" />
              Kapak görselini kaldır
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => coverInputRef.current?.click()}
          className="flex items-center gap-2 mx-4 sm:mx-6 mt-6 mb-2 px-4 py-2 rounded-lg border border-dashed border-surface-border hover:border-brand-500 text-gray-600 hover:text-brand-400 text-sm transition-colors self-start"
        >
          <ImagePlus className="w-4 h-4" />
          Kapak fotoğrafı ekle
        </button>
      )}
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f) }} />

      {/* Title + Subtitle */}
      <div className="px-4 sm:px-6 pt-6 pb-2 max-w-3xl w-full mx-auto">
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => { setTitle(e.target.value); autoGrow(e.target) }}
          onFocus={() => setActiveBlock(null)}
          placeholder="Başlık..."
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent border-none outline-none overflow-hidden',
            'text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight',
            'text-white placeholder:text-gray-700',
          )}
          style={{ minHeight: '3rem' }}
        />
        <textarea
          ref={subtitleRef}
          value={subtitle}
          onChange={(e) => { setSubtitle(e.target.value); autoGrow(e.target) }}
          onFocus={() => setActiveBlock(null)}
          placeholder="Alt başlık veya kısa özet..."
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent border-none outline-none overflow-hidden mt-3',
            'text-xl sm:text-2xl font-light leading-relaxed',
            'text-gray-400 placeholder:text-gray-700',
          )}
          style={{ minHeight: '2rem' }}
        />
      </div>

      {/* Blocks */}
      <div className="flex-1 px-4 sm:px-6 pb-32 max-w-3xl w-full mx-auto mt-6">
        <div className="flex flex-col gap-2 md:pl-10">
          {blocks.map((block, i) => {
            const prevId = i > 0 ? blocks[i - 1].id : null
            const nextId = i < blocks.length - 1 ? blocks[i + 1].id : null

            return (
              <BlockWrapper key={block.id} id={block.id}>
                {TEXT_TYPES.includes(block.type) ? (
                  block.type === 'quote' ? (
                    <QuoteBlock block={block} />
                  ) : block.type === 'callout' ? (
                    <CalloutBlock block={block} />
                  ) : (
                    <TextBlock
                      block={block}
                      onFocusPrev={prevId ? () => focusBlock(prevId) : undefined}
                      onFocusNext={nextId ? () => focusBlock(nextId) : undefined}
                    />
                  )
                ) : block.type === 'image' ? (
                  <ImageBlock block={block} />
                ) : block.type === 'code' ? (
                  <CodeBlock block={block} />
                ) : block.type === 'divider' ? (
                  <DividerBlock />
                ) : null}
              </BlockWrapper>
            )
          })}

          {/* Bottom add */}
          <button
            onClick={() => {
              const lastId = blocks[blocks.length - 1]?.id ?? null
              const newId = addBlock(lastId, 'paragraph')
              requestAnimationFrame(() => {
                document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
              })
            }}
            className="flex items-center gap-2 py-4 text-gray-700 hover:text-gray-500 text-sm transition-colors group"
          >
            <span className="w-5 h-5 rounded-full border border-gray-700 group-hover:border-gray-500 flex items-center justify-center text-xs transition-colors">+</span>
            Yeni paragraf ekle
          </button>
        </div>
      </div>
    </div>
  )
}
