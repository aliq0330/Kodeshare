import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { IconFilePencil, IconTrash, IconClock, IconPlus, IconBook2, IconWorld, IconLink, IconEyeOff } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import Spinner from '@components/ui/Spinner'
import toast from 'react-hot-toast'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function wordCount(record: ArticleRecord) {
  const text = record.blocks
    .map((b) => b.content?.replace(/<[^>]*>/g, '') ?? b.code ?? '')
    .join(' ')
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function ArticlesPage() {
  const navigate    = useNavigate()
  const { reset, loadArticle } = useArticleStore()

  const [articles, setArticles] = useState<ArticleRecord[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    articleService.list()
      .then(setArticles)
      .catch(() => toast.error('Makaleler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [])

  const handleNew = () => {
    reset()
    navigate('/makale')
  }

  const handleOpen = (record: ArticleRecord) => {
    loadArticle(record)
    navigate('/makale')
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Bu makaleyi silmek istediğine emin misin?')) return
    try {
      await articleService.delete(id)
      setArticles((prev) => prev.filter((a) => a.id !== id))
      toast.success('Makale silindi')
    } catch {
      toast.error('Silinemedi')
    }
  }

  const handleCopyLink = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}${import.meta.env.BASE_URL}makale/${id}`
    navigator.clipboard.writeText(url).then(() => toast.success('Link kopyalandı!'))
  }

  const handleUnpublish = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await articleService.unpublish(id)
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, isPublished: false } : a)),
      )
      toast.success('Yayından kaldırıldı')
    } catch {
      toast.error('İşlem başarısız')
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Makalelerim</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading
              ? 'Yükleniyor...'
              : articles.length > 0
                ? `${articles.length} makale`
                : 'Henüz makale yok'}
          </p>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-4 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
        >
          <IconPlus className="w-4 h-4" />
          Yeni Makale
        </button>
      </div>

      {/* Yükleniyor */}
      {loading && (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      )}

      {/* Boş durum */}
      {!loading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-surface-raised flex items-center justify-center mb-4">
            <IconBook2 className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Henüz makale yok</p>
          <p className="text-gray-600 text-sm mt-1 mb-6">
            Yeni bir makale oluştur ve "Taslak" butonuyla kaydet.
          </p>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 px-5 h-10 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
          >
            <IconPlus className="w-4 h-4" />
            İlk Makaleyi Yaz
          </button>
        </div>
      )}

      {/* Makale listesi */}
      {!loading && articles.length > 0 && (
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
              {/* Kapak görseli */}
              {article.coverImage ? (
                <img
                  src={article.coverImage}
                  alt=""
                  className="w-20 h-16 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-20 h-16 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                  <IconBook2 className="w-6 h-6 text-gray-700" />
                </div>
              )}

              {/* İçerik */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-base font-semibold text-white truncate group-hover:text-brand-300 transition-colors">
                    {article.title}
                  </h2>
                  {article.isPublished && (
                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                      <IconWorld className="w-2.5 h-2.5" />
                      Yayında
                    </span>
                  )}
                </div>
                {article.subtitle && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{article.subtitle}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <IconClock className="w-3 h-3" />
                    {formatDate(article.updatedAt)}
                  </span>
                  <span>{wordCount(article)} kelime</span>
                  <span>{article.blocks.length} blok</span>
                </div>
              </div>

              {/* Eylemler */}
              <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                {article.isPublished && (
                  <>
                    <button
                      onClick={(e) => handleCopyLink(article.id, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
                      title="Linki kopyala"
                    >
                      <IconLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleUnpublish(article.id, e)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-yellow-400 hover:bg-surface-raised transition-colors"
                      title="Yayından kaldır"
                    >
                      <IconEyeOff className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); handleOpen(article) }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
                  title="Düzenle"
                >
                  <IconFilePencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(article.id, e)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  title="Sil"
                >
                  <IconTrash className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
