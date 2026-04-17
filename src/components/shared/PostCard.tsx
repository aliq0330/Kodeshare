import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Play, GitFork, FolderPlus } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import { compactNumber, timeAgo } from '@utils/formatters'
import { LANGUAGE_COLORS } from '@utils/constants'
import { useAuth } from '@/hooks/useAuth'
import type { PostPreview } from '@/types'

interface PostCardProps {
  post: PostPreview
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
  onShare?: (postId: string) => void
}

export default function PostCard({ post, onLike, onSave, onShare }: PostCardProps) {
  const { isAuthenticated } = useAuth()
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const mainTag = post.tags[0]

  return (
    <article className="card p-4 hover:border-surface-raised transition-colors group">
      {/* Repost indicator */}
      {post.type === 'repost' && post.repostedFrom && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <GitFork className="w-3.5 h-3.5" />
          <Link to={`/profile/${post.author.username}`} className="hover:text-gray-300">
            {post.author.displayName}
          </Link>
          yeniden paylaştı
        </div>
      )}

      {/* Author */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" online={post.author.isOnline} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{post.author.displayName}</p>
            <p className="text-xs text-gray-500">@{post.author.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {mainTag && (
          <Badge variant="brand" className="shrink-0">#{mainTag}</Badge>
        )}
      </div>

      {/* Content */}
      <Link to={`/post/${post.id}`} className="block mb-3">
        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
          {post.title}
        </h3>
        {post.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{post.description}</p>
        )}
      </Link>

      {/* Preview image */}
      {post.previewImageUrl && (
        <Link to={`/post/${post.id}`} className="block mb-3 rounded-lg overflow-hidden border border-surface-border">
          <div className="relative bg-surface-raised aspect-video group/preview">
            <img src={post.previewImageUrl} alt={post.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        </Link>
      )}

      {/* Language tags */}
      {post.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="tag"
              style={{ color: LANGUAGE_COLORS[tag] ?? undefined }}
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-surface-border">
        <button
          onClick={() => onLike?.(post.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            post.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
          {compactNumber(post.likesCount)}
        </button>

        <Link
          to={`/post/${post.id}#comments`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {compactNumber(post.commentsCount)}
        </Link>

        <button
          onClick={() => onShare?.(post.id)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          {compactNumber(post.sharesCount)}
        </button>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={() => setCollectModalOpen(true)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors"
              title="Koleksiyona ekle"
            >
              <FolderPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => onSave?.(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              post.isSaved ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {isAuthenticated && (
        <AddToCollectionModal
          postId={post.id}
          open={collectModalOpen}
          onClose={() => setCollectModalOpen(false)}
        />
      )}
    </article>
  )
}
