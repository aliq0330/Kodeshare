import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Globe } from 'lucide-react'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import Spinner from '@components/ui/Spinner'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ArticlesTab({ username }: { username: string }) {
  const [articles, setArticles] = useState<ArticleRecord[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    articleService.listPublishedByUsername(username)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false))
  }, [username])

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>

  if (articles.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="font-medium">Henüz yayınlanmış makale yok</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {articles.map((article) => (
        <Link
          key={article.id}
          to={`/makale/${article.id}`}
          className="group flex items-start gap-4 p-4 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-raised hover:border-surface-border/80 transition-all"
        >
          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt=""
              className="w-20 h-16 rounded-lg object-cover shrink-0"
            />
          ) : (
            <div className="w-20 h-16 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
              <BookOpen className="w-6 h-6 text-gray-700" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-white truncate group-hover:text-brand-300 transition-colors mb-0.5">
              {article.title}
            </h2>
            {article.subtitle && (
              <p className="text-sm text-gray-500 truncate">{article.subtitle}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(article.updatedAt)}
              </span>
              <span className="flex items-center gap-1 text-green-400">
                <Globe className="w-3 h-3" />
                Yayında
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
