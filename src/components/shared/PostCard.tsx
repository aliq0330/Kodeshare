import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Repeat2, FolderPlus, Repeat, MoreHorizontal, Trash2, BarChart2, Pencil, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import ShareModal from '@modules/social/ShareModal'
import PostStatsModal from '@modules/post/PostStatsModal'
import EditPostModal from '@modules/post/EditPostModal'
import PostEditHistoryModal from '@modules/post/PostEditHistoryModal'
import BlockView from '@modules/post/BlockView'
import RepostMenu from '@modules/post/RepostMenu'
import QuoteComposer from '@modules/post/QuoteComposer'
import { postService } from '@services/postService'
import { compactNumber, timeAgo } from '@utils/formatters'
import { LANGUAGE_COLORS } from '@utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { usePostStore } from '@store/postStore'
import type { Post, PostBlock } from '@/types'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
}

export default function PostCard({ post, onLike, onSave }: PostCardProps) {
  const { isAuthenticated, user } = useAuth()
  const repostPost = usePostStore((s) => s.repostPost)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [localPost, setLocalPost] = useState(post)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = !!user && user.id === post.author.id

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!window.confirm('Bu gönderiyi silmek istediğine emin misin?')) return
    try {
      await postService.delete(post.id)
      toast.success('Gönderi silindi')
      setDeleted(true)
    } catch {
      toast.error('Gönderi silinemedi')
    }
  }

  const handleEditSaved = (updated: { title: string; description: string | null; tags: string[]; blocks: PostBlock[] }) => {
    setLocalPost((p) => ({ ...p, ...updated, isEdited: true }))
  }

  // For a plain repost, render the original post's content in the card body
  const display: Post = localPost.type === 'repost' && localPost.repostedFrom
    ? localPost.repostedFrom
    : localPost

  // Quote post: type='post' with repostedFrom set
  const isQuote = localPost.type === 'post' && !!localPost.repostedFrom

  const mainTag = display.tags[0]
  const isOwnerPost = localPost.type !== 'repost' || !localPost.repostedFrom

  const handleRepost = () => {
    if (!isAuthenticated) return
    const targetId = localPost.type === 'repost' && localPost.repostedFrom ? localPost.repostedFrom.id : localPost.id
    void repostPost(targetId)
  }

  const handleQuote = () => {
    if (!isAuthenticated) return
    setQuoteOpen(true)
  }

  const repostTarget: Post = localPost.type === 'repost' && localPost.repostedFrom
    ? { ...localPost.repostedFrom, isReposted: localPost.isReposted }
    : localPost

  if (deleted) return null

  return (
    <article className="card p-4 rounded-none -mx-4 sm:mx-0 hover:border-surface-raised transition-colors group">
      {/* Repost indicator */}
      {localPost.type === 'repost' && localPost.repostedFrom && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Repeat className="w-3.5 h-3.5" />
          <Link to={`/profile/${localPost.author.username}`} className="hover:text-gray-300">
            {localPost.author.displayName}
          </Link>
          tarafından yeniden gönderildi
        </div>
      )}

      {/* Author */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link to={`/profile/${display.author.username}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={display.author.avatarUrl} alt={display.author.displayName} size="sm" online={display.author.isOnline} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{display.author.displayName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              @{display.author.username} · {timeAgo(display.createdAt)}
              {localPost.isEdited && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setHistoryOpen(true) }}
                  className="inline-flex items-center gap-0.5 text-gray-600 hover:text-gray-400 transition-colors"
                  title="Düzenleme geçmişini gör"
                >
                  <Clock className="w-3 h-3" />
                  düzenlendi
                </button>
              )}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {mainTag && (
            <Badge variant="brand" className="shrink-0">#{mainTag}</Badge>
          )}
          {isAuthenticated && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
                title="Daha fazla"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setStatsOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    <span className="text-white">İstatistikler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setShareModalOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-sky-400" />
                    <span className="text-white">Paylaş</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setCollectModalOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-brand-400" />
                    <span className="text-white">Koleksiyona ekle</span>
                  </button>
                  {isOwner && isOwnerPost && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setEditOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span className="text-white">Düzenle</span>
                    </button>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span className="text-white">Sil</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Title & description */}
      <Link to={`/post/${display.id}`} className="block mb-3">
        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
          {display.title}
        </h3>
        {display.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{display.description}</p>
        )}
      </Link>

      {/* Blocks (compact mode) */}
      {display.blocks.length > 0 && (
        <Link to={`/post/${display.id}`} className="block">
          <BlockView blocks={display.blocks} compact postTitle={display.title} />
        </Link>
      )}

      {/* Preview image fallback when no blocks */}
      {display.blocks.length === 0 && display.previewImageUrl && (
        <Link to={`/post/${display.id}`} className="block mb-3 rounded-lg overflow-hidden border border-surface-border">
          <img src={display.previewImageUrl} alt={display.title} className="w-full aspect-video object-cover" />
        </Link>
      )}

      {/* Quote embed — original post shown inside */}
      {isQuote && localPost.repostedFrom && (
        <div className="mb-3 rounded-xl border border-surface-border bg-surface-raised/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              src={localPost.repostedFrom.author.avatarUrl}
              alt={localPost.repostedFrom.author.displayName}
              size="xs"
            />
            <Link
              to={`/profile/${localPost.repostedFrom.author.username}`}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              <span className="font-medium text-gray-200">{localPost.repostedFrom.author.displayName}</span>
              <span className="ml-1">@{localPost.repostedFrom.author.username}</span>
            </Link>
          </div>
          <Link to={`/post/${localPost.repostedFrom.id}`} className="block">
            <p className="text-sm font-semibold text-white line-clamp-2">{localPost.repostedFrom.title}</p>
            {localPost.repostedFrom.description && (
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{localPost.repostedFrom.description}</p>
            )}
          </Link>
          {localPost.repostedFrom.blocks.length > 0 && (
            <div className="mt-2">
              <BlockView blocks={localPost.repostedFrom.blocks} compact postTitle={localPost.repostedFrom.title} />
            </div>
          )}
          {localPost.repostedFrom.blocks.length === 0 && localPost.repostedFrom.previewImageUrl && (
            <Link to={`/post/${localPost.repostedFrom.id}`} className="block mt-2 rounded-lg overflow-hidden border border-surface-border">
              <img src={localPost.repostedFrom.previewImageUrl} alt={localPost.repostedFrom.title} className="w-full aspect-video object-cover" />
            </Link>
          )}
        </div>
      )}

      {/* Language tags */}
      {display.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {display.tags.map((tag) => (
            <Link
              key={tag}
              to={`/explore?tag=${tag}`}
              onClick={(e) => e.stopPropagation()}
              className="tag"
              style={{ color: LANGUAGE_COLORS[tag] ?? undefined }}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-surface-border">
        <button
          onClick={() => onLike?.(display.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            display.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${display.isLiked ? 'fill-current' : ''}`} />
          {compactNumber(display.likesCount)}
        </button>

        <Link
          to={`/post/${display.id}#comments`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {compactNumber(display.commentsCount)}
        </Link>

        {isAuthenticated ? (
          <RepostMenu
            post={repostTarget}
            onRepost={handleRepost}
            onQuote={handleQuote}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Repeat2 className="w-4 h-4" />
            {compactNumber(repostTarget.repostCount)}
          </span>
        )}

        <button
          onClick={() => onSave?.(display.id)}
          className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${
            display.isSaved ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${display.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {isAuthenticated && (
        <AddToCollectionModal
          postId={display.id}
          open={collectModalOpen}
          onClose={() => setCollectModalOpen(false)}
        />
      )}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={display}
        onRepost={() => repostPost(display.id)}
      />
      <PostStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        postId={display.id}
        likesCount={display.likesCount}
        repostCount={display.repostCount}
      />
      {isAuthenticated && (
        <QuoteComposer
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          post={repostTarget}
        />
      )}
      {isOwner && isOwnerPost && (
        <EditPostModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          post={localPost}
          onSaved={handleEditSaved}
        />
      )}
      {isOwnerPost && (
        <PostEditHistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          post={localPost}
        />
      )}
    </article>
  )
}
