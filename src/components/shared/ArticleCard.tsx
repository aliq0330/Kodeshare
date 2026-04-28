import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Heart, MessageCircle, Bookmark, Share2, FolderPlus, BarChart2, MoreHorizontal, FolderMinus } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import ArticleShareModal from '@modules/social/ArticleShareModal'
import ArticleStatsModal from '@modules/post/ArticleStatsModal'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import { useAuthStore } from '@store/authStore'
import { timeAgo, compactNumber } from '@utils/formatters'
import toast from 'react-hot-toast'

interface ArticleCardProps {
  article: ArticleRecord
  onRemoveFromCollection?: () => void
}

export default function ArticleCard({ article: initialArticle, onRemoveFromCollection }: ArticleCardProps) {
  const [article, setArticle]       = useState(initialArticle)
  const [menuOpen, setMenuOpen]     = useState(false)
  const [collectOpen, setCollectOpen] = useState(false)
  const [shareOpen, setShareOpen]   = useState(false)
  const [statsOpen, setStatsOpen]   = useState(false)
  const { isAuthenticated }         = useAuthStore()
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const handleLike = async () => {
    if (!isAuthenticated) { toast.error('Beğenmek için giriş yapmalısın'); return }
    const wasLiked = article.isLiked
    setArticle((a) => ({ ...a, isLiked: !a.isLiked, likesCount: Math.max(0, a.likesCount + (a.isLiked ? -1 : 1)) }))
    try {
      await (wasLiked ? articleService.unlike(article.id) : articleService.like(article.id))
    } catch (err) {
      setArticle((a) => ({ ...a, isLiked: wasLiked, likesCount: Math.max(0, a.likesCount + (wasLiked ? 1 : -1)) }))
      toast.error((err as Error).message || 'Bir hata oluştu')
    }
  }

  const handleSave = async () => {
    if (!isAuthenticated) { toast.error('Kaydetmek için giriş yapmalısın'); return }
    const wasSaved = article.isSaved
    setArticle((a) => ({ ...a, isSaved: !a.isSaved }))
    try {
      await (wasSaved ? articleService.unsaveArticle(article.id) : articleService.saveArticle(article.id))
      toast.success(wasSaved ? 'Kaydedilenlerden kaldırıldı' : 'Makale kaydedildi!')
    } catch (err) {
      setArticle((a) => ({ ...a, isSaved: wasSaved }))
      toast.error((err as Error).message || 'Bir hata oluştu')
    }
  }

  return (
    <>
      <article className="border-b border-surface-border group">
        <div className="flex gap-3 px-4 pt-3 pb-4">
          {/* Avatar */}
          {article.author && (
            <Link to={`/profile/${article.author.username}`} className="shrink-0 mt-0.5">
              <Avatar src={article.author.avatarUrl} alt={article.author.displayName} size="sm" />
            </Link>
          )}

          <div className="flex-1 min-w-0">
            {/* Author row */}
            <div className="flex items-start justify-between gap-2 mb-1">
              {article.author && (
                <Link to={`/profile/${article.author.username}`} className="min-w-0">
                  <span className="font-semibold text-sm text-white">{article.author.displayName}</span>
                  <span className="text-xs text-gray-400 ml-1.5">@{article.author.username} · {timeAgo(article.createdAt)}</span>
                </Link>
              )}
              {isAuthenticated && (
                <div className="relative shrink-0" ref={menuRef}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((v) => !v)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
                      <button
                        type="button"
                        onClick={() => { setShareOpen(true); setMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <Share2 className="w-4 h-4 text-sky-400" />
                        <span className="text-white">Paylaş</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setCollectOpen(true); setMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <FolderPlus className="w-4 h-4 text-brand-400" />
                        <span className="text-white">Koleksiyona ekle</span>
                      </button>
                      {onRemoveFromCollection && (
                        <button
                          type="button"
                          onClick={() => { setMenuOpen(false); onRemoveFromCollection() }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                        >
                          <FolderMinus className="w-4 h-4 text-red-400" />
                          <span className="text-red-400">Bu koleksiyondan çıkar</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => { setStatsOpen(true); setMenuOpen(false) }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                      >
                        <BarChart2 className="w-4 h-4 text-purple-400" />
                        <span className="text-white">İstatistikler</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Cover image */}
            {article.coverImage && (
              <Link to={`/makale/${article.id}`} className="block mb-2 rounded-xl overflow-hidden border border-surface-border">
                <img src={article.coverImage} alt="" className="w-full h-36 object-cover" />
              </Link>
            )}

            {/* Title + subtitle */}
            <Link to={`/makale/${article.id}`} className="block mb-2">
              <div className="flex items-start gap-2">
                {!article.coverImage && (
                  <div className="w-7 h-7 rounded-lg bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-gray-500" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-white line-clamp-2 group-hover:text-brand-300 transition-colors">{article.title}</h3>
                  {article.subtitle && (
                    <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{article.subtitle}</p>
                  )}
                </div>
              </div>
            </Link>

            {/* Actions */}
            <div className="flex items-center gap-4 text-gray-400">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 transition-colors ${article.isLiked ? 'text-white' : 'hover:text-white'}`}
              >
                <Heart className={`w-[18px] h-[18px] ${article.isLiked ? 'fill-current' : ''}`} />
                <span className="text-xs">{compactNumber(article.likesCount)}</span>
              </button>

              <Link
                to={`/makale/${article.id}#comments`}
                className="flex items-center gap-1.5 hover:text-white transition-colors"
              >
                <MessageCircle className="w-[18px] h-[18px]" />
              </Link>

              <button
                onClick={handleSave}
                className={`ml-auto flex items-center gap-1.5 transition-colors ${article.isSaved ? 'text-white' : 'hover:text-white'}`}
              >
                <Bookmark className={`w-[18px] h-[18px] ${article.isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </article>

      <AddToCollectionModal
        articleId={article.id}
        open={collectOpen}
        onClose={() => setCollectOpen(false)}
      />
      <ArticleShareModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
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
    </>
  )
}
