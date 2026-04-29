import { useEffect, useRef, useState } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { IconArrowLeft, IconHeart, IconMessageCircle, IconBookmark, IconShare, IconRepeatOnce, IconDots, IconTrash, IconChartBar, IconPencil, IconClock, IconBook2 } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import AddToSeriesModal from '@modules/series/AddToSeriesModal'
import ShareModal from '@modules/social/ShareModal'
import CommentThread from '@modules/social/CommentThread'
import RepostMenu from '@modules/post/RepostMenu'
import QuoteComposer from '@modules/post/QuoteComposer'
import PostStatsModal from '@modules/post/PostStatsModal'
import PostEditHistoryModal from '@modules/post/PostEditHistoryModal'
import BlockView from '@modules/post/BlockView'
import { timeAgo, compactNumber } from '@utils/formatters'
import { postService } from '@services/postService'
import { projectService } from '@services/projectService'
import { useAuthStore } from '@store/authStore'
import { useCommentStore } from '@store/commentStore'
import { useComposerStore } from '@store/composerStore'
import toast from 'react-hot-toast'
import type { Post, PostBlock } from '@/types'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [seriesModalOpen, setSeriesModalOpen]   = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { hash } = useLocation()
  const openEditComposer = useComposerStore((s) => s.openEditComposer)

  const loadedComments = useCommentStore((s) => (post ? s.commentsByPost[post.id] : undefined))
  const liveCommentCount = loadedComments
    ? loadedComments.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0)
    : null
  const displayCommentCount = liveCommentCount ?? post?.commentsCount ?? 0

  const isOwner = !!user && !!post && user.id === post.author.id

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const handleEditSaved = (updated: { description: string | null; tags: string[]; blocks: PostBlock[] }) => {
    setPost((p) => p ? { ...p, ...updated, isEdited: true } : p)
  }

  const handleDelete = async () => {
    if (!post) return
    setMenuOpen(false)
    if (!window.confirm('Bu gönderiyi silmek istediğine emin misin?')) return
    try {
      await postService.delete(post.id)
      toast.success('Gönderi silindi')
      navigate('/')
    } catch {
      toast.error('Gönderi silinemedi')
    }
  }

  useEffect(() => {
    if (!postId) return
    setLoading(true)
    postService.getPost(postId)
      .then(setPost)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => {
    if (!hash || !loadedComments || loadedComments.length === 0) return
    const id = hash.slice(1)
    const el = document.getElementById(id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-gray-500', 'rounded-xl', 'transition')
    const timer = window.setTimeout(() => {
      el.classList.remove('ring-2', 'ring-gray-500', 'rounded-xl', 'transition')
    }, 2000)
    return () => window.clearTimeout(timer)
  }, [hash, loadedComments])

  const handleLike = async () => {
    if (!post || !isAuthenticated) return
    const wasLiked = post.isLiked
    setPost((p) => p ? { ...p, isLiked: !p.isLiked, likesCount: Math.max(0, p.likesCount + (p.isLiked ? -1 : 1)) } : p)
    try {
      await (wasLiked ? postService.unlike(post.id) : postService.like(post.id))
    } catch {
      setPost((p) => p ? { ...p, isLiked: wasLiked, likesCount: Math.max(0, p.likesCount + (wasLiked ? 1 : -1)) } : p)
    }
  }

  const handleRepost = async () => {
    if (!post || !isAuthenticated) return
    const wasReposted = post.isReposted
    setPost((p) => p ? { ...p, isReposted: !p.isReposted, repostCount: Math.max(0, p.repostCount + (p.isReposted ? -1 : 1)) } : p)
    try {
      await (wasReposted ? postService.undoRepost(post.id) : postService.repost(post.id))
      toast.success(wasReposted ? 'Repost kaldırıldı' : 'Yeniden paylaşıldı!')
    } catch {
      setPost((p) => p ? { ...p, isReposted: wasReposted, repostCount: Math.max(0, p.repostCount + (wasReposted ? 1 : -1)) } : p)
      toast.error('Bir hata oluştu')
    }
  }

  const handleSave = async () => {
    if (!post || !isAuthenticated) return
    const wasSaved = post.isSaved
    setPost((p) => p ? { ...p, isSaved: !p.isSaved } : p)
    try {
      await (wasSaved ? postService.unsave(post.id) : postService.save(post.id))
    } catch {
      setPost((p) => p ? { ...p, isSaved: wasSaved } : p)
    }
  }

  const handleForkProject = async (files: Array<{ name: string; language: string; content: string }>) => {
    if (!post || !isAuthenticated) { toast.error('Önce giriş yapmalısın'); return }
    try {
      const toastId = toast.loading('Proje kopyalanıyor...')
      const newId = await projectService.forkProject(post.title, files)
      toast.dismiss(toastId)
      toast.success('Proje editörde açıldı!')
      navigate(`/editor/${newId}`)
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 text-gray-500">
        <p className="text-lg mb-2">Gönderi bulunamadı</p>
        <Link to="/" className="text-brand-400 hover:underline text-sm">Ana sayfaya dön</Link>
      </div>
    )
  }

  const isQuote = post.type === 'post' && !!post.repostedFrom

  return (
    <div className="flex flex-col max-w-2xl mx-auto w-full">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit px-4 py-3">
        <IconArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      <article className="-mx-4 lg:mx-0 border-b border-surface-border/40">
        <div className="flex gap-3 px-4 pt-3 pb-4">
          <Link to={`/profile/${post.author.username}`} className="shrink-0 mt-0.5">
            <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" online={post.author.isOnline} />
          </Link>

          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <Link to={`/profile/${post.author.username}`} className="min-w-0">
                <span className="font-semibold text-sm text-white">{post.author.displayName}</span>
                <span className="text-xs text-gray-400 ml-1.5">
                  @{post.author.username} · {timeAgo(post.createdAt)}
                </span>
                {post.isEdited && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setHistoryOpen(true) }}
                    className="inline-flex items-center gap-0.5 text-xs text-gray-600 hover:text-gray-400 transition-colors ml-1.5"
                    title="Düzenleme geçmişini gör"
                  >
                    <IconClock className="w-3 h-3" />
                    düzenlendi
                  </button>
                )}
              </Link>
              {isAuthenticated && (
                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
                    title="Daha fazla"
                  >
                    <IconDots className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setStatsOpen(true) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <IconChartBar className="w-4 h-4 text-gray-400" />
                        <span className="text-white">İstatistikler</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setShareModalOpen(true) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <IconShare className="w-4 h-4 text-gray-400" />
                        <span className="text-white">Paylaş</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMenuOpen(false); setCollectModalOpen(true) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <IconChartBar className="w-4 h-4 text-gray-400" />
                        <span className="text-white">Koleksiyona ekle</span>
                      </button>
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); setSeriesModalOpen(true) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                        >
                          <IconBook2 className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Seriye ekle</span>
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); openEditComposer(post, handleEditSaved) }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                        >
                          <IconPencil className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Düzenle</span>
                        </button>
                      )}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={handleDelete}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                        >
                          <IconTrash className="w-4 h-4 text-gray-400" />
                          <span className="text-white">Sil</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {post.tags.map((tag) => (
                  <Link key={tag} to={`/explore?tag=${tag}`} className="tag">#{tag}</Link>
                ))}
              </div>
            )}

            {post.description && <p className="text-sm text-white mb-3 whitespace-pre-wrap leading-relaxed">{post.description}</p>}

            {/* Blocks */}
            {post.blocks.length > 0 && (
              <BlockView
                blocks={post.blocks}
                postTitle={post.title}
                onForkProject={isAuthenticated ? handleForkProject : undefined}
              />
            )}

            {/* Preview image fallback */}
            {post.blocks.length === 0 && post.previewImageUrl && (
              <div className="rounded-xl overflow-hidden border border-surface-border mb-3">
                <img src={post.previewImageUrl} alt={post.title} className="w-full object-cover" />
              </div>
            )}

            {/* Quote embed */}
            {isQuote && post.repostedFrom && (
              <div className="mb-3 rounded-xl border border-surface-border bg-surface-raised/30 p-3 hover:border-surface-raised transition-colors">
                <Link to={`/profile/${post.repostedFrom.author.username}`} className="flex items-center gap-2 mb-2">
                  <Avatar
                    src={post.repostedFrom.author.avatarUrl}
                    alt={post.repostedFrom.author.displayName}
                    size="xs"
                  />
                  <div className="text-xs text-gray-400">
                    <span className="font-medium text-gray-200">{post.repostedFrom.author.displayName}</span>
                    <span className="ml-1">@{post.repostedFrom.author.username}</span>
                  </div>
                </Link>
                <Link to={`/post/${post.repostedFrom.id}`} className="block">
                  <p className="text-sm font-semibold text-white line-clamp-2">{post.repostedFrom.title}</p>
                  {post.repostedFrom.description && (
                    <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{post.repostedFrom.description}</p>
                  )}
                </Link>
                {post.repostedFrom.blocks.length > 0 && (
                  <div className="mt-3">
                    <BlockView blocks={post.repostedFrom.blocks} compact postTitle={post.repostedFrom.title} />
                  </div>
                )}
                {post.repostedFrom.blocks.length === 0 && post.repostedFrom.previewImageUrl && (
                  <Link to={`/post/${post.repostedFrom.id}`} className="block mt-3 rounded-lg overflow-hidden border border-surface-border">
                    <img src={post.repostedFrom.previewImageUrl} alt={post.repostedFrom.title} className="w-full aspect-video object-cover" />
                  </Link>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-4 mt-1 text-gray-400">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${
                  post.isLiked ? 'text-red-500' : 'hover:text-red-400'
                }`}
              >
                <IconHeart className={`w-[18px] h-[18px] ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="text-sm">{compactNumber(post.likesCount)}</span>
              </button>
              <button
                onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <IconMessageCircle className="w-[18px] h-[18px]" />
                <span className="text-sm">{compactNumber(displayCommentCount)}</span>
              </button>
              {isAuthenticated ? (
                <RepostMenu
                  post={post}
                  onRepost={handleRepost}
                  onQuote={() => setQuoteOpen(true)}
                />
              ) : (
                <span className="flex items-center gap-1.5 text-sm">
                  <IconRepeatOnce className="w-[18px] h-[18px]" />
                  {compactNumber(post.repostCount)}
                </span>
              )}
              <button
                onClick={handleSave}
                className={`ml-auto flex items-center gap-1.5 transition-colors ${
                  post.isSaved ? 'text-white' : 'hover:text-white'
                }`}
              >
                <IconBookmark className={`w-[18px] h-[18px] ${post.isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </article>

      {isAuthenticated && post && (
        <AddToCollectionModal
          postId={post.id}
          open={collectModalOpen}
          onClose={() => setCollectModalOpen(false)}
        />
      )}
      {isOwner && post && (
        <AddToSeriesModal
          postId={post.id}
          open={seriesModalOpen}
          onClose={() => setSeriesModalOpen(false)}
        />
      )}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        post={post}
        onRepost={handleRepost}
      />
      <PostStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        postId={post.id}
        likesCount={post.likesCount}
        repostCount={post.repostCount}
      />
      {isAuthenticated && (
        <QuoteComposer
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          post={post}
        />
      )}
      <PostEditHistoryModal
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        post={post}
      />

      <div id="comments" className="-mx-4 lg:mx-0 px-4 pt-4">
        <h2 className="text-base font-semibold text-white mb-4">Yorumlar ({displayCommentCount})</h2>
        <CommentThread
          postId={post.id}
          onCommentAdded={() => setPost((p) => p ? { ...p, commentsCount: p.commentsCount + 1 } : p)}
        />
      </div>
    </div>
  )
}
