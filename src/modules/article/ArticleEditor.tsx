import { useEffect, useRef, useState } from 'react'
import {
  ImagePlus, X, ChevronUp, ChevronDown, Trash2,
  Plus, Camera, Heading1, Heading2, Heading3, Code2, Quote, Lightbulb, Minus,
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'
import ArticleToolbar from './ArticleToolbar'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import CodeBlock from './blocks/CodeBlock'
import QuoteBlock from './blocks/QuoteBlock'
import DividerBlock from './blocks/DividerBlock'
import CalloutBlock from './blocks/CalloutBlock'

// Block types shown in the Medium-style circle menu
const CIRCLE_BLOCKS: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: 'image',   icon: <Camera   className="w-4 h-4" />, label: 'Görsel' },
  { type: 'heading2',icon: <Heading2 className="w-4 h-4" />, label: 'Başlık' },
  { type: 'code',    icon: <Code2    className="w-4 h-4" />, label: 'Kod Bloğu' },
  { type: 'quote',   icon: <Quote    className="w-4 h-4" />, label: 'Alıntı' },
  { type: 'callout', icon: <Lightbulb className="w-4 h-4" />, label: 'Çağrı Kutusu' },
  { type: 'divider', icon: <Minus    className="w-4 h-4" />, label: 'Ayırıcı' },
]

function CircleBtn({
  onClick, title, children, className,
}: {
  onClick: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'w-9 h-9 rounded-full border border-gray-500 hover:border-gray-200',
        'flex items-center justify-center text-gray-400 hover:text-white',
        'bg-surface/90 backdrop-blur-sm transition-all shrink-0',
        className,
      )}
    >
      {children}
    </button>
  )
}

function BlockWrapper({ id, children }: { id: string; children: React.ReactNode }) {
  const { moveBlock, removeBlock, addBlock, blocks } = useArticleStore()
  const [hovered, setHovered] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [submenu, setSubmenu] = useState<'heading' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const idx = blocks.findIndex((b) => b.id === id)

  // Close circle menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
        setSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleAddBlock = (type: BlockType) => {
    setMenuOpen(false)
    setSubmenu(null)
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
      {/* ── Desktop: left side controls ── */}
      <div ref={menuRef} className="absolute -left-10 top-1 hidden md:block z-20">
        {menuOpen ? (
          submenu === 'heading' ? (
            // Heading sub-circles: H1 / H2 / H3
            <div className="flex items-center gap-1 animate-circle-menu">
              <CircleBtn onClick={() => setSubmenu(null)} title="Geri" className="border-gray-400 hover:border-gray-200">
                <X className="w-3.5 h-3.5" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading1')} title="H1 – Büyük Başlık">
                <Heading1 className="w-4 h-4" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading2')} title="H2 – Orta Başlık">
                <Heading2 className="w-4 h-4" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading3')} title="H3 – Küçük Başlık">
                <Heading3 className="w-4 h-4" />
              </CircleBtn>
            </div>
          ) : (
          // Main circle row
          <div className="flex items-center gap-1 animate-circle-menu">
            <CircleBtn onClick={() => { setMenuOpen(false); setSubmenu(null) }} title="Kapat" className="border-gray-400 hover:border-red-400 hover:text-red-400">
              <X className="w-3.5 h-3.5" />
            </CircleBtn>
            {CIRCLE_BLOCKS.map((b) => (
              <CircleBtn
                key={b.type}
                title={b.label}
                onClick={() => b.type === 'heading2' ? setSubmenu('heading') : handleAddBlock(b.type)}
              >
                {b.icon}
              </CircleBtn>
            ))}
          </div>
          )
        ) : (
          // Compact controls on hover
          <div className={cn('flex flex-col gap-1 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
            <button
              onClick={() => setMenuOpen(true)}
              className="w-7 h-7 rounded-full border border-gray-700 hover:border-brand-500 flex items-center justify-center text-gray-600 hover:text-brand-400 transition-all"
              title="Blok ekle"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
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
        )}
      </div>

      {children}

      {/* ── Mobile: bottom controls ── */}
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
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [addSubmenu, setAddSubmenu] = useState<'heading' | null>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Close bottom circle menu on outside click
  useEffect(() => {
    if (!addMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) {
        setAddMenuOpen(false)
        setAddSubmenu(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [addMenuOpen])

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

          {/* ── Add block at bottom (Medium-style circle menu) ── */}
          <div ref={addMenuRef} className="py-3 flex items-center gap-1.5">
            {addMenuOpen ? (
              addSubmenu === 'heading' ? (
                // Heading sub-circles for bottom menu
                <div className="flex items-center gap-1 animate-circle-menu">
                  <CircleBtn onClick={() => setAddSubmenu(null)} title="Geri" className="border-gray-400 hover:border-gray-200">
                    <X className="w-3.5 h-3.5" />
                  </CircleBtn>
                  {(['heading1', 'heading2', 'heading3'] as BlockType[]).map((t, i) => (
                    <CircleBtn
                      key={t}
                      title={['H1 – Büyük Başlık', 'H2 – Orta Başlık', 'H3 – Küçük Başlık'][i]}
                      onClick={() => {
                        setAddMenuOpen(false); setAddSubmenu(null)
                        const lastId = blocks[blocks.length - 1]?.id ?? null
                        const newId = addBlock(lastId, t)
                        requestAnimationFrame(() => {
                          document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
                        })
                      }}
                    >
                      {[<Heading1 className="w-4 h-4" />, <Heading2 className="w-4 h-4" />, <Heading3 className="w-4 h-4" />][i]}
                    </CircleBtn>
                  ))}
                </div>
              ) : (
              <div className="flex items-center gap-1 animate-circle-menu">
                <CircleBtn
                  onClick={() => { setAddMenuOpen(false); setAddSubmenu(null) }}
                  title="Kapat"
                  className="border-gray-400 hover:border-red-400 hover:text-red-400"
                >
                  <X className="w-3.5 h-3.5" />
                </CircleBtn>
                {CIRCLE_BLOCKS.map((b) => (
                  <CircleBtn
                    key={b.type}
                    title={b.label}
                    onClick={() => {
                      if (b.type === 'heading2') { setAddSubmenu('heading'); return }
                      setAddMenuOpen(false)
                      const lastId = blocks[blocks.length - 1]?.id ?? null
                      const newId = addBlock(lastId, b.type)
                      requestAnimationFrame(() => {
                        document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
                      })
                    }}
                  >
                    {b.icon}
                  </CircleBtn>
                ))}
              </div>
              )
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setAddMenuOpen(true)}
                  className="w-9 h-9 rounded-full border-2 border-gray-700 hover:border-brand-500 hover:bg-brand-500/10 flex items-center justify-center text-xl font-light transition-all leading-none select-none text-gray-600 hover:text-brand-400 shrink-0"
                  title="Blok türü seç"
                >
                  +
                </button>
                <button
                  onClick={() => {
                    const lastId = blocks[blocks.length - 1]?.id ?? null
                    const newId = addBlock(lastId, 'paragraph')
                    requestAnimationFrame(() => {
                      document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
                    })
                  }}
                  className="text-sm text-gray-700 hover:text-gray-400 transition-colors"
                >
                  Yeni blok ekle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
