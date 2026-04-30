import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { IconHeart, IconArrowBackUp, IconChevronDown, IconChevronUp, IconSend, IconDots, IconPencil, IconTrash, IconCode, IconMoodSmile } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useCommentStore } from '@store/commentStore'
import { useAuthStore } from '@store/authStore'
import { CommentContent, SnippetPanel, EmojiPicker, insertAtCursor } from './CommentSnippet'
import type { Comment } from '@/types'
import toast from 'react-hot-toast'

interface CommentItemProps {
  comment: Comment
  postId: string
  depth?: number
}

export default function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { isAuthenticated, user } = useAuthStore()
  const { toggleLike, addReply, editComment, deleteComment } = useCommentStore()
  const [showReplies,       setShowReplies]       = useState(true)
  const [showReplyBox,      setShowReplyBox]       = useState(false)
  const [replyText,         setReplyText]         = useState('')
  const [submitting,        setSubmitting]        = useState(false)
  const [showReplySnippet,  setShowReplySnippet]  = useState(false)
  const [showReplyEmoji,    setShowReplyEmoji]    = useState(false)

  const [menuOpen,          setMenuOpen]          = useState(false)
  const [editMode,          setEditMode]          = useState(false)
  const [editText,          setEditText]          = useState(comment.content)
  const [editSubmitting,    setEditSubmitting]    = useState(false)
  const [showEditSnippet,   setShowEditSnippet]   = useState(false)
  const [showEditEmoji,     setShowEditEmoji]     = useState(false)

  const menuRef         = useRef<HTMLDivElement>(null)
  const replyRef        = useRef<HTMLTextAreaElement>(null)
  const replyEmojiBtnRef = useRef<HTMLButtonElement>(null)
  const editRef         = useRef<HTMLTextAreaElement>(null)
  const editEmojiBtnRef = useRef<HTMLButtonElement>(null)

  const isOwner = !!user && user.id === comment.author.id

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  useEffect(() => {
    const el = replyRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [replyText, showReplyBox])

  useEffect(() => {
    const el = editRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [editText])

  const handleLike = async () => {
    if (!isAuthenticated) return
    try { await toggleLike(postId, comment.id) }
    catch { toast.error('Bir hata oluştu') }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      await addReply(postId, comment.id, replyText.trim())
      setReplyText('')
      setShowReplyBox(false)
      setShowReplySnippet(false)
      setShowReplyEmoji(false)
    } catch {
      toast.error('Yanıt gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editText.trim() || editSubmitting) return
    setEditSubmitting(true)
    try {
      await editComment(postId, comment.id, editText.trim())
      setEditMode(false)
      setShowEditSnippet(false)
      setShowEditEmoji(false)
      toast.success('Yorum güncellendi')
    } catch {
      toast.error('Yorum güncellenemedi')
    } finally {
      setEditSubmitting(false)
    }
  }

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!window.confirm('Bu yorumu silmek istediğine emin misin?')) return
    try {
      await deleteComment(postId, comment.id)
      toast.success('Yorum silindi')
    } catch {
      toast.error('Yorum silinemedi')
    }
  }

  return (
    <div id={`comment-${comment.id}`} className={cn(depth === 0 ? 'flex gap-3' : 'pl-3 border-l border-surface-border')}>
      {depth === 0 && (
        <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="sm" className="mt-0.5 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <div className="bg-surface-raised border border-surface-border rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            {depth > 0 && (
              <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="xs" className="shrink-0" />
            )}
            <Link to={`/profile/${comment.author.username}`} className="text-sm font-medium text-white hover:text-brand-300">
              {comment.author.displayName}
            </Link>
            <span className="text-xs text-gray-600">{timeAgo(comment.createdAt)}</span>
            {comment.updatedAt !== comment.createdAt && (
              <span className="text-xs text-gray-700">(düzenlendi)</span>
            )}
            {isOwner && (
              <div className="relative ml-auto" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((p) => !p)}
                  className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
                >
                  <IconDots className="w-3.5 h-3.5" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-full mt-1 z-20 card shadow-xl py-1 min-w-[120px]">
                    <button
                      onClick={() => { setEditText(comment.content); setEditMode(true); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-surface-raised hover:text-white transition-colors"
                    >
                      <IconPencil className="w-3.5 h-3.5" />
                      Düzenle
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-surface-raised transition-colors"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                      Sil
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleEdit} className="flex flex-col gap-2 mt-1">
              <textarea
                ref={editRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={2}
                className="w-full bg-surface border border-surface-border rounded-lg px-2 py-1.5 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-brand-500"
                style={{ minHeight: '40px' }}
                autoFocus
              />
              {showEditSnippet && (
                <SnippetPanel
                  onInsert={(s) => insertAtCursor(editRef.current, editText, s, setEditText)}
                  onClose={() => setShowEditSnippet(false)}
                />
              )}
              <div className="flex items-center justify-between">
                <div className="relative flex items-center gap-0.5">
                  {showEditEmoji && (
                    <EmojiPicker
                      anchorRef={editEmojiBtnRef}
                      onSelect={(e) => insertAtCursor(editRef.current, editText, e, setEditText)}
                      onClose={() => setShowEditEmoji(false)}
                    />
                  )}
                  <button
                    ref={editEmojiBtnRef}
                    type="button"
                    onClick={() => { setShowEditEmoji((v) => !v); setShowEditSnippet(false) }}
                    title="Emoji ekle"
                    className={cn('p-1.5 rounded-lg transition-colors text-xs', showEditEmoji ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300')}
                  >
                    <IconMoodSmile className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowEditSnippet((v) => !v); setShowEditEmoji(false) }}
                    title="Snippet ekle"
                    className={cn('p-1.5 rounded-lg transition-colors', showEditSnippet ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300')}
                  >
                    <IconCode className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setEditMode(false); setShowEditSnippet(false); setShowEditEmoji(false) }}
                    className="text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    disabled={!editText.trim() || editSubmitting}
                    className="text-xs text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors px-2 py-1 font-medium"
                  >
                    {editSubmitting ? 'Kaydediliyor...' : 'Kaydet'}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <CommentContent content={comment.content} />
          )}
        </div>

        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={handleLike}
            className={cn('flex items-center gap-1 text-xs transition-colors', comment.isLiked ? 'text-red-400' : 'text-gray-600 hover:text-red-400')}
          >
            <IconHeart className={cn('w-3 h-3', comment.isLiked && 'fill-current')} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>
          {isAuthenticated && depth === 0 && (
            <button
              onClick={() => setShowReplyBox((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-400 transition-colors"
            >
              <IconArrowBackUp className="w-3 h-3" />
              Yanıtla
            </button>
          )}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors ml-auto"
            >
              {showReplies ? <IconChevronUp className="w-3 h-3" /> : <IconChevronDown className="w-3 h-3" />}
              {comment.replies.length} yanıt
            </button>
          )}
        </div>

        {showReplyBox && (
          <form onSubmit={handleReply} className="mt-2 pl-3 border-l-2 border-surface-border">
            <div className="flex items-end gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2">
              <textarea
                ref={replyRef}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${comment.author.username} yanıtla...`}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none"
                style={{ minHeight: '24px' }}
              />
              <div className="relative flex items-center gap-0.5 shrink-0">
                {showReplyEmoji && (
                  <EmojiPicker
                    anchorRef={replyEmojiBtnRef}
                    onSelect={(e) => insertAtCursor(replyRef.current, replyText, e, setReplyText)}
                    onClose={() => setShowReplyEmoji(false)}
                  />
                )}
                <button
                  ref={replyEmojiBtnRef}
                  type="button"
                  onClick={() => { setShowReplyEmoji((v) => !v); setShowReplySnippet(false) }}
                  title="Emoji ekle"
                  className={cn('p-1.5 rounded-lg transition-colors', showReplyEmoji ? 'text-yellow-400' : 'text-gray-600 hover:text-gray-300')}
                >
                  <IconMoodSmile className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => { setShowReplySnippet((v) => !v); setShowReplyEmoji(false) }}
                  title="Snippet ekle"
                  className={cn('p-1.5 rounded-lg transition-colors', showReplySnippet ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300')}
                >
                  <IconCode className="w-3.5 h-3.5" />
                </button>
                <button
                  type="submit"
                  disabled={!replyText.trim() || submitting}
                  className="shrink-0 p-1.5 rounded-lg text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors"
                >
                  <IconSend className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {showReplySnippet && (
              <SnippetPanel
                onInsert={(snippet) => insertAtCursor(replyRef.current, replyText, snippet, setReplyText)}
                onClose={() => setShowReplySnippet(false)}
              />
            )}
          </form>
        )}

        {showReplies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} postId={postId} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
