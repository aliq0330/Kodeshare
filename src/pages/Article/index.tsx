import { useNavigate } from 'react-router-dom'
import { PenLine, Clock, Globe, Lock, Trash2, Plus, BookOpen } from 'lucide-react'
import { useArticleStore } from '@store/articleStore'
import { formatDistanceToNow } from 'date-fns'

export default function ArticlesPage() {
  const navigate = useNavigate()
  const { articles, create, remove } = useArticleStore()

  const handleNew = () => {
    navigate('/article/new')
  }

  const handleOpen = (id: string) => {
    navigate(`/article/${id}`)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('Bu makaleyi silmek istediğinize emin misiniz?')) remove(id)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <BookOpen className="w-6 h-6 text-brand-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Makalelerim</h1>
            <p className="text-sm text-gray-500">{articles.length} makale</p>
          </div>
        </div>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yeni Makale
        </button>
      </div>

      {/* List */}
      {articles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-6 select-none">
          <div className="w-20 h-20 rounded-2xl bg-[#1a2233] border border-[#2a3347] flex items-center justify-center">
            <PenLine className="w-8 h-8 text-gray-600" />
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-medium mb-1">Henüz makale yok</p>
            <p className="text-sm text-gray-600">İlk makaleni yazmaya başla</p>
          </div>
          <button
            onClick={handleNew}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Makale Yaz
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map(article => {
            const title    = article.title.replace(/<[^>]+>/g, '').trim() || 'Başlıksız Makale'
            const subtitle = article.subtitle.replace(/<[^>]+>/g, '').slice(0, 120).trim()
            const wordCount = article.blocks
              .map(b => b.content.replace(/<[^>]+>/g, ''))
              .join(' ').split(/\s+/).filter(Boolean).length

            return (
              <div
                key={article.id}
                onClick={() => handleOpen(article.id)}
                className="group relative bg-[#0f1623] hover:bg-[#131c2e] border border-[#2a3347] hover:border-[#3a4357] rounded-2xl p-5 cursor-pointer transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {article.published
                        ? <span className="flex items-center gap-1 text-[11px] text-green-400 bg-green-900/20 px-2 py-0.5 rounded-full"><Globe className="w-3 h-3" /> Yayında</span>
                        : <span className="flex items-center gap-1 text-[11px] text-gray-500 bg-[#1a2233] px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Taslak</span>
                      }
                    </div>
                    <h2 className="text-base font-semibold text-white mb-1 leading-snug truncate">{title}</h2>
                    {subtitle && (
                      <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-2">{subtitle}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-600">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {article.readingTime} dk</span>
                      <span>{wordCount} kelime</span>
                      <span>
                        {formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true })}
                      </span>
                      {article.tags.length > 0 && (
                        <span className="flex gap-1">
                          {article.tags.slice(0, 3).map(t => (
                            <span key={t} className="text-brand-500">#{t}</span>
                          ))}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={e => { e.stopPropagation(); handleOpen(article.id) }}
                      className="p-1.5 rounded-lg hover:bg-[#1e2535] text-gray-500 hover:text-white transition-colors"
                      title="Düzenle"
                    >
                      <PenLine className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={e => handleDelete(e, article.id)}
                      className="p-1.5 rounded-lg hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                      title="Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
