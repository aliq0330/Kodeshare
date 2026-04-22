import { useRef, useState } from 'react'
import { ImagePlus, X, ChevronUp, ChevronDown, Trash2 } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'
import ArticleToolbar, { ADD_BLOCKS } from './ArticleToolbar'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import CodeBlock from './blocks/CodeBlock'
import QuoteBlock from './blocks/QuoteBlock'
import DividerBlock from './blocks/DividerBlock'
import CalloutBlock from './blocks/CalloutBlock'

function BlockWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { moveBlock, removeBlock, blocks } = useArticleStore()
  const [hovered, setHovered] = useState(false)
  const idx = blocks.findIndex((b) => b.id === id)

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Desktop: sol kenar kontrolleri (hover) */}
      <div
        className={cn(
          'absolute -left-10 top-1 hidden md:flex flex-col gap-1 transition-opacity',
          hovered ? 'opacity-100' : 'opacity-0',
        )}
      >
        <button
          onClick={() => moveBlock(id, 'up')}
          disabled={idx === 0}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
          title="Yukarı taşı"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => moveBlock(id, 'down')}
          disabled={idx === blocks.length - 1}
          className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
          title="Aşağı taşı"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {blocks.length > 1 && (
          <button
            onClick={() => removeBlock(id)}
            className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Bloğu sil"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {children}

      {/* Mobil: alt satır kontrolleri */}
      <div className="flex md:hidden items-center justify-end gap-1 mt-1">
        <button
          onClick={() => moveBlock(id, 'up')}
          disabled={idx === 0}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => moveBlock(id, 'down')}
          disabled={idx === blocks.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {blocks.length > 1 && (
          <button
            onClick={() => removeBlock(id)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

type TextBlockType = Extract<BlockType, 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'quote' | 'callout'>
const TEXT_TYPES: BlockType[] = ['paragraph', 'heading1', 'heading2', 'heading3', 'quote', 'callout']

export default function ArticleEditor() {
  const { title, subtitle, coverImage, blocks, setTitle, setSubtitle, setCoverImage, addBlock, setActiveBlock } = useArticleStore()
  const coverInputRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const subtitleRef = useRef<HTMLTextAreaElement>(null)
  const [addPanelOpen, setAddPanelOpen] = useState(false)

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
    const el = document.querySelector<HTMLElement>(`[data-block-id="${id}"]`)
    el?.focus()
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Cover image ── */}
      {coverImage ? (
        <div className="relative group">
          <img
            src={coverImage}
            alt="Kapak görseli"
            className="w-full h-48 sm:h-72 md:h-96 object-cover"
          />
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
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverFile(f) }}
      />

      {/* ── Title + Subtitle ── */}
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
            'text-white dark:text-white placeholder:text-gray-700',
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
            'text-gray-400 dark:text-gray-400 placeholder:text-gray-700',
          )}
          style={{ minHeight: '2rem' }}
        />
      </div>

      {/* ── Sticky Toolbar ── */}
      <ArticleToolbar />

      {/* ── Blocks ── */}
      <div className="flex-1 px-4 sm:px-6 pb-32 max-w-3xl w-full mx-auto mt-8">
        <div className="flex flex-col gap-3 md:pl-10">
          {blocks.map((block, idx) => {
            const prevId = idx > 0 ? blocks[idx - 1].id : null
            const nextId = idx < blocks.length - 1 ? blocks[idx + 1].id : null

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

          {/* ── Add block at the bottom ── */}
          <button
            onClick={() => setAddPanelOpen(true)}
            className="flex items-center gap-3 py-3 text-gray-700 hover:text-brand-400 text-sm transition-colors group"
          >
            <span className="w-9 h-9 rounded-full border-2 border-gray-700 group-hover:border-brand-500 group-hover:bg-brand-500/10 flex items-center justify-center text-2xl font-light transition-all leading-none select-none">
              +
            </span>
            <span className="group-hover:text-brand-400 transition-colors">Yeni paragraf ekle</span>
          </button>
        </div>
      </div>

      {/* ── Add-block slide-in panel ── */}
      {addPanelOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-fade-in-overlay"
            onClick={() => setAddPanelOpen(false)}
          />
          {/* Panel */}
          <div className="fixed right-0 top-0 h-full z-50 w-72 bg-surface-card border-l border-surface-border shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
              <span className="text-sm font-semibold text-white">Blok Ekle</span>
              <button
                onClick={() => setAddPanelOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-md text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {ADD_BLOCKS.map((b) => (
                <button
                  key={b.type}
                  onClick={() => {
                    setAddPanelOpen(false)
                    const lastId = blocks[blocks.length - 1]?.id ?? null
                    const newId = addBlock(lastId, b.type)
                    requestAnimationFrame(() => {
                      document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
                    })
                  }}
                  className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors text-left"
                >
                  <span className="shrink-0 mt-0.5 p-1.5 rounded-md bg-surface-raised text-gray-400">
                    {b.icon}
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-gray-200">{b.label}</span>
                    <span className="block text-xs text-gray-500 mt-0.5">{b.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
