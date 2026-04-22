import { useEffect, useState } from 'react'
import {
  Bold, Italic, Underline, Strikethrough,
  Code2, Link2,
} from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'

function Btn({
  active, onAction, title, children,
}: {
  active?: boolean
  onAction: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onAction() }}
      className={cn(
        'w-7 h-7 flex items-center justify-center rounded transition-colors',
        active
          ? 'bg-white/20 text-white'
          : 'text-gray-400 hover:text-white hover:bg-white/10',
      )}
    >
      {children}
    </button>
  )
}

const SEP = <div className="w-px h-4 bg-white/15 mx-0.5 shrink-0" />

export default function FloatingFormatToolbar() {
  const { activeBlockId, blocks, updateBlock } = useArticleStore()
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strikeThrough: false })

  useEffect(() => {
    const onSelection = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed || !sel.rangeCount) { setPos(null); return }

      const range = sel.getRangeAt(0)
      const node = range.commonAncestorContainer
      const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node as Element
      if (!el?.closest('[data-block-id]')) { setPos(null); return }

      const rect = range.getBoundingClientRect()
      if (!rect.width) { setPos(null); return }

      const TOOLBAR_W = 296
      const centerX = rect.left + rect.width / 2
      const left = Math.max(TOOLBAR_W / 2 + 8, Math.min(window.innerWidth - TOOLBAR_W / 2 - 8, centerX))

      setPos({ top: rect.top - 48, left })

      try {
        setFmt({
          bold:          document.queryCommandState('bold'),
          italic:        document.queryCommandState('italic'),
          underline:     document.queryCommandState('underline'),
          strikeThrough: document.queryCommandState('strikeThrough'),
        })
      } catch { /* ignore */ }
    }

    document.addEventListener('selectionchange', onSelection)
    return () => document.removeEventListener('selectionchange', onSelection)
  }, [])

  const exec = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    requestAnimationFrame(() => {
      if (!activeBlockId) return
      const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      if (el) updateBlock(activeBlockId, { content: el.innerHTML })
    })
  }

  const inlineCode = () => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed) return
    const text = sel.toString()
    document.execCommand(
      'insertHTML', false,
      `<code style="font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px">${text}</code>`,
    )
    if (activeBlockId) {
      const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      if (el) updateBlock(activeBlockId, { content: el.innerHTML })
    }
  }

  const setType = (type: BlockType) => {
    if (!activeBlockId) return
    if (blocks.some((b) => b.id === activeBlockId)) updateBlock(activeBlockId, { type })
  }

  if (!pos) return null

  return (
    <div
      style={{ position: 'fixed', top: Math.max(8, pos.top), left: pos.left, transform: 'translateX(-50%)', zIndex: 60 }}
      onMouseDown={(e) => e.preventDefault()}
      className="flex items-center gap-0.5 bg-gray-950 border border-white/10 rounded-lg shadow-2xl px-1.5 py-1"
    >
      <Btn active={fmt.bold}          onAction={() => exec('bold')}          title="Kalın (⌘B)"><Bold          className="w-3.5 h-3.5" /></Btn>
      <Btn active={fmt.italic}        onAction={() => exec('italic')}        title="İtalik (⌘I)"><Italic        className="w-3.5 h-3.5" /></Btn>
      <Btn active={fmt.underline}     onAction={() => exec('underline')}     title="Altı çizili (⌘U)"><Underline     className="w-3.5 h-3.5" /></Btn>
      <Btn active={fmt.strikeThrough} onAction={() => exec('strikeThrough')} title="Üstü çizili"><Strikethrough className="w-3.5 h-3.5" /></Btn>
      {SEP}
      <Btn onAction={inlineCode} title="Satır içi kod"><Code2 className="w-3.5 h-3.5" /></Btn>
      <Btn onAction={() => { const url = window.prompt('URL:'); if (url) exec('createLink', url) }} title="Link ekle"><Link2 className="w-3.5 h-3.5" /></Btn>
      {SEP}
      <Btn onAction={() => setType('heading1')} title="H1"><span className="text-[10px] font-bold">H1</span></Btn>
      <Btn onAction={() => setType('heading2')} title="H2"><span className="text-[10px] font-bold">H2</span></Btn>
      <Btn onAction={() => setType('heading3')} title="H3"><span className="text-[10px] font-bold">H3</span></Btn>
      <Btn onAction={() => setType('paragraph')} title="Paragraf"><span className="text-[10px] font-medium">P</span></Btn>
    </div>
  )
}
