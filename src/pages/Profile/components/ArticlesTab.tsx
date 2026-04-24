import { useEffect, useState } from 'react'
import { BookOpen } from 'lucide-react'
import ArticleCard from '@components/shared/ArticleCard'
import Spinner from '@components/ui/Spinner'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'

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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  )
}
