import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FilePen, Trash2, Clock, Plus, BookOpen } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore, listArticles } from '@store/articleStore'
import type { SavedArticleRecord } from '@store/articleStore'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function wordCount(record: SavedArticleRecord) {
  const text = record.blocks
    .map((b) => b.content?.replace(/<[^>]*>/g, '') ?? b.code ?? '')
    .join(' ')
  const words = text.trim().split(/\s+/).filter(Boolean).length
  return words
}

export default function ArticlesPage() {
  const navigate = useNavigate()
  const { reset, loadArticle, deleteArticle } = useArticleStore()
  const [articles, setArticles] = useState<SavedArticleRecord[]>([])

  useEffect(() => {
    setArticles(listArticles())
  }, [])

  const handleNew = () => {
    reset()
    navigate('/makale')
  }

  const handleOpen = (record: SavedArticleRecord) => {
    loadArticle(record)
    navigate('/makale')
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteArticle(id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Makalelerim</h1>
          <p className="text-sm text-gray-500 mt-1">
            {articles.length > 0
              ? `${articles.length} taslak kaydedildi`
              : 'Henüz kaydedilmiş makale yok'}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Makale
        </button>
      </div>

      {/* Empty state */}
      {articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mb-4">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Kaydedilmiş makale yok</p>
          <p className="text-gray-600 text-sm mt-1 mb-6">
            Yeni bir makale oluştur ve "Taslak" butonuyla kaydet.
          </p>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            İlk Makaleyi Yaz
          </button>
        </div>
      )}

      {/* Article list */}
      {articles.length > 0 && (
        <div className="flex flex-col gap-3">
          {articles.map((article) => (
            <div
              key={article.id}
              onClick={() => handleOpen(article)}
              className={cn(
                'group flex items-start gap-4 p-4 rounded-xl border border-surface-border',
                'bg-surface-card hover:bg-surface-raised hover:border-surface-border/80',
                'cursor-pointer transition-all',
              )}
            >
              {/* Cover thumbnail */}
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

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                  {article.title}
                </h2>
                {article.subtitle && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{article.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDate(article.updatedAt)}
                  </span>
                  <span>{wordCount(article)} kelime</span>
                  <span>{article.blocks.length} blok</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpen(article) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
                  title="Düzenle"
                >
                  <FilePen className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(article.id, e)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
