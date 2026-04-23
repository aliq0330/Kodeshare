import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Link2, BookOpen } from 'lucide-react'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import { ArticleBlocksRenderer } from '@pages/Article'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
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
    <div className="min-h-full bg-surface">
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
    </div>
  )
}
