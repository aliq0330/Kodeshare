import { useEffect, useRef } from 'react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'

const PLACEHOLDER: Record<string, string> = {
  paragraph: 'Yazmaya başla...',
  heading1: 'Büyük başlık',
  heading2: 'Orta başlık',
  heading3: 'Küçük başlık',
  quote: 'Alıntı yaz...',
  callout: 'Çağrı metni...',
}

const TEXT_STYLES: Record<string, string> = {
  paragraph:
    'text-[17px] leading-[1.85] text-gray-200 dark:text-gray-200 light:text-gray-800 font-normal',
  heading1:
    'text-4xl sm:text-5xl font-extrabold leading-tight tracking-tight text-white dark:text-white light:text-gray-900',
  heading2:
    'text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white dark:text-white light:text-gray-900',
  heading3:
    'text-2xl sm:text-3xl font-semibold leading-snug text-white dark:text-white light:text-gray-900',
}

interface Props {
  block: ArticleBlock
  onFocusNext?: () => void
  onFocusPrev?: () => void
}

export default function TextBlock({ block, onFocusNext, onFocusPrev }: Props) {
  const { updateBlock, removeBlock, addBlock, setActiveBlock } = useArticleStore()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = block.content ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sync = () => {
    if (ref.current) updateBlock(block.id, { content: ref.current.innerHTML })
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && block.type === 'paragraph') {
      e.preventDefault()
      const newId = addBlock(block.id, 'paragraph')
      requestAnimationFrame(() => {
        document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
      })
    }
    if (e.key === 'Backspace' && !ref.current?.textContent?.trim()) {
      e.preventDefault()
      removeBlock(block.id)
      onFocusPrev?.()
    }
    if (e.key === 'ArrowDown' && onFocusNext && ref.current) {
      const sel = window.getSelection()
      if (sel?.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        const endRange = document.createRange()
        endRange.selectNodeContents(ref.current)
        endRange.collapse(false)
        if (range.compareBoundaryPoints(Range.START_TO_START, endRange) >= 0) {
          e.preventDefault()
          onFocusNext()
        }
      }
    }
    if (e.key === 'ArrowUp' && onFocusPrev && ref.current) {
      const sel = window.getSelection()
      if (sel?.isCollapsed && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0)
        const startRange = document.createRange()
        startRange.selectNodeContents(ref.current)
        startRange.collapse(true)
        if (range.compareBoundaryPoints(Range.START_TO_START, startRange) <= 0) {
          e.preventDefault()
          onFocusPrev()
        }
      }
    }
  }

  const isTextBlock = ['paragraph', 'heading1', 'heading2', 'heading3'].includes(block.type)
  const className = isTextBlock
    ? TEXT_STYLES[block.type]
    : block.type === 'quote'
    ? 'text-[17px] leading-[1.85] italic text-gray-300 dark:text-gray-300 light:text-gray-600'
    : 'text-[16px] leading-relaxed text-gray-200'

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      data-block-id={block.id}
      className={cn(
        className,
        'outline-none w-full',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-600 empty:before:pointer-events-none',
      )}
      data-placeholder={PLACEHOLDER[block.type] ?? 'Yaz...'}
      onInput={sync}
      onFocus={() => setActiveBlock(block.id)}
      onBlur={() => setActiveBlock(null)}
      onKeyDown={handleKeyDown}
    />
  )
}
