import { useCallback, useEffect, useRef, useState } from 'react'
import { IconLoader2 } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'
import { userService } from '@services/userService'
import type { User } from '@/types'

const PLACEHOLDER: Record<string, string> = {
  paragraph: 'Yazmaya başla... (@mention, #etiket)',
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

interface TriggerState {
  type: 'mention' | 'tag'
  query: string
  x: number
  y: number
}

interface Props {
  block: ArticleBlock
  onFocusNext?: () => void
  onFocusPrev?: () => void
}

export default function TextBlock({ block, onFocusNext, onFocusPrev }: Props) {
  const { updateBlock, removeBlock, setActiveBlock } = useArticleStore()
  const ref = useRef<HTMLDivElement>(null)
  const triggerActiveRef = useRef(false)
  const triggerTypeRef = useRef<'mention' | 'tag' | null>(null)

  const [trigger, setTrigger] = useState<TriggerState | null>(null)
  const [mentionResults, setMentionResults] = useState<User[]>([])
  const [mentionLoading, setMentionLoading] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = block.content ?? ''
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sync = () => {
    if (ref.current) updateBlock(block.id, { content: ref.current.innerHTML })
  }

  // Load mention suggestions when trigger opens or query changes
  useEffect(() => {
    if (!trigger || trigger.type !== 'mention') {
      setMentionResults([])
      return
    }
    const q = trigger.query.trim()
    setMentionLoading(true)
    if (!q) {
      userService.getSuggested()
        .then(r => { setMentionResults(r); setMentionLoading(false) })
        .catch(() => setMentionLoading(false))
      return
    }
    const t = setTimeout(() => {
      userService.search(q)
        .then(r => { setMentionResults(r); setMentionLoading(false) })
        .catch(() => setMentionLoading(false))
    }, 250)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger?.query, trigger?.type])

  const getCaretCoords = (): { x: number; y: number } => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount) return { x: 0, y: 0 }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    if (rect.height > 0) return { x: rect.left, y: rect.bottom }
    const blockRect = ref.current?.getBoundingClientRect()
    return blockRect ? { x: blockRect.left, y: blockRect.top + 28 } : { x: 0, y: 0 }
  }

  const closeTrigger = useCallback(() => {
    triggerActiveRef.current = false
    triggerTypeRef.current = null
    setTrigger(null)
    setMentionResults([])
    setMentionLoading(false)
    setSelectedIdx(0)
  }, [])

  const getTextBeforeCursor = (): string => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !ref.current) return ''
    const range = sel.getRangeAt(0)
    if (!range.collapsed) return ''
    const pre = range.cloneRange()
    pre.selectNodeContents(ref.current)
    pre.setEnd(range.endContainer, range.endOffset)
    return pre.toString()
  }

  const checkTrigger = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || !sel.rangeCount || !ref.current || !sel.getRangeAt(0).collapsed) {
      if (triggerActiveRef.current) closeTrigger()
      return
    }

    const text = getTextBeforeCursor()

    if (triggerActiveRef.current && triggerTypeRef.current) {
      const tChar = triggerTypeRef.current === 'mention' ? '@' : '#'
      const idx = text.lastIndexOf(tChar)
      if (idx === -1) { closeTrigger(); return }
      const query = text.slice(idx + 1)
      // Close if user typed a space (abandoned trigger)
      if (/\s/.test(query)) { closeTrigger(); return }
      const coords = getCaretCoords()
      setTrigger({ type: triggerTypeRef.current, query, x: coords.x, y: coords.y })
      return
    }

    const last = text[text.length - 1]
    const prev = text[text.length - 2]
    // Only trigger at start of block or after whitespace
    if ((last === '@' || last === '#') && (!prev || /\s/.test(prev))) {
      triggerActiveRef.current = true
      triggerTypeRef.current = last === '@' ? 'mention' : 'tag'
      const coords = getCaretCoords()
      setTrigger({ type: triggerTypeRef.current, query: '', x: coords.x, y: coords.y })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closeTrigger])

  const insertMentionInline = (user: User) => {
    if (!trigger) return
    const { query } = trigger
    closeTrigger()
    ref.current?.focus()
    for (let i = 0; i < query.length + 1; i++) document.execCommand('delete', false)
    document.execCommand(
      'insertHTML', false,
      `<a href="/profile/${user.username}" data-mention="${user.username}" class="article-mention">@${user.username}</a>&nbsp;`
    )
    requestAnimationFrame(() => {
      if (ref.current) updateBlock(block.id, { content: ref.current.innerHTML })
    })
  }

  const insertTagInline = () => {
    if (!trigger || trigger.type !== 'tag') return
    const tag = trigger.query.trim().replace(/\s+/g, '')
    if (!tag) { closeTrigger(); return }
    const { query } = trigger
    closeTrigger()
    ref.current?.focus()
    for (let i = 0; i < query.length + 1; i++) document.execCommand('delete', false)
    document.execCommand(
      'insertHTML', false,
      `<a href="/explore?tag=${tag}" data-tag="${tag}" class="article-tag">#${tag}</a>&nbsp;`
    )
    requestAnimationFrame(() => {
      if (ref.current) updateBlock(block.id, { content: ref.current.innerHTML })
    })
  }

  const handleInput = () => {
    sync()
    checkTrigger()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Trigger-mode keyboard handling
    if (trigger) {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeTrigger()
        return
      }
      if (trigger.type === 'tag' && e.key === 'Enter') {
        e.preventDefault()
        insertTagInline()
        return
      }
      if (trigger.type === 'mention') {
        if (e.key === 'Enter') {
          e.preventDefault()
          if (mentionResults.length > 0) insertMentionInline(mentionResults[selectedIdx])
          else closeTrigger()
          return
        }
        if (e.key === 'ArrowDown' && mentionResults.length > 0) {
          e.preventDefault()
          setSelectedIdx(i => Math.min(i + 1, mentionResults.length - 1))
          return
        }
        if (e.key === 'ArrowUp' && mentionResults.length > 0) {
          e.preventDefault()
          setSelectedIdx(i => Math.max(i - 1, 0))
          return
        }
      }
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

  // Clamp popup so it doesn't overflow the viewport
  const popupLeft = (x: number, width: number) =>
    Math.max(8, Math.min(x, (typeof window !== 'undefined' ? window.innerWidth : 800) - width - 8))

  return (
    <>
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
        onInput={handleInput}
        onFocus={() => setActiveBlock(block.id)}
        onBlur={() => { setActiveBlock(null); closeTrigger() }}
        onKeyDown={handleKeyDown}
      />

      {/* ── Inline mention popup ── */}
      {trigger?.type === 'mention' && (
        <div
          style={{ position: 'fixed', left: popupLeft(trigger.x, 288), top: trigger.y + 6, zIndex: 9999 }}
          className="w-72 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-hidden"
        >
          <div className="max-h-52 overflow-y-auto">
            {mentionLoading && (
              <div className="flex items-center justify-center py-4">
                <IconLoader2 className="w-4 h-4 animate-spin text-gray-500" />
              </div>
            )}
            {!mentionLoading && mentionResults.length === 0 && (
              <p className="text-xs text-gray-500 px-3 py-3 text-center">
                {trigger.query ? 'Kullanıcı bulunamadı' : 'Önerilen kullanıcılar...'}
              </p>
            )}
            {mentionResults.map((user, i) => (
              <button
                key={user.id}
                onMouseDown={(e) => { e.preventDefault(); insertMentionInline(user) }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 text-left transition-colors',
                  i === selectedIdx ? 'bg-surface-raised' : 'hover:bg-surface-raised',
                )}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center shrink-0 text-xs font-medium text-brand-400">
                    {user.username[0]?.toUpperCase()}
                  </div>
                )}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-white truncate">{user.displayName}</span>
                  <span className="block text-xs text-gray-500">@{user.username}</span>
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 py-1.5 border-t border-surface-border bg-surface-raised/30">
            <p className="text-xs text-gray-600">↑↓ Seç · Enter Ekle · ESC İptal</p>
          </div>
        </div>
      )}

      {/* ── Inline tag popup ── */}
      {trigger?.type === 'tag' && (
        <div
          style={{ position: 'fixed', left: popupLeft(trigger.x, 208), top: trigger.y + 6, zIndex: 9999 }}
          className="w-52 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-3"
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm font-medium" style={{ color: '#34d399' }}>
              #{trigger.query || '…'}
            </span>
            {trigger.query && (
              <span className="text-xs text-gray-500 bg-surface-raised px-1.5 py-0.5 rounded-md">etiket</span>
            )}
          </div>
          <p className="text-xs text-gray-600">
            {trigger.query ? '↵ Enter ile ekle' : 'Etiket adı yaz…'}
            {' · '}ESC ile iptal
          </p>
        </div>
      )}
    </>
  )
}
