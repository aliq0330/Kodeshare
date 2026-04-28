import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
import { useArticleStore } from '@store/articleStore'
import type { Post, PostBlock } from '@/types'

interface PostCardProps {
  post: Post
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
  onRemoveFromCollection?: () => void
}

interface ArticleData {
  likesCount: number
  savesCount: number
  isLiked: boolean
  isSaved: boolean
}

// Aynı makale için birden fazla kart varsa tekrar çekmesin
const articleDataCache = new Map<string, ArticleData>()

export default function PostCard({ post, onLike, onSave, onRemoveFromCollection }: PostCardProps) {
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuth()
  const repostPost = usePostStore((s) => s.repostPost)
  const loadArticle = useArticleStore((s) => s.loadArticle)
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

  // Makale etkileşim verilerini çek (hafif sorgu — blocks çekmez)
  useEffect(() => {
    if (!displayArticleId) return
    if (articleDataCache.has(displayArticleId)) {
      setArticleData(articleDataCache.get(displayArticleId)!)
      return
    }
    articleService.getInteractions(displayArticleId).then((interactions) => {
      articleDataCache.set(displayArticleId, interactions)
      setArticleData(interactions)
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

  const handlePostLike = () => {
    setLocalPost((prev) => {
      const isRepost = prev.type === 'repost' && !!prev.repostedFrom
      if (isRepost) {
        const target = prev.repostedFrom!
        const wasLiked = target.isLiked
        return { ...prev, repostedFrom: { ...target, isLiked: !wasLiked, likesCount: Math.max(0, target.likesCount + (wasLiked ? -1 : 1)) } }
      }
      const wasLiked = prev.isLiked
      return { ...prev, isLiked: !wasLiked, likesCount: Math.max(0, prev.likesCount + (wasLiked ? -1 : 1)) }
    })
    onLike?.(display.id)
  }

  const handlePostSave = () => {
    setLocalPost((prev) => {
      const isRepost = prev.type === 'repost' && !!prev.repostedFrom
      if (isRepost) return { ...prev, repostedFrom: { ...prev.repostedFrom!, isSaved: !prev.repostedFrom!.isSaved } }
      return { ...prev, isSaved: !prev.isSaved }
    })
    onSave?.(display.id)
  }

  const handleEditArticle = async () => {
    if (!displayArticleId) return
    setMenuOpen(false)
    try {
      const rec = await articleService.get(displayArticleId)
      loadArticle(rec)
      navigate('/makale')
    } catch {
      toast.error('Makale açılamadı')
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
            <BarChart2 className="w-4 h-4 text-gray-500" />
            <span className="text-white">İstatistikler</span>
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); setShareModalOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-500" />
            <span className="text-white">Paylaş</span>
          </button>
          <button
            type="button"
            onClick={() => { setMenuOpen(false); setCollectModalOpen(true) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
          >
            <FolderPlus className="w-4 h-4 text-gray-500" />
            <span className="text-white">Koleksiyona ekle</span>
          </button>
          {onRemoveFromCollection && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onRemoveFromCollection() }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
            >
              <FolderPlus className="w-4 h-4 text-red-400" />
              <span className="text-red-400">Bu koleksiyondan çıkar</span>
            </button>
          )}
          {isOwner && isOwnerPost && !displayArticleId && (
            <button
              type="button"
              onClick={() => { setMenuOpen(false); setEditOpen(true) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
            >
              <Pencil className="w-4 h-4 text-gray-500" />
              <span className="text-white">Düzenle</span>
            </button>
          )}
          {isOwner && isOwnerPost && displayArticleId && (
            <button
              type="button"
              onClick={handleEditArticle}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
            >
              <Pencil className="w-4 h-4 text-gray-500" />
              <span className="text-white">Düzenle</span>
            </button>
          )}
          {isOwner && (
            <button
              type="button"
              onClick={handleDelete}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
            >
              <Trash2 className="w-4 h-4 text-gray-500" />
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
    const blockData  = display.blocks[0]?.data ?? {}
    const coverImage = (blockData.coverImage as string) || null
    const title      = (blockData.title as string) || display.title
    const subtitle   = (blockData.subtitle as string) || display.description || ''

    return (
      <article className="border-b border-surface-border group">
        {/* Repost göstergesi */}
        {localPost.type === 'repost' && localPost.repostedFrom && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 px-4">
            <Repeat className="w-3.5 h-3.5" />
            <Link to={`/profile/${localPost.author.username}`} className="hover:text-gray-300">
              {localPost.author.displayName}
            </Link>
            tarafından yeniden gönderildi
          </div>
        )}

        <div className="flex gap-3 px-4 pt-3 pb-4">
          {/* Avatar */}
          <Link to={`/profile/${display.author.username}`} className="shrink-0 mt-0.5">
            <Avatar src={display.author.avatarUrl} alt={display.author.displayName} size="sm" online={display.author.isOnline} />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Yazar satırı */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link to={`/profile/${display.author.username}`} className="min-w-0">
                <span className="font-semibold text-sm text-white">{display.author.displayName}</span>
                <span className="text-xs text-gray-400 ml-1.5">@{display.author.username} · {timeAgo(display.createdAt)}</span>
              </Link>
              {menuDropdown}
            </div>

            {/* Kapak görseli */}
            {coverImage && (
              <Link to={primaryLink} className="block mb-2 rounded-xl overflow-hidden border border-surface-border">
                <img src={coverImage} alt="" className="w-full h-36 object-cover" />
              </Link>
            )}

            {/* Başlık + altyazı */}
            <Link to={primaryLink} className="block mb-2">
              <div className="flex items-start gap-2">
                {!coverImage && (
                  <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white line-clamp-2">{title}</h3>
                  {subtitle && (
                    <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{subtitle}</p>
                  )}
                </div>
              </div>
            </Link>

            {/* Aksiyon çubuğu */}
            <div className="flex items-center gap-4 text-gray-400">
              <button
                onClick={handleArticleLike}
                className={`flex items-center gap-1.5 transition-colors ${
                  articleData?.isLiked ? 'text-white' : 'hover:text-white'
                }`}
              >
                <Heart className={`w-[18px] h-[18px] ${articleData?.isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{compactNumber(articleData?.likesCount ?? 0)}</span>
              </button>

              <Link
                to={commentLink}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </Link>

              {isAuthenticated ? (
                <RepostMenu post={repostTarget} onRepost={handleRepost} onQuote={handleQuote} />
              ) : (
                <span className="flex items-center gap-1.5 text-xs">
                  <Repeat2 className="w-[18px] h-[18px]" />
                  {compactNumber(repostTarget.repostCount)}
                </span>
              )}

              <button
                onClick={handleArticleSave}
                className={`ml-auto flex items-center gap-1.5 transition-colors ${
                  articleData?.isSaved ? 'text-white' : 'hover:text-white'
                }`}
              >
                <Bookmark className={`w-[18px] h-[18px] ${articleData?.isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {modals}
      </article>
    )
  }

  // ── Normal post layout ────────────────────────────────────────────────────
  return (
    <article className="border-b border-surface-border group">
      {/* Repost indicator */}
      {localPost.type === 'repost' && localPost.repostedFrom && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-3 px-4">
          <Repeat className="w-3.5 h-3.5" />
          <Link to={`/profile/${localPost.author.username}`} className="hover:text-gray-300">
            {localPost.author.displayName}
          </Link>
          tarafından yeniden gönderildi
        </div>
      )}

      <div className="flex gap-3 px-4 pt-3 pb-4">
        {/* Left: Avatar */}
        <Link to={`/profile/${display.author.username}`} className="shrink-0 mt-0.5">
          <Avatar src={display.author.avatarUrl} alt={display.author.displayName} size="sm" />
        </Link>

        {/* Right: Content */}
        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <Link to={`/profile/${display.author.username}`} className="min-w-0">
              <span className="font-semibold text-sm text-white">{display.author.displayName}</span>
              <span className="text-xs text-gray-400 ml-1.5">
                @{display.author.username} · {timeAgo(display.createdAt)}
              </span>
              {localPost.isEdited && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setHistoryOpen(true) }}
                  className="ml-1 inline-flex items-center gap-0.5 text-xs text-gray-500"
                >
                  <Clock className="w-3 h-3" />
                </button>
              )}
            </Link>
            {menuDropdown}
          </div>

          {/* Title & description */}
          <Link to={primaryLink} className="block mb-2">
            <p className="text-sm text-white line-clamp-3 leading-relaxed">{display.title}</p>
            {display.description && (
              <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{display.description}</p>
            )}
          </Link>

          {/* Blocks (compact mode) */}
          {display.blocks.length > 0 && (
            <Link to={primaryLink} className="block mb-2">
              <BlockView blocks={display.blocks} compact postTitle={display.title} />
            </Link>
          )}

          {/* Preview image fallback */}
          {display.blocks.length === 0 && display.previewImageUrl && (
            <Link to={primaryLink} className="block mb-2 rounded-xl overflow-hidden border border-surface-border">
              <img src={display.previewImageUrl} alt={display.title} className="w-full aspect-video object-cover" />
            </Link>
          )}

          {/* Quote embed */}
          {isQuote && localPost.repostedFrom && (
            <div className="mb-2 rounded-xl border border-surface-border bg-surface-raised/40 p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <Avatar src={localPost.repostedFrom.author.avatarUrl} alt={localPost.repostedFrom.author.displayName} size="xs" />
                <Link to={`/profile/${localPost.repostedFrom.author.username}`} className="text-xs text-gray-400">
                  <span className="font-medium text-gray-200">{localPost.repostedFrom.author.displayName}</span>
                  <span className="ml-1">@{localPost.repostedFrom.author.username}</span>
                </Link>
              </div>
              <Link to={(() => { const aid = getArticleId(localPost.repostedFrom!); return aid ? `/makale/${aid}` : `/post/${localPost.repostedFrom!.id}` })()} className="block">
                <p className="text-sm font-semibold text-white line-clamp-2">{localPost.repostedFrom.title}</p>
                {localPost.repostedFrom.description && <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{localPost.repostedFrom.description}</p>}
              </Link>
              {localPost.repostedFrom.blocks.length > 0 && (
                <div className="mt-2"><BlockView blocks={localPost.repostedFrom.blocks} compact postTitle={localPost.repostedFrom.title} /></div>
              )}
            </div>
          )}

          {/* Tags */}
          {display.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {display.tags.map((tag) => (
                <Link key={tag} to={`/explore?tag=${tag}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gray-400 hover:text-gray-600">
                  #{tag}
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-1 text-gray-400">
            <Link to={commentLink} className="flex items-center gap-1.5 hover:text-gray-600 transition-colors">
              <MessageCircle className="w-[18px] h-[18px]" />
              <span className="text-xs">{compactNumber(display.commentsCount)}</span>
            </Link>

            {isAuthenticated ? (
              <RepostMenu post={repostTarget} onRepost={handleRepost} onQuote={handleQuote} />
            ) : (
              <span className="flex items-center gap-1.5 text-xs">
                <Repeat2 className="w-[18px] h-[18px]" />
                {compactNumber(repostTarget.repostCount)}
              </span>
            )}

            <button
              onClick={handlePostLike}
              className={`flex items-center gap-1.5 transition-colors ${display.isLiked ? 'text-gray-900' : 'hover:text-gray-600'}`}
            >
              <Heart className={`w-[18px] h-[18px] ${display.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs">{compactNumber(display.likesCount)}</span>
            </button>

            <button
              onClick={handlePostSave}
              className={`ml-auto flex items-center transition-colors ${display.isSaved ? 'text-gray-900' : 'hover:text-gray-600'}`}
            >
              <Bookmark className={`w-[18px] h-[18px] ${display.isSaved ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {modals}
    </article>
  )
}
