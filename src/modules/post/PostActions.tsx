import { Heart, MessageCircle, Bookmark, GitFork } from 'lucide-react'
import { cn } from '@utils/cn'
import { compactNumber } from '@utils/formatters'
import type { PostPreview } from '@/types'

interface PostActionsProps {
  post: PostPreview
  onLike?: () => void
  onSave?: () => void
  onShare?: () => void
  onRepost?: () => void
  showCounts?: boolean
}

export default function PostActions({ post, onLike, onSave, onShare, onRepost, showCounts = true }: PostActionsProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={onLike}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors',
          post.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400',
        )}
      >
        <Heart className={cn('w-4 h-4', post.isLiked && 'fill-current')} />
        {showCounts && compactNumber(post.likesCount)}
      </button>

      <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors">
        <MessageCircle className="w-4 h-4" />
        {showCounts && compactNumber(post.commentsCount)}
      </button>

      <button
        onClick={onRepost}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors',
          post.isReposted ? 'text-green-400' : 'text-gray-500 hover:text-green-400',
        )}
      >
        <GitFork className="w-4 h-4" />
        {showCounts && compactNumber(post.sharesCount)}
      </button>

      <button
        onClick={onSave}
        className={cn(
          'ml-auto flex items-center gap-1.5 text-sm transition-colors',
          post.isSaved ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400',
        )}
      >
        <Bookmark className={cn('w-4 h-4', post.isSaved && 'fill-current')} />
      </button>
    </div>
  )
}
