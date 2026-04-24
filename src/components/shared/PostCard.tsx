import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Repeat2, FolderPlus, Repeat, MoreHorizontal, Trash2, BarChart2, Pencil, Clock, BookOpen } from 'lucide-react'
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
import { articleService } from '@services/articleService'
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

interface ArticleData {
  subtitle: string
  coverImage: string | null
  readMins: number
  likesCount: number
  savesCount: number
  commentsCount: number
  isLiked: boolean
  isSaved: boolean
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
  const [articleData, setArticleData] = useState<ArticleData | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = !!user && user.id === post.author.id

  const getArticleId = (p: Post): string | null => {
    if (p.blocks.length === 1 && p.blocks[0].type === 'article')
      return (p.blocks[0].data.articleId as string) ?? null
    return null
  }

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  // For a plain repost, render the original post's content in the card body
  const display: Post = localPost.type === 'repost' && localPost.repostedFrom
    ? localPost.repostedFrom
    : localPost

  const isQuote = localPost.type === 'post' && !!localPost.repostedFrom
  const displayArticleId = getArticleId(display)
  const primaryLink = displayArticleId ? `/makale/${displayArticleId}` : `/post/${display.id}`
  const commentLink = displayArticleId ? `/makale/${displayArticleId}#comments` : `/post/${display.id}#comments`
  const mainTag = display.tags[0]
  const isOwnerPost = localPost.type !== 'repost' || !localPost.repostedFrom

  // Makale verilerini çek
  useEffect(() => {
    if (!displayArticleId) return
    articleService.get(displayArticleId).then((rec) => {
      const words = rec.blocks
        .map((b) => {
          const rb = b as Record<string, unknown>
          return (((rb.content as string) ?? '').replace(/<[^>]*>/g, '') || (rb.code as string) || '')
        })
        .join(' ').split(/\s+/).filter(Boolean).length
      setArticleData({
        subtitle:      rec.subtitle,
        coverImage:    rec.coverImage,
        readMins:      Math.max(1, Math.round(words / 200)),
        likesCount:    rec.likesCount,
        savesCount:    rec.savesCount,
        commentsCount: rec.commentsCount,
        isLiked:       rec.isLiked,
        isSaved:       rec.isSaved,
      })
    }).catch(() => {})
  }, [displayArticleId])

  const handleArticleLike = async () => {
    if (!displayArticleId || !isAuthenticated) return
    if (articleData?.isLiked) {
      await articleService.unlike(displayArticleId)
      setArticleData((s) => s ? { ...s, isLiked: false, likesCount: s.likesCount - 1 } : s)
    } else {
      await articleService.like(displayArticleId)
      setArticleData((s) => s ? { ...s, isLiked: true, likesCount: s.likesCount + 1 } : s)
    }
  }

  const handleArticleSave = async () => {
    if (!displayArticleId || !isAuthenticated) return
    if (articleData?.isSaved) {
      await articleService.unsaveArticle(displayArticleId)
      setArticleData((s) => s ? { ...s, isSaved: false, savesCount: s.savesCount - 1 } : s)
    } else {
      await articleService.saveArticle(displayArticleId)
      setArticleData((s) => s ? { ...s, isSaved: true, savesCount: s.savesCount + 1 } : s)
    }
  }

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

