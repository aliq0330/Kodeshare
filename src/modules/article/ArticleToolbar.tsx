import { useEffect, useRef, useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  Heading1, Heading2, Heading3,
  Image, Code2, Quote, Minus, Lightbulb,
  Plus, AlignLeft, ChevronDown,
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'

const ADD_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph',  label: 'Paragraf',      icon: <AlignLeft className="w-4 h-4" />,   desc: 'Düz metin paragrafı' },
  { type: 'heading1',   label: 'Büyük Başlık',  icon: <Heading1 className="w-4 h-4" />,    desc: 'H1 — Ana başlık' },
  { type: 'heading2',   label: 'Orta Başlık',   icon: <Heading2 className="w-4 h-4" />,    desc: 'H2 — Alt başlık' },
  { type: 'heading3',   label: 'Küçük Başlık',  icon: <Heading3 className="w-4 h-4" />,    desc: 'H3 — Bölüm başlığı' },
  { type: 'image',      label: 'Görsel',         icon: <Image    className="w-4 h-4" />,    desc: 'Fotoğraf veya görsel ekle' },
  { type: 'code',       label: 'Kod Bloğu',      icon: <Code2    className="w-4 h-4" />,    desc: 'Syntax highlighted kod' },
  { type: 'quote',      label: 'Alıntı',         icon: <Quote    className="w-4 h-4" />,    desc: 'Blok alıntı' },
  { type: 'callout',    label: 'Çağrı Kutusu',   icon: <Lightbulb className="w-4 h-4" />,  desc: 'Renkli bildirim kutusu' },
  { type: 'divider',    label: 'Ayırıcı',        icon: <Minus    className="w-4 h-4" />,    desc: 'Bölüm ayırıcı' },
]

interface FormatBtnProps {
  label: string
  active?: boolean
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
  className?: string
}

