import { useEffect, useState } from 'react'
import {
  Heart, MessageCircle, Eye, Bookmark,
  ExternalLink, Loader2, AlertCircle, X,
} from 'lucide-react'
import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'
import { postService } from '@services/postService'
import { timeAgo, compactNumber } from '@utils/formatters'
import BlockView from '@modules/post/BlockView'
import type { Post } from '@/types'

export default function PostEmbedBlock({ block }: { block: ArticleBlock }) {
  const { blocks, removeBlock } = useArticleStore()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!block.src) {
      setError('Gönderi ID eksik')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    postService.getPost(block.src)
      .then(p => { setPost(p); setLoading(false) })
      .catch(() => { setError('Gönderi yüklenemedi'); setLoading(false) })
  }, [block.src])

  if (loading) {
    return (
      <div className="rounded-xl border border-surface-border p-6 flex items-center justify-center gap-2 text-gray-500">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Gönderi yükleniyor...</span>
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error ?? 'Gönderi bulunamadı'}
        </div>
        {blocks.length > 1 && (
          <button
            onClick={() => removeBlock(block.id)}
            className="text-gray-600 hover:text-red-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div
      data-block-id={block.id}
      className="rounded-xl border border-surface-border overflow-hidden bg-surface-card hover:border-brand-500/40 transition-colors outline-none"
      tabIndex={0}
    >
      {/* Preview image */}
      {post.previewImageUrl && (
        <div className="w-full h-36 overflow-hidden">
          <img
            src={post.previewImageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="p-4">
        {/* Author + date */}
        <div className="flex items-center gap-2 mb-3">
          {post.author.avatarUrl ? (
            <img
              src={post.author.avatarUrl}
              alt=""
              className="w-6 h-6 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-brand-500/20 flex items-center justify-center text-xs font-medium text-brand-400 shrink-0">
              {post.author.username[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-gray-200">{post.author.displayName}</span>
          <span className="text-xs text-gray-600">@{post.author.username}</span>
          <span className="text-gray-700 text-xs">·</span>
          <span className="text-xs text-gray-600">{timeAgo(post.createdAt)}</span>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-1.5 line-clamp-2">
          {post.title}
        </h3>

        {/* Description */}
        {post.description && (
          <p className="text-sm text-gray-400 line-clamp-2 mb-4">{post.description}</p>
        )}

        {/* ── Post blocks (snippet, image, video, link, project, article) ── */}
        {post.blocks.length > 0 && (
          <div className="mb-4 border-t border-surface-border pt-4">
            <BlockView
              blocks={post.blocks}
              compact
              postTitle={post.title}
            />
          </div>
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {post.tags.slice(0, 5).map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-xs bg-surface-raised text-gray-400 border border-surface-border"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Stats + link */}
        <div className="flex items-center gap-4 text-xs text-gray-500 border-t border-surface-border pt-3">
          <span className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {compactNumber(post.likesCount)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {compactNumber(post.commentsCount)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {compactNumber(post.viewsCount)}
          </span>
          <span className="flex items-center gap-1">
            <Bookmark className="w-3.5 h-3.5" />
            {compactNumber(post.savesCount)}
          </span>
          <a
            href={`/post/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="ml-auto flex items-center gap-1 text-brand-400 hover:text-brand-300 transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Gönderiyi Görüntüle
          </a>
        </div>
      </div>
    </div>
  )
}
