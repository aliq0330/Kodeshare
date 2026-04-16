import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Reply, ChevronDown, ChevronUp } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import type { Comment } from '@/types'

interface CommentItemProps {
  comment: Comment
  depth?: number
}

export default function CommentItem({ comment, depth = 0 }: CommentItemProps) {
  const [showReplies, setShowReplies] = useState(true)
  const [isLiked, setIsLiked] = useState(comment.isLiked)
  const [likesCount, setLikesCount] = useState(comment.likesCount)
  const [showReplyBox, setShowReplyBox] = useState(false)
  const [replyText, setReplyText] = useState('')

  const toggleLike = () => {
    setIsLiked((p) => !p)
    setLikesCount((n) => n + (isLiked ? -1 : 1))
  }

  return (
    <div className={cn('flex gap-3', depth > 0 && 'ml-8 pl-3 border-l border-surface-border')}>
      <Avatar src={comment.author.avatarUrl} alt={comment.author.displayName} size="sm" className="mt-0.5 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="bg-surface-raised rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 mb-1">
            <Link to={`/profile/${comment.author.username}`} className="text-sm font-medium text-white hover:text-brand-300">
              {comment.author.displayName}
            </Link>
            <span className="text-xs text-gray-600">{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{comment.content}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-1 px-1">
          <button
            onClick={toggleLike}
            className={cn('flex items-center gap-1 text-xs transition-colors', isLiked ? 'text-red-400' : 'text-gray-600 hover:text-red-400')}
          >
            <Heart className={cn('w-3 h-3', isLiked && 'fill-current')} />
            {likesCount > 0 && likesCount}
          </button>
          <button
            onClick={() => setShowReplyBox((p) => !p)}
            className="flex items-center gap-1 text-xs text-gray-600 hover:text-brand-400 transition-colors"
          >
            <Reply className="w-3 h-3" />
            Yanıtla
          </button>
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

        {/* Reply box */}
        {showReplyBox && (
          <div className="mt-2 flex gap-2">
            <input
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`@${comment.author.username} yanıtla...`}
              className="flex-1 bg-surface-raised border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
            <button
              disabled={!replyText.trim()}
              className="px-3 py-1.5 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-medium disabled:opacity-40 transition-colors"
            >
              Gönder
            </button>
          </div>
        )}

        {/* Nested replies */}
        {showReplies && comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
