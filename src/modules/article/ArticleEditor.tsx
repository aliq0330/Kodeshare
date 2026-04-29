import { useEffect, useRef, useState } from 'react'
import { IconPhotoPlus, IconX, IconChevronUp, IconChevronDown, IconTrash, IconPlus, IconCamera, IconH1, IconH2, IconH3, IconCode, IconQuote, IconBulb, IconMinus, IconNews, IconLoader2 } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'
import { postService } from '@services/postService'
import ArticleToolbar from './ArticleToolbar'
import TextBlock from './blocks/TextBlock'
import ImageBlock from './blocks/ImageBlock'
import CodeBlock from './blocks/CodeBlock'
import QuoteBlock from './blocks/QuoteBlock'
import DividerBlock from './blocks/DividerBlock'
import CalloutBlock from './blocks/CalloutBlock'
import PostEmbedBlock from './blocks/PostEmbedBlock'

// Block types shown in the Medium-style circle menu
const CIRCLE_BLOCKS: { type: BlockType; icon: React.ReactNode; label: string }[] = [
  { type: 'image',      icon: <IconCamera    className="w-4 h-4" />,   label: 'Görsel' },
  { type: 'heading2',   icon: <IconH2  className="w-4 h-4" />,   label: 'Başlık' },
  { type: 'code',       icon: <IconCode     className="w-4 h-4" />,   label: 'Kod Bloğu' },
  { type: 'quote',      icon: <IconQuote     className="w-4 h-4" />,   label: 'Alıntı' },
  { type: 'callout',    icon: <IconBulb className="w-4 h-4" />,   label: 'Çağrı Kutusu' },
  { type: 'divider',    icon: <IconMinus     className="w-4 h-4" />,   label: 'Ayırıcı' },
  { type: 'post-embed', icon: <IconNews className="w-4 h-4" />,   label: 'Gönderi Postu' },
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

function BlockWrapper({
  id, children, onAddPostEmbed,
}: {
  id: string
  children: React.ReactNode
  onAddPostEmbed: (afterId: string) => void
}) {
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
                <IconX className="w-3.5 h-3.5" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading1')} title="H1 – Büyük Başlık">
                <IconH1 className="w-4 h-4" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading2')} title="H2 – Orta Başlık">
                <IconH2 className="w-4 h-4" />
              </CircleBtn>
              <CircleBtn onClick={() => handleAddBlock('heading3')} title="H3 – Küçük Başlık">
                <IconH3 className="w-4 h-4" />
              </CircleBtn>
            </div>
          ) : (
          // Main circle row
          <div className="flex items-center gap-1 animate-circle-menu">
            <CircleBtn onClick={() => { setMenuOpen(false); setSubmenu(null) }} title="Kapat" className="border-gray-400 hover:border-red-400 hover:text-red-400">
              <IconX className="w-3.5 h-3.5" />
            </CircleBtn>
            {CIRCLE_BLOCKS.map((b) => (
              <CircleBtn
                key={b.type}
                title={b.label}
                onClick={() => {
                  if (b.type === 'heading2') { setSubmenu('heading'); return }
                  if (b.type === 'post-embed') { setMenuOpen(false); setSubmenu(null); onAddPostEmbed(id); return }
                  handleAddBlock(b.type)
                }}
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
              <IconPlus className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveBlock(id, 'up')}
              disabled={idx === 0}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
              title="Yukarı taşı"
            >
              <IconChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => moveBlock(id, 'down')}
              disabled={idx === blocks.length - 1}
              className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
              title="Aşağı taşı"
            >
              <IconChevronDown className="w-3.5 h-3.5" />
            </button>
            {blocks.length > 1 && (
              <button
                onClick={() => removeBlock(id)}
                className="w-6 h-6 flex items-center justify-center rounded text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Bloğu sil"
              >
                <IconX className="w-3 h-3" />
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
          <IconChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => moveBlock(id, 'down')}
          disabled={idx === blocks.length - 1}
          className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-gray-300 hover:bg-surface-raised transition-colors disabled:opacity-20"
        >
          <IconChevronDown className="w-3.5 h-3.5" />
        </button>
        {blocks.length > 1 && (
          <button
            onClick={() => removeBlock(id)}
            className="w-7 h-7 flex items-center justify-center rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <IconTrash className="w-3.5 h-3.5" />
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
  const [coverUrlInput, setCoverUrlInput] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const subtitleRef = useRef<HTMLTextAreaElement>(null)
  const [addMenuOpen, setAddMenuOpen] = useState(false)
  const [addSubmenu, setAddSubmenu] = useState<'heading' | null>(null)
  const addMenuRef = useRef<HTMLDivElement>(null)

  // Post-embed dialog state
  const [postEmbedOpen, setPostEmbedOpen] = useState(false)
  const [postEmbedAfterId, setPostEmbedAfterId] = useState<string | null>(null)
  const [postEmbedUrl, setPostEmbedUrl] = useState('')
  const [postEmbedLoading, setPostEmbedLoading] = useState(false)
  const [postEmbedError, setPostEmbedError] = useState<string | null>(null)

  const openPostEmbed = (afterId: string | null) => {
    setPostEmbedAfterId(afterId)
    setPostEmbedUrl('')
    setPostEmbedError(null)
    setPostEmbedOpen(true)
  }

  const closePostEmbed = () => {
    setPostEmbedOpen(false)
    setPostEmbedUrl('')
    setPostEmbedError(null)
    setPostEmbedLoading(false)
  }

  const handlePostEmbedSubmit = async () => {
    const raw = postEmbedUrl.trim()
    if (!raw) return
    const match = raw.match(/\/post\/([a-zA-Z0-9_-]+)/)
    const postId = match ? match[1] : raw
    setPostEmbedLoading(true)
    setPostEmbedError(null)
    try {
      await postService.getPost(postId)
      const newId = addBlock(postEmbedAfterId, 'post-embed', { src: postId })
      closePostEmbed()
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
      })
    } catch {
      setPostEmbedError('Gönderi bulunamadı. URL veya ID\'yi kontrol edin.')
      setPostEmbedLoading(false)
    }
  }

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

  const handleCoverUrlSubmit = () => {
    const url = coverUrlInput.trim()
    if (!url) return
    setCoverImage(url)
    setCoverUrlInput('')
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
              <IconX className="w-4 h-4" />
              Kapak görselini kaldır
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2 mx-4 sm:mx-6 mt-6 mb-2">
          <div className="flex items-center gap-2 w-full max-w-md">
            <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-lg border border-dashed border-surface-border hover:border-brand-500 transition-colors text-sm">
              <IconPhotoPlus className="w-4 h-4 text-gray-600 shrink-0" />
              <input
                type="url"
                value={coverUrlInput}
                onChange={(e) => setCoverUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCoverUrlSubmit() }}
                placeholder="Kapak fotoğrafı URL'si..."
                className="flex-1 bg-transparent outline-none text-gray-400 placeholder:text-gray-600 min-w-0"
              />
            </div>
            <button
              onClick={handleCoverUrlSubmit}
              disabled={!coverUrlInput.trim()}
              className="px-3 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm transition-colors shrink-0"
            >
              Ekle
            </button>
          </div>
        </div>
      )}

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
              <BlockWrapper
                key={block.id}
                id={block.id}
                onAddPostEmbed={(afterId) => openPostEmbed(afterId)}
              >
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
                ) : block.type === 'post-embed' ? (
                  <PostEmbedBlock block={block} />
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
                    <IconX className="w-3.5 h-3.5" />
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
                      {[<IconH1 className="w-4 h-4" />, <IconH2 className="w-4 h-4" />, <IconH3 className="w-4 h-4" />][i]}
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
                  <IconX className="w-3.5 h-3.5" />
                </CircleBtn>
                {CIRCLE_BLOCKS.map((b) => (
                  <CircleBtn
                    key={b.type}
                    title={b.label}
                    onClick={() => {
                      if (b.type === 'heading2') { setAddSubmenu('heading'); return }
                      if (b.type === 'post-embed') {
                        setAddMenuOpen(false); setAddSubmenu(null)
                        openPostEmbed(blocks[blocks.length - 1]?.id ?? null)
                        return
                      }
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

      {/* ── Post embed dialog ── */}
      {postEmbedOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4" onClick={closePostEmbed}>
          <div
            className="w-full max-w-md bg-surface-card border border-surface-border rounded-2xl shadow-2xl p-6"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-base font-semibold text-white mb-1">Gönderi Postu Ekle</h2>
            <p className="text-xs text-gray-500 mb-4">
              Gönderi URL'sini veya ID'sini girin
            </p>
            <input
              autoFocus
              value={postEmbedUrl}
              onChange={e => { setPostEmbedUrl(e.target.value); setPostEmbedError(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handlePostEmbedSubmit(); if (e.key === 'Escape') closePostEmbed() }}
              placeholder="https://kodeshare.dev/post/... veya gönderi ID'si"
              className="w-full bg-surface-raised rounded-lg px-3 py-2.5 text-sm text-white outline-none placeholder:text-gray-600 border border-surface-border focus:border-brand-500 transition-colors"
            />
            {postEmbedError && (
              <p className="text-xs text-red-400 mt-2">{postEmbedError}</p>
            )}
            <div className="flex gap-2 mt-4">
              <button
                onClick={closePostEmbed}
                className="flex-1 py-2 rounded-lg border border-surface-border text-sm text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handlePostEmbedSubmit}
                disabled={postEmbedLoading || !postEmbedUrl.trim()}
                className="flex-1 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {postEmbedLoading ? (
                  <><IconLoader2 className="w-4 h-4 animate-spin" /> Yükleniyor...</>
                ) : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