  // ── Paylaşılan makale menüsü (her iki layout için ortak) ──────────────────
  const menuDropdown = isAuthenticated && (
    <div className="relative shrink-0" ref={menuRef}>
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
          {isOwner && isOwnerPost && !displayArticleId && (
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
  )

  // ── Ortak modaller ────────────────────────────────────────────────────────
  const modals = (
    <>
      {isAuthenticated && (
        <AddToCollectionModal
          postId={displayArticleId ? undefined : display.id}
          articleId={displayArticleId ?? undefined}
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
        likesCount={displayArticleId ? (articleData?.likesCount ?? 0) : display.likesCount}
        repostCount={display.repostCount}
      />
      {isAuthenticated && (
        <QuoteComposer
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          post={repostTarget}
        />
      )}
      {isOwner && isOwnerPost && !displayArticleId && (
        <EditPostModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          post={localPost}
          onSaved={handleEditSaved}
        />
      )}
      {isOwnerPost && !displayArticleId && (
        <PostEditHistoryModal
          open={historyOpen}
          onClose={() => setHistoryOpen(false)}
          post={localPost}
        />
      )}
    </>
  )

  // ── Makale postu layout'u (ArticleCard stili) ─────────────────────────────
  if (displayArticleId) {
    // Block datasından anlık değerler (fetch tamamlanana kadar)
    const blockData = display.blocks[0]?.data ?? {}
    const coverImage = articleData?.coverImage ?? ((blockData.coverImage as string) || null)
    const title      = (blockData.title as string) || display.title
    const subtitle   = articleData?.subtitle ?? (blockData.subtitle as string) ?? display.description ?? ''

    return (
      <article className="card overflow-hidden hover:border-surface-raised transition-colors group">
        {/* Repost göstergesi */}
        {localPost.type === 'repost' && localPost.repostedFrom && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 px-4 pt-3">
            <Repeat className="w-3.5 h-3.5" />
            <Link to={`/profile/${localPost.author.username}`} className="hover:text-gray-300">
              {localPost.author.displayName}
            </Link>
            tarafından yeniden gönderildi
          </div>
        )}

        {/* Kapak görseli — kenara tam dayalı */}
        {coverImage && (
          <Link to={primaryLink} className="block">
            <img src={coverImage} alt="" className="w-full h-36 object-cover" />
          </Link>
        )}

        <div className="p-4">
          {/* Yazar satırı */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <Link to={`/profile/${display.author.username}`} className="flex items-center gap-2.5 min-w-0">
              <Avatar src={display.author.avatarUrl} alt={display.author.displayName} size="sm" online={display.author.isOnline} />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{display.author.displayName}</p>
                <p className="text-xs text-gray-500">@{display.author.username} · {timeAgo(display.createdAt)}</p>
              </div>
            </Link>
            {menuDropdown}
          </div>

          {/* Başlık + altyazı */}
          <Link to={primaryLink} className="block mb-3">
            <div className="flex items-start gap-2.5">
              {!coverImage && (
                <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4 text-gray-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{subtitle}</p>
                )}
              </div>
            </div>
          </Link>

          {/* Okuma süresi */}
          {articleData?.readMins && (
            <p className="flex items-center gap-1 text-xs text-gray-600 mb-3">
              <Clock className="w-3 h-3" />
              {articleData.readMins} dk okuma
            </p>
          )}

          {/* Aksiyon çubuğu */}
          <div className="flex items-center gap-1 pt-3 border-t border-surface-border">
            <button
              onClick={handleArticleLike}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
                articleData?.isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-surface-raised'
              }`}
            >
              <Heart className={`w-[18px] h-[18px] ${articleData?.isLiked ? 'fill-current' : ''}`} />
              <span className="text-sm">{compactNumber(articleData?.likesCount ?? 0)}</span>
            </button>

            <Link
              to={commentLink}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
            >
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-sm">{compactNumber(articleData?.commentsCount ?? 0)}</span>
            </Link>

            {isAuthenticated ? (
              <RepostMenu post={repostTarget} onRepost={handleRepost} onQuote={handleQuote} />
            ) : (
              <span className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm text-gray-400">
                <Repeat2 className="w-[18px] h-[18px]" />
                {compactNumber(repostTarget.repostCount)}
              </span>
            )}

            <button
              onClick={handleArticleSave}
              className={`ml-auto flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
                articleData?.isSaved ? 'text-brand-400 bg-brand-500/10' : 'text-gray-400 hover:text-brand-400 hover:bg-surface-raised'
              }`}
            >
              <Bookmark className={`w-[18px] h-[18px] ${articleData?.isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>

        {modals}
      </article>
    )
  }

  // ── Normal post layout ────────────────────────────────────────────────────
  return (
    <article className="card p-4 hover:border-surface-raised transition-colors group">
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
          {menuDropdown}
        </div>
      </div>

      {/* Title & description */}
      <Link to={primaryLink} className="block mb-3">
        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
          {display.title}
        </h3>
        {display.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{display.description}</p>
        )}
      </Link>

      {/* Blocks (compact mode) */}
      {display.blocks.length > 0 && (
        <Link to={primaryLink} className="block">
          <BlockView blocks={display.blocks} compact postTitle={display.title} />
        </Link>
      )}

      {/* Preview image fallback when no blocks */}
      {display.blocks.length === 0 && display.previewImageUrl && (
        <Link to={primaryLink} className="block mb-3 rounded-lg overflow-hidden border border-surface-border">
          <img src={display.previewImageUrl} alt={display.title} className="w-full aspect-video object-cover" />
        </Link>
      )}

      {/* Quote embed */}
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
          <Link
            to={(() => {
              const aid = getArticleId(localPost.repostedFrom)
              return aid ? `/makale/${aid}` : `/post/${localPost.repostedFrom.id}`
            })()}
            className="block"
          >
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
            <Link
              to={(() => {
                const aid = getArticleId(localPost.repostedFrom)
                return aid ? `/makale/${aid}` : `/post/${localPost.repostedFrom.id}`
              })()}
              className="block mt-2 rounded-lg overflow-hidden border border-surface-border"
            >
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
      <div className="flex items-center gap-1 pt-3 border-t border-surface-border">
        <button
          onClick={() => onLike?.(display.id)}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
            display.isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-surface-raised'
          }`}
        >
          <Heart className={`w-[18px] h-[18px] ${display.isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{compactNumber(display.likesCount)}</span>
        </button>

        <Link
          to={commentLink}
          className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
        >
          <MessageCircle className="w-[18px] h-[18px]" />
          <span className="text-sm">{compactNumber(display.commentsCount)}</span>
        </Link>

        {isAuthenticated ? (
          <RepostMenu post={repostTarget} onRepost={handleRepost} onQuote={handleQuote} />
        ) : (
          <span className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm text-gray-400">
            <Repeat2 className="w-[18px] h-[18px]" />
            {compactNumber(repostTarget.repostCount)}
          </span>
        )}

        <button
          onClick={() => onSave?.(display.id)}
          className={`ml-auto flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
            display.isSaved ? 'text-brand-400 bg-brand-500/10' : 'text-gray-400 hover:text-brand-400 hover:bg-surface-raised'
          }`}
        >
          <Bookmark className={`w-[18px] h-[18px] ${display.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {modals}
    </article>
  )
}