function FormatBtn({ label, active, onClick, children, className }: FormatBtnProps) {
  return (
    <button
      title={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(e) }}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors shrink-0',
        active
          ? 'bg-brand-500/20 text-brand-400'
          : 'text-gray-400 hover:text-white hover:bg-white/8',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function ArticleToolbar() {
  const { activeBlockId, blocks, addBlock, updateBlock } = useArticleStore()
  const [addOpen, setAddOpen] = useState(false)
  const toolbarRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const [keyboardOpen, setKeyboardOpen] = useState(false)

  const activeBlock = blocks.find((b) => b.id === activeBlockId)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAddOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // iOS visualViewport: switch to fixed+pin when keyboard opens so toolbar never disappears
  useEffect(() => {
    const toolbar = toolbarRef.current
    if (!toolbar || !window.visualViewport) return

    const update = () => {
      const vv = window.visualViewport!
      const kbOpen = window.innerHeight - vv.height > 100

      setKeyboardOpen(kbOpen)

      if (kbOpen) {
        toolbar.style.position = 'fixed'
        toolbar.style.top = `${vv.offsetTop}px`
        toolbar.style.left = `${vv.offsetLeft}px`
        toolbar.style.width = `${vv.width}px`
        toolbar.style.zIndex = '50'
      } else {
        toolbar.style.position = ''
        toolbar.style.top = ''
        toolbar.style.left = ''
        toolbar.style.width = ''
        toolbar.style.zIndex = ''
      }
    }

    window.visualViewport.addEventListener('resize', update)
    window.visualViewport.addEventListener('scroll', update)
    return () => {
      window.visualViewport!.removeEventListener('resize', update)
      window.visualViewport!.removeEventListener('scroll', update)
    }
  }, [])

  const execFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    // Sync content back to store
    requestAnimationFrame(() => {
      if (!activeBlockId) return
      const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      if (el) updateBlock(activeBlockId, { content: el.innerHTML })
    })
  }

  const setBlockType = (type: BlockType) => {
    if (!activeBlockId) return
    const isText = ['paragraph', 'heading1', 'heading2', 'heading3'].includes(type)
    if (isText && activeBlock) {
      updateBlock(activeBlockId, { type })
    }
  }

  const handleAddBlock = (type: BlockType) => {
    setAddOpen(false)
    const afterId = activeBlockId ?? (blocks.length > 0 ? blocks[blocks.length - 1].id : null)
    const newId = addBlock(afterId, type)
    requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)
      el?.focus()
    })
  }

  const isTextActive = activeBlock && ['paragraph', 'heading1', 'heading2', 'heading3'].includes(activeBlock.type)

  return (
    <>
      {/* Spacer: prevents layout jump when toolbar switches to fixed on iOS keyboard open */}
      {keyboardOpen && <div ref={spacerRef} className="h-12 shrink-0" />}
    <div
      ref={toolbarRef}
      className="sticky top-0 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-border"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-0.5 h-12 overflow-x-auto scrollbar-hide">
          {/* ── Inline formatting ── */}
          <FormatBtn label="Kalın (⌘B)" onClick={() => execFormat('bold')}>
            <Bold className="w-4 h-4" />
          </FormatBtn>
          <FormatBtn label="İtalik (⌘I)" onClick={() => execFormat('italic')}>
            <Italic className="w-4 h-4" />
          </FormatBtn>
          <FormatBtn label="Altı Çizili (⌘U)" onClick={() => execFormat('underline')}>
            <Underline className="w-4 h-4" />
          </FormatBtn>
          <FormatBtn label="Üstü Çizili" onClick={() => execFormat('strikeThrough')}>
            <Strikethrough className="w-4 h-4" />
          </FormatBtn>

          <div className="w-px h-5 bg-surface-border mx-1 shrink-0" />

          {/* ── Heading shortcuts ── */}
          <FormatBtn
            label="H1"
            active={activeBlock?.type === 'heading1'}
            onClick={() => setBlockType('heading1')}
            className="text-[11px] font-bold w-9"
          >
            H1
          </FormatBtn>
          <FormatBtn
            label="H2"
            active={activeBlock?.type === 'heading2'}
            onClick={() => setBlockType('heading2')}
            className="text-[11px] font-bold w-9"
          >
            H2
          </FormatBtn>
          <FormatBtn
            label="H3"
            active={activeBlock?.type === 'heading3'}
            onClick={() => setBlockType('heading3')}
            className="text-[11px] font-bold w-9"
          >
            H3
          </FormatBtn>
          {isTextActive && (
            <FormatBtn
              label="Paragraf"
              active={activeBlock?.type === 'paragraph'}
              onClick={() => setBlockType('paragraph')}
              className="text-[11px] font-medium w-9"
            >
              P
            </FormatBtn>
          )}

          <div className="w-px h-5 bg-surface-border mx-1 shrink-0" />

          {/* ── Insert link ── */}
          <FormatBtn
            label="Link ekle"
            onClick={() => {
              const url = window.prompt('URL girin:')
              if (url) execFormat('createLink', url)
            }}
          >
            <span className="text-[11px] font-medium">URL</span>
          </FormatBtn>

          {/* ── Code inline ── */}
          <FormatBtn label="Satır içi kod" onClick={() => {
            const sel = window.getSelection()
            if (!sel || sel.isCollapsed) return
            const text = sel.toString()
            document.execCommand('insertHTML', false, `<code style="font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px">${text}</code>`)
            if (activeBlockId) {
              const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
              if (el) updateBlock(activeBlockId, { content: el.innerHTML })
            }
          }}>
            <Code2 className="w-4 h-4" />
          </FormatBtn>

          <div className="flex-1" />

          {/* ── Add block button ── */}
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              onMouseDown={(e) => { e.preventDefault(); setAddOpen((v) => !v) }}
              className={cn(
                'flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors',
                'bg-brand-500 hover:bg-brand-600 text-white',
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Blok Ekle</span>
              <ChevronDown className={cn('w-3 h-3 transition-transform', addOpen && 'rotate-180')} />
            </button>

            {addOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden">
                <div className="p-1.5">
                  {ADD_BLOCKS.map((b) => (
                    <button
                      key={b.type}
                      onMouseDown={(e) => { e.preventDefault(); handleAddBlock(b.type) }}
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
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  )
}
