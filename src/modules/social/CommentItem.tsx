import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Reply, ChevronDown, ChevronUp, Send } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useCommentStore } from '@store/commentStore'
import { useAuthStore } from '@store/authStore'
import type { Comment } from '@/types'
import toast from 'react-hot-toast'

function renderContent(content: string) {
  const parts = content.split(/(@\w+|#\w+)/g)
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      return <Link key={i} to={`/profile/${part.slice(1)}`} className="text-brand-400 hover:underline">{part}</Link>
    }
    if (part.startsWith('#')) {
      return <Link key={i} to={`/explore?tag=${part.slice(1)}`} className="text-brand-400 hover:underline">{part}</Link>
    }
    return part
  })
}

interface CommentItemProps {
  comment: Comment
  postId: string
  depth?: number
}

export default function CommentItem({ comment, postId, depth = 0 }: CommentItemProps) {
  const { isAuthenticated } = useAuthStore()
  const { toggleLike, addReply } = useCommentStore()
  const [showReplies, setShowReplies] = useState(true)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleLike = async () => {
    if (!isAuthenticated) return
    try {
      await toggleLike(postId, comment.id)
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!replyText.trim() || submitting) return
    setSubmitting(true)
    try {
      await addReply(postId, comment.id, replyText.trim())
      setReplyText('')
      setShowReplyBox(false)
    } catch {
      toast.error('Yanıt gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id={`comment-${comment.id}`} className={cn('flex gap-3', depth > 0 && 'ml-8 pl-3 border-l border-surface-border')}>
      <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="sm" className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="bg-surface-raised border border-surface-border rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/profile/${comment.author.username}`} className="text-sm font-medium text-white hover:text-brand-300">
              {comment.author.displayName}
            </Link>
            <span className="text-xs text-gray-600">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{renderContent(comment.content)}</p>
        </div>

        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={handleLike}
            className={cn('flex items-center gap-1 text-xs transition-colors', comment.isLiked ? 'text-red-400' : 'text-gray-600 hover:text-red-400')}
          >
            <Heart className={cn('w-3 h-3', comment.isLiked && 'fill-current')} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>
          {isAuthenticated && depth === 0 && (
            <button
              onClick={() => setShowReplyBox((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-400 transition-colors"
            >
              <Reply className="w-3 h-3" />
              Yanıtla
            </button>
          )}
          {comment.replies.length > 0 && (
            <button
              onClick={() => setShowReplies((p) => !p)}
              className="flex items-center gap-1 text-xs text-gray-600 hover:text-gray-300 transition-colors ml-auto"
            >
              {showReplies ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {comment.replies.length} yanıt
            </button>
          )}
        </div>

        {showReplyBox && (
          <form onSubmit={handleReply} className="mt-2 flex gap-2">
            <div className="flex-1 flex items-end gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2">
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={`@${comment.author.username} yanıtla...`}
                rows={1}
                className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none"
                style={{ minHeight: '24px', maxHeight: '80px' }}
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement
                  t.style.height = 'auto'
                  t.style.height = t.scrollHeight + 'px'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleReply(e as unknown as React.FormEvent)
                  }
                }}
              />
              <button
                type="submit"
                disabled={!replyText.trim() || submitting}
                className="shrink-0 p-1.5 rounded-lg text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
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
