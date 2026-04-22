import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { Home, Compass, Star, User, Code2, FileText, X, Plus, BookOpen, Clock } from 'lucide-react'
import { cn } from '@utils/cn'
import { useAuthStore } from '@store/authStore'
import { useArticleStore, listArticles } from '@store/articleStore'
import type { SavedArticleRecord } from '@store/articleStore'

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function ArticleSheet({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  const { reset, loadArticle, deleteArticle } = useArticleStore()
  const [articles, setArticles] = useState<SavedArticleRecord[]>(() => listArticles())

  const handleNew = () => {
    reset()
    onClose()
    navigate('/makale')
  }

  const handleOpen = (record: SavedArticleRecord) => {
    loadArticle(record)
    onClose()
    navigate('/makale')
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deleteArticle(id)
    setArticles((prev) => prev.filter((a) => a.id !== id))
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl border-t border-surface-border flex flex-col max-h-[80vh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-surface-raised" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
          <h2 className="text-base font-semibold text-white">Makalelerim</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleNew}
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Yeni
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 p-3 space-y-2 pb-6">
          {articles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="w-10 h-10 text-gray-700 mb-3" />
              <p className="text-gray-500 text-sm">Henüz kaydedilmiş makale yok</p>
              <button
                onClick={handleNew}
                className="mt-4 flex items-center gap-1.5 px-4 h-9 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                İlk Makaleyi Yaz
              </button>
            </div>
          ) : (
            articles.map((article) => (
              <div
                key={article.id}
                onClick={() => handleOpen(article)}
                className="flex items-start gap-3 p-3 rounded-xl border border-surface-border bg-surface-card hover:bg-surface-raised active:scale-[0.98] transition-all cursor-pointer"
              >
                {article.coverImage ? (
                  <img
                    src={article.coverImage}
                    alt=""
                    className="w-14 h-12 rounded-lg object-cover shrink-0"
                  />
                ) : (
                  <div className="w-14 h-12 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                    <BookOpen className="w-5 h-5 text-gray-700" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{article.title}</p>
                  {article.subtitle && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">{article.subtitle}</p>
                  )}
                  <div className="flex items-center gap-1 mt-1 text-[11px] text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{formatDate(article.updatedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(article.id, e)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0 mt-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}

const NAV_ITEMS = [
  { to: '/',        icon: Home,     label: 'Ana Sayfa', end: true },
  { to: '/explore', icon: Compass,  label: 'Keşfet' },
  { to: '/editor',  icon: Code2,    label: 'Editör' },
  { to: '/featured',icon: Star,     label: 'Öne Çıkanlar' },
]

export default function MobileNav() {
  const { user, isAuthenticated } = useAuthStore()
  const [sheetOpen, setSheetOpen] = useState(false)

  return (
    <>
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface-border h-16 flex items-center justify-around px-2">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('w-5 h-5', isActive && 'text-brand-400')} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}

        {/* Makale butonu — sheet açar */}
        {isAuthenticated && (
          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors text-gray-500 hover:text-brand-400"
          >
            <FileText className="w-5 h-5" />
            <span className="text-[10px] font-medium">Makale</span>
          </button>
        )}

        {isAuthenticated && (
          <NavLink
            to={`/profile/${user?.username}`}
            className={({ isActive }) =>
              cn('flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors', isActive ? 'text-brand-400' : 'text-gray-500')
            }
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profil</span>
          </NavLink>
        )}
      </nav>

      {sheetOpen && <ArticleSheet onClose={() => setSheetOpen(false)} />}
    </>
  )
}
