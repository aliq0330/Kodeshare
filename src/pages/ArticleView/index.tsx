import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { IconArrowLeft, IconClock, IconLink, IconBook2, IconHeart, IconMessageCircle, IconRepeat, IconBookmark, IconDots, IconShare, IconFolderPlus, IconChartBar, IconPencil, IconSend, IconTrash, IconQuote, IconCode } from '@tabler/icons-react'
import { articleService } from '@services/articleService'
import { useArticleStore } from '@store/articleStore'
import type { ArticleRecord, ArticleComment } from '@services/articleService'
import { ArticleBlocksRenderer } from '@pages/Article'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import ArticleShareModal from '@modules/social/ArticleShareModal'
import ArticleStatsModal from '@modules/post/ArticleStatsModal'
import { useComposerStore } from '@store/composerStore'
import { usePostStore } from '@store/postStore'
import { useAuthStore } from '@store/authStore'
import { CommentContent, SnippetPanel, insertAtCursor } from '@modules/social/CommentSnippet'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import toast from 'react-hot-toast'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function readingMinutes(article: ArticleRecord) {
  const words = article.blocks
    .map((b) => b.content?.replace(/<[^>]*>/g, '') ?? b.code ?? '')
    .join(' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

function extractPlainText(article: ArticleRecord): string {
  return article.blocks
    .map((b) => (b.content ?? '').replace(/<[^>]*>/g, '') || b.code || '')
    .filter(Boolean)
    .join(' ')
}

/* ─── CommentRow ─── */
interface CommentRowProps {
  comment: ArticleComment
  currentUserId?: string
  onReply: (parentId: string, username: string) => void
  onDelete: (commentId: string) => void
}

function CommentRow({ comment, currentUserId, onReply, onDelete }: CommentRowProps) {
  return (
    <div className="flex gap-3">
      <Avatar
        src={comment.author.avatarUrl}
        alt={comment.author.displayName || 'Anonim'}
        size="sm"
        className="shrink-0 mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="bg-surface-raised border border-surface-border rounded-xl px-3 py-2.5">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="flex items-center gap-1.5">
              <Link
                to={`/profile/${comment.author.username}`}
                className="text-sm font-semibold text-white hover:text-brand-300 transition-colors"
              >
                {comment.author.displayName || 'Anonim'}
              </Link>
              <span className="text-xs text-gray-600">·</span>
              <span className="text-xs text-gray-500">{timeAgo(comment.createdAt)}</span>
            </div>
            {currentUserId === comment.authorId && (
              <button
                onClick={() => onDelete(comment.id)}
                className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
                title="Yorumu sil"
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <CommentContent content={comment.content} />
        </div>
        <button
          onClick={() => onReply(comment.id, comment.author.username)}
          className="mt-1 ml-3 text-xs text-gray-500 hover:text-brand-400 transition-colors"
        >
          Yanıtla
        </button>

        {/* Replies */}
        {comment.replies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar
                  src={reply.author.avatarUrl}
                  alt={reply.author.displayName || 'Anonim'}
                  size="xs"
                  className="shrink-0 mt-0.5"
                />
                <div className="flex-1 min-w-0">
                  <div className="bg-surface-raised border border-surface-border rounded-xl px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={`/profile/${reply.author.username}`}
                          className="text-sm font-semibold text-white hover:text-brand-300 transition-colors"
                        >
                          {reply.author.displayName || 'Anonim'}
                        </Link>
                        <span className="text-xs text-gray-600">·</span>
                        <span className="text-xs text-gray-500">{timeAgo(reply.createdAt)}</span>
                      </div>
                      {currentUserId === reply.authorId && (
                        <button
                          onClick={() => onDelete(reply.id)}
                          className="p-1 rounded text-gray-600 hover:text-red-400 transition-colors"
                          title="Yorumu sil"
                        >
                          <IconTrash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <CommentContent content={reply.content} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── Main Page ─── */
export default function ArticleViewPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { isAuthenticated, user } = useAuthStore()
  const { openWithArticle } = useComposerStore()
  const createPost = usePostStore((s) => s.createPost)
  const loadArticle = useArticleStore((s) => s.loadArticle)

  const [article, setArticle]               = useState<ArticleRecord | null>(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState<string | null>(null)
  const [comments, setComments]             = useState<ArticleComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentText, setCommentText]       = useState('')
  const [replyTo, setReplyTo]               = useState<{ parentId: string; username: string } | null>(null)
  const [submitting, setSubmitting]         = useState(false)
  const [showSnippet, setShowSnippet]       = useState(false)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [statsOpen, setStatsOpen]           = useState(false)
  const [menuOpen, setMenuOpen]             = useState(false)
  const [repostMenuOpen, setRepostMenuOpen] = useState(false)
  const menuRef         = useRef<HTMLDivElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = commentInputRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [commentText])
  const repostMenuRef = useRef<HTMLDivElement>(null)

  /* Load article */
  useEffect(() => {
    if (!id) return
    setLoading(true)
    articleService.get(id)
      .then((rec) => {
        if (!rec.isPublished) {
          setError('Bu makale henüz yayınlanmamış.')
        } else {
          setArticle(rec)
        }
      })
      .catch(() => setError('Makale bulunamadı.'))
      .finally(() => setLoading(false))
  }, [id])

  /* Load comments after article is set */
  useEffect(() => {
    if (!article) return
    setCommentsLoading(true)
    articleService.getComments(article.id)
      .then(setComments)
      .catch(() => {})
      .finally(() => setCommentsLoading(false))
  }, [article?.id])

  /* Close menu on outside click */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!repostMenuOpen) return
    const handler = (e: MouseEvent) => {
      if (repostMenuRef.current && !repostMenuRef.current.contains(e.target as Node)) setRepostMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [repostMenuOpen])

  /* ── Handlers ── */
  const handleLike = async () => {
    if (!article) return
    if (!isAuthenticated) { toast.error('Beğenmek için giriş yapmalısın'); return }
    const wasLiked = article.isLiked
    setArticle((a) =>
      a ? { ...a, isLiked: !a.isLiked, likesCount: Math.max(0, a.likesCount + (a.isLiked ? -1 : 1)) } : a,
    )
    try {
      await (wasLiked ? articleService.unlike(article.id) : articleService.like(article.id))
    } catch (err) {
      setArticle((a) =>
        a ? { ...a, isLiked: wasLiked, likesCount: Math.max(0, a.likesCount + (wasLiked ? 1 : -1)) } : a,
      )
      toast.error((err as Error).message || 'Bir hata oluştu')
    }
  }

  const handleSave = async () => {
    if (!article) return
    if (!isAuthenticated) { toast.error('Kaydetmek için giriş yapmalısın'); return }
    const wasSaved = article.isSaved
    setArticle((a) =>
      a ? { ...a, isSaved: !a.isSaved, savesCount: Math.max(0, a.savesCount + (a.isSaved ? -1 : 1)) } : a,
    )
    try {
      await (wasSaved ? articleService.unsaveArticle(article.id) : articleService.saveArticle(article.id))
      toast.success(wasSaved ? 'Kaydedilenlerden kaldırıldı' : 'Makale kaydedildi!')
    } catch (err) {
      setArticle((a) =>
        a ? { ...a, isSaved: wasSaved, savesCount: Math.max(0, a.savesCount + (wasSaved ? 1 : -1)) } : a,
      )
      toast.error((err as Error).message || 'Bir hata oluştu')
    }
  }

  const handleDirectRepost = async () => {
    if (!article) return
    if (!isAuthenticated) { toast.error('Paylaşmak için giriş yapmalısın'); return }
    setRepostMenuOpen(false)
    try {
      await createPost({
        type: 'repost',
        title: article.title,
        blocks: [{ type: 'article', position: 0, data: { articleId: article.id, title: article.title, coverImage: article.coverImage, content: extractPlainText(article) } }],
      })
      toast.success('Makale yeniden paylaşıldı!')
    } catch {
      toast.error('Bir hata oluştu')
    }
  }

  const handleQuoteArticle = () => {
    if (!article) return
    if (!isAuthenticated) { toast.error('Paylaşmak için giriş yapmalısın'); return }
    setRepostMenuOpen(false)
    openWithArticle({
      id:         article.id,
      title:      article.title,
      coverImage: article.coverImage,
      content:    extractPlainText(article),
    })
  }

  const handleEditArticle = () => {
    if (!article) return
    setMenuOpen(false)
    loadArticle(article)
    navigate('/makale')
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Link kopyalandı!'))
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!article || !commentText.trim()) return
    setSubmitting(true)
    try {
      const newComment = await articleService.addComment(
        article.id,
        commentText.trim(),
        replyTo?.parentId,
      )
      if (replyTo) {
        setComments((prev) =>
          prev.map((c) =>
            c.id === replyTo.parentId
              ? { ...c, replies: [...c.replies, newComment] }
              : c,
          ),
        )
      } else {
        setComments((prev) => [...prev, newComment])
      }
      setCommentText('')
      setReplyTo(null)
      setShowSnippet(false)
    } catch {
      toast.error('Yorum gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    try {
      await articleService.deleteComment(commentId)
      setComments((prev) => {
        // top-level comment
        const topLevel = prev.filter((c) => c.id !== commentId)
        // or a reply
        return topLevel.map((c) => ({
          ...c,
          replies: c.replies.filter((r) => r.id !== commentId),
        }))
      })
    } catch {
      toast.error('Yorum silinemedi')
    }
  }

  const handleReplyClick = (parentId: string, username: string) => {
    setReplyTo({ parentId, username })
    setCommentText(`@${username} `)
    document.getElementById('comment-input')?.focus()
  }

  /* ── Render: loading / error ── */
  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <Spinner />
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mb-4">
          <IconBook2 className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium text-lg">{error || 'Makale bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors text-sm"
        >
          <IconArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    )
  }

  const totalCommentCount = comments.reduce(
    (sum, c) => sum + 1 + c.replies.length,
    0,
  )

  return (
    <div className="min-h-full bg-surface">
      {/* Cover image */}
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt=""
          className="w-full h-64 sm:h-96 object-cover"
        />
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Title */}
        {article.title && (
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight text-white mb-4">
            {article.title}
          </h1>
        )}
        {article.subtitle && (
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-6">
            {article.subtitle}
          </p>
        )}

        {/* Author + meta */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-3">
            {article.author && (
              <Link
                to={`/profile/${article.author.username}`}
                className="flex items-center gap-2.5 group"
              >
                <Avatar
                  src={article.author.avatarUrl}
                  alt={article.author.displayName}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors">
                    {article.author.displayName}
                  </p>
                  <p className="text-xs text-gray-500">@{article.author.username}</p>
                </div>
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <IconClock className="w-3.5 h-3.5" />
              {formatDate(article.createdAt)}
            </span>
            <span>{readingMinutes(article)} dk okuma</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-gray-500 hover:text-brand-400 transition-colors"
              title="Linki kopyala"
            >
              <IconLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="w-16 h-px bg-surface-border mb-8" />

        {/* Blocks */}
        <ArticleBlocksRenderer blocks={article.blocks} />

        {/* ── Toolbar ── */}
        <div className="border-t border-surface-border/40 mt-10 pt-4 flex items-center gap-4 text-gray-400">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 transition-colors ${
              article.isLiked ? 'text-red-500' : 'hover:text-red-400'
            }`}
            title="Beğen"
          >
            <IconHeart className={`w-[18px] h-[18px] ${article.isLiked ? 'fill-current' : ''}`} />
            {article.likesCount > 0 && <span className="text-sm text-black dark:text-white">{article.likesCount}</span>}
          </button>

          {/* Comments scroll */}
          <button
            onClick={() => document.getElementById('comments')?.scrollIntoView({ behavior: 'smooth' })}
            className="flex items-center gap-1.5 hover:text-white transition-colors"
            title="Yorumlar"
          >
            <IconMessageCircle className="w-[18px] h-[18px]" />
            {totalCommentCount > 0 && <span className="text-sm text-black dark:text-white">{totalCommentCount}</span>}
          </button>

          {/* Repost */}
          <div className="relative" ref={repostMenuRef}>
            <button
              onClick={() => setRepostMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 hover:text-green-400 transition-colors"
              title="Yeniden paylaş"
            >
              <IconRepeat className="w-[18px] h-[18px]" />
            </button>
            {repostMenuOpen && (
              <div className="absolute left-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
                <button
                  type="button"
                  onClick={handleDirectRepost}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                >
                  <IconRepeat className="w-4 h-4 text-green-400" />
                  <span className="text-white">Yeniden Gönder</span>
                </button>
                <button
                  type="button"
                  onClick={handleQuoteArticle}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                >
                  <IconQuote className="w-4 h-4 text-brand-400" />
                  <span className="text-white">Alıntı yap</span>
                </button>
              </div>
            )}
          </div>

          {/* Right side */}
          <div className="ml-auto flex items-center gap-1">
            {/* Save */}
            <button
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
                article.isSaved
                  ? 'text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-raised'
              }`}
              title={article.isSaved ? 'Kaydedildi' : 'Kaydet'}
            >
              <IconBookmark className={`w-[18px] h-[18px] ${article.isSaved ? 'fill-current' : ''}`} />
            </button>

            {/* Stats */}
            <button
              onClick={() => setStatsOpen(true)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
              title="İstatistikler"
            >
              <IconChartBar className="w-[18px] h-[18px]" />
            </button>

            {/* 3-dot menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
                title="Daha fazla"
              >
                <IconDots className="w-[18px] h-[18px]" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 bottom-full mb-2 w-48 card shadow-2xl py-1 z-50">
                  {isAuthenticated && user && article.authorId === user.id && (
                    <button
                      onClick={handleEditArticle}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                    >
                      <IconPencil className="w-4 h-4 text-gray-400 shrink-0" />
                      Düzenle
                    </button>
                  )}
                  <button
                    onClick={() => { setShareModalOpen(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                  >
                    <IconShare className="w-4 h-4 text-brand-400 shrink-0" />
                    Paylaş
                  </button>
                  <button
                    onClick={() => { setCollectModalOpen(true); setMenuOpen(false) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                  >
                    <IconFolderPlus className="w-4 h-4 text-brand-400 shrink-0" />
                    Koleksiyona Ekle
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Comments ── */}
        <div id="comments" className="mt-10">
          <h2 className="text-base font-semibold text-white mb-4">
            Yorumlar ({totalCommentCount})
          </h2>

          {isAuthenticated && user && (
            <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
              <Avatar
                src={user.avatarUrl}
                alt={user.displayName ?? ''}
                size="sm"
                className="shrink-0 mt-0.5"
              />
              <div className="flex-1">
                <div className="flex items-end gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2">
                  <div className="flex-1">
                    {replyTo && (
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs text-brand-400">@{replyTo.username} yanıtlanıyor</span>
                        <button
                          type="button"
                          onClick={() => { setReplyTo(null); setCommentText('') }}
                          className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <textarea
                      ref={commentInputRef}
                      id="comment-input"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Yorum yaz..."
                      rows={1}
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 resize-none outline-none"
                      style={{ minHeight: '24px' }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault()
                          handleAddComment(e as unknown as React.FormEvent)
                        }
                      }}
                    />
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowSnippet((v) => !v)}
                      title="Snippet ekle"
                      className={cn(
                        'p-1.5 rounded-lg transition-colors',
                        showSnippet ? 'text-brand-400' : 'text-gray-600 hover:text-gray-300',
                      )}
                    >
                      <IconCode className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="submit"
                      disabled={submitting || !commentText.trim()}
                      className="shrink-0 p-1.5 rounded-lg text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors"
                      title="Gönder"
                    >
                      {submitting ? <Spinner /> : <IconSend className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {showSnippet && (
                  <SnippetPanel
                    onInsert={(snippet) => insertAtCursor(commentInputRef.current, commentText, snippet, setCommentText)}
                    onClose={() => setShowSnippet(false)}
                  />
                )}
              </div>
            </form>
          )}

          {commentsLoading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : comments.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">
              Henüz yorum yok. İlk yorumu yap!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((c) => (
                <CommentRow
                  key={c.id}
                  comment={c}
                  currentUserId={user?.id}
                  onReply={handleReplyClick}
                  onDelete={handleDeleteComment}
                />
              ))}
            </div>
          )}
        </div>
      </article>

      {/* Modals */}
      <AddToCollectionModal
        articleId={article.id}
        open={collectModalOpen}
        onClose={() => setCollectModalOpen(false)}
      />
      <ArticleShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title={article.title}
        articleId={article.id}
      />
      <ArticleStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        articleId={article.id}
        likesCount={article.likesCount}
        savesCount={article.savesCount}
        viewsCount={article.viewsCount}
      />
    </div>
  )
}
