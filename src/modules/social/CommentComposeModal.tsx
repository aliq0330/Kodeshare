import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconX, IconCode, IconMoodSmile } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { SnippetPanel, EmojiPicker, insertAtCursor } from './CommentSnippet'
import { useAuthStore } from '@store/authStore'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'

export interface ComposeContext {
  author: {
    avatarUrl: string | null
    displayName: string
    username: string
  }
  content: string
}

interface CommentComposeModalProps {
  open: boolean
  onClose: () => void
  context: ComposeContext
  placeholder?: string
  onSubmit: (text: string) => Promise<void>
}

export default function CommentComposeModal({
  open,
  onClose,
  context,
  placeholder = 'Yanıtını yaz...',
  onSubmit,
}: CommentComposeModalProps) {
  const { user } = useAuthStore()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)
  const [showSnippet, setShowSnippet] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) {
      setText('')
      setShowEmoji(false)
      setShowSnippet(false)
    } else {
      setTimeout(() => textareaRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`
  }, [text])

  if (!open) return null

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      await onSubmit(text.trim())
      onClose()
    } catch {
      toast.error('Gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-surface-card rounded-2xl shadow-2xl z-10 animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-surface-border">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 max-h-[calc(100dvh-8rem)] overflow-y-auto">

          {/* Context row (post / comment being replied to) */}
          <div className="flex gap-3 mb-0">
            <div className="flex flex-col items-center shrink-0" style={{ width: 36 }}>
              <Avatar src={context.author.avatarUrl} alt={context.author.displayName} size="sm" />
              <div className="w-0.5 bg-surface-border flex-1 mt-2 min-h-[28px]" />
            </div>
            <div className="flex-1 pb-4 min-w-0">
              <p className="text-sm font-semibold text-white leading-none mb-1">
                {context.author.displayName}
              </p>
              <p className="text-sm text-gray-400 leading-relaxed line-clamp-5 whitespace-pre-wrap">
                {context.content}
              </p>
            </div>
          </div>

          {/* Compose row */}
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="shrink-0" style={{ width: 36 }}>
              <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" />
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={placeholder}
                rows={3}
                className="w-full bg-transparent text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none leading-relaxed"
                style={{ minHeight: '72px' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault()
                    void handleSubmit()
                  }
                }}
              />

              {/* Toolbar */}
              <div className="flex items-center gap-0.5 mt-2 border-t border-surface-border/50 pt-2">
                <div className="relative">
                  {showEmoji && (
                    <EmojiPicker
                      anchorRef={emojiBtnRef}
                      onSelect={(e) => insertAtCursor(textareaRef.current, text, e, setText)}
                      onClose={() => setShowEmoji(false)}
                    />
                  )}
                  <button
                    ref={emojiBtnRef}
                    type="button"
                    title="Emoji ekle"
                    onClick={() => { setShowEmoji((v) => !v); setShowSnippet(false) }}
                    className={cn('p-1.5 rounded-lg transition-colors', showEmoji ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300')}
                  >
                    <IconMoodSmile className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  title="Snippet ekle"
                  onClick={() => { setShowSnippet((v) => !v); setShowEmoji(false) }}
                  className={cn('p-1.5 rounded-lg transition-colors', showSnippet ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300')}
                >
                  <IconCode className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={!text.trim() || submitting}
                  onClick={() => void handleSubmit()}
                  className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand-500 hover:bg-brand-400 disabled:opacity-40 text-white text-sm font-semibold transition-colors"
                >
                  {submitting && <Spinner className="w-3.5 h-3.5" />}
                  Gönder
                </button>
              </div>

              {showSnippet && (
                <SnippetPanel
                  onInsert={(snippet) => insertAtCursor(textareaRef.current, text, snippet, setText)}
                  onClose={() => setShowSnippet(false)}
                />
              )}
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  )
}
