import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Link2, BookOpen, Heart, MessageSquare, Quote, Bookmark, MoreHorizontal, Share2, FolderPlus, BarChart2 } from 'lucide-react'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import { ArticleBlocksRenderer } from '@pages/Article'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { useComposerStore } from '@store/composerStore'
import { useAuthStore } from '@store/authStore'
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

function ArticleToolbar({ article }: { article: ArticleRecord }) {
  const { openWithArticle } = useComposerStore()
  const { isAuthenticated } = useAuthStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleQuote = () => {
    if (!isAuthenticated) { toast.error('Alıntı yapmak için giriş yapmalısın'); return }
    openWithArticle({
      id: article.id,
      title: article.title,
      coverImage: article.coverImage,
      content: extractPlainText(article),
    })
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Link kopyalandı!'))
    setMenuOpen(false)
  }

  const handleLike = () => {
    if (!isAuthenticated) { toast.error('Beğenmek için giriş yapmalısın'); return }
    toast('Yakında', { icon: '❤️' })
  }

  const handleComment = () => {
    if (!isAuthenticated) { toast.error('Yorum yapmak için giriş yapmalısın'); return }
    toast('Yakında', { icon: '💬' })
  }

  const handleSave = () => {
    if (!isAuthenticated) { toast.error('Kaydetmek için giriş yapmalısın'); return }
    toast('Yakında', { icon: '🔖' })
  }

  const handleAddToCollection = () => {
    toast('Yakında', { icon: '📁' })
    setMenuOpen(false)
  }

  const handleStats = () => {
    toast(`${article.viewsCount} görüntülenme`, { icon: '📊' })
    setMenuOpen(false)
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-surface-border bg-surface/95 backdrop-blur-md">
      <div className="flex items-center justify-between max-w-3xl mx-auto px-4 h-14">
        {/* Left actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-red-400 hover:bg-surface-raised transition-colors"
            title="Beğen"
          >
            <Heart className="w-[18px] h-[18px]" />
            <span className="text-sm">0</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
            title="Yorum yap"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
            <span className="text-sm">0</span>
          </button>

          <button
            onClick={handleQuote}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
            title="Alıntı yap"
          >
            <Quote className="w-[18px] h-[18px]" />
            <span className="text-sm hidden sm:inline">Alıntı yap</span>
          </button>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
            title="Kaydet"
          >
            <Bookmark className="w-[18px] h-[18px]" />
            <span className="text-sm hidden sm:inline">Kaydet</span>
          </button>

          {/* 3-dot menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
              title="Daha fazla"
            >
              <MoreHorizontal className="w-[18px] h-[18px]" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 bottom-full mb-2 w-48 card shadow-2xl py-1 z-50">
                <button
                  onClick={handleShare}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                >
                  <Share2 className="w-4 h-4 text-brand-400 shrink-0" />
                  Paylaş
                </button>
                <button
                  onClick={handleAddToCollection}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                >
                  <FolderPlus className="w-4 h-4 text-brand-400 shrink-0" />
                  Koleksiyona Ekle
                </button>
                <button
                  onClick={handleStats}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                >
                  <BarChart2 className="w-4 h-4 text-brand-400 shrink-0" />
                  İstatistik
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ArticleViewPage() {
  const { id }   = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [article, setArticle] = useState<ArticleRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => toast.success('Link kopyalandı!'))
  }

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
          <BookOpen className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium text-lg">{error || 'Makale bulunamadı'}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-6 flex items-center gap-2 text-brand-400 hover:text-brand-300 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Geri Dön
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-full bg-surface pb-14">
      {/* Kapak görseli */}
      {article.coverImage && (
        <img
          src={article.coverImage}
          alt=""
          className="w-full h-64 sm:h-96 object-cover"
        />
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Başlık */}
        {article.title && (
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            {article.title}
          </h1>
        )}
        {article.subtitle && (
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-6">
            {article.subtitle}
          </p>
        )}

        {/* Yazar + meta */}
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
              <Clock className="w-3.5 h-3.5" />
              {formatDate(article.createdAt)}
            </span>
            <span>{readingMinutes(article)} dk okuma</span>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 text-gray-500 hover:text-brand-400 transition-colors"
              title="Linki kopyala"
            >
              <Link2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="w-16 h-px bg-surface-border mb-8" />

        {/* Bloklar */}
        <ArticleBlocksRenderer blocks={article.blocks} />
      </article>

      {/* Sticky toolbar */}
      <ArticleToolbar article={article} />
    </div>
  )
}
