import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Clock, Heart, MessageSquare, Bookmark, Share2, FolderPlus, BarChart2, MoreHorizontal } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import ArticleShareModal from '@modules/social/ArticleShareModal'
import ArticleStatsModal from '@modules/post/ArticleStatsModal'
import { articleService } from '@services/articleService'
import type { ArticleRecord } from '@services/articleService'
import { useAuthStore } from '@store/authStore'
import { timeAgo } from '@utils/formatters'
import toast from 'react-hot-toast'
import type { ArticleBlock } from '@store/articleStore'

function readMinutes(blocks: ArticleBlock[]) {
  const words = blocks
    .map((b) => (b.content ?? '').replace(/<[^>]*>/g, '') || (b as { code?: string }).code || '')
    .join(' ')
    .split(/\s+/)
    .filter(Boolean).length
  return Math.max(1, Math.round(words / 200))
}

interface ArticleCardProps {
  article: ArticleRecord
}

export default function ArticleCard({ article: initialArticle }: ArticleCardProps) {
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
    setArticle((a) => ({ ...a, isSaved: !a.isSaved, savesCount: Math.max(0, a.savesCount + (a.isSaved ? -1 : 1)) }))
    try {
      await (wasSaved ? articleService.unsaveArticle(article.id) : articleService.saveArticle(article.id))
      toast.success(wasSaved ? 'Kaydedilenlerden kaldırıldı' : 'Makale kaydedildi!')
    } catch (err) {
      setArticle((a) => ({ ...a, isSaved: wasSaved, savesCount: Math.max(0, a.savesCount + (wasSaved ? 1 : -1)) }))
      toast.error((err as Error).message || 'Bir hata oluştu')
    }
  }

  return (
    <article className="card overflow-hidden hover:border-surface-raised transition-colors group">
      {/* Cover image */}
      {article.coverImage && (
        <Link to={`/makale/${article.id}`} className="block">
          <img src={article.coverImage} alt="" className="w-full h-36 object-cover" />
        </Link>
      )}

      <div className="p-4">
        {/* Author row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {article.author ? (
            <Link to={`/profile/${article.author.username}`} className="flex items-center gap-2.5 min-w-0">
              <Avatar src={article.author.avatarUrl} alt={article.author.displayName} size="sm" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-white truncate">{article.author.displayName}</p>
                <p className="text-xs text-gray-500">@{article.author.username} · {timeAgo(article.createdAt)}</p>
              </div>
            </Link>
          ) : <div />}

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

        {/* Title + subtitle */}
        <Link to={`/makale/${article.id}`} className="block mb-3">
          <div className="flex items-start gap-2.5">
            {!article.coverImage && (
              <div className="w-8 h-8 rounded-lg bg-surface-raised flex items-center justify-center shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2">
                {article.title}
              </h3>
              {article.subtitle && (
                <p className="text-sm text-gray-400 line-clamp-2 mt-0.5">{article.subtitle}</p>
              )}
            </div>
          </div>
        </Link>

        {/* Reading time */}
        <p className="flex items-center gap-1 text-xs text-gray-600 mb-3">
          <Clock className="w-3 h-3" />
          {readMinutes(article.blocks)} dk okuma
        </p>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-3 border-t border-surface-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
              article.isLiked ? 'text-red-400 bg-red-500/10' : 'text-gray-400 hover:text-red-400 hover:bg-surface-raised'
            }`}
          >
            <Heart className={`w-[18px] h-[18px] ${article.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm">{article.likesCount}</span>
          </button>

          <Link
            to={`/makale/${article.id}#comments`}
            className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-gray-400 hover:text-brand-400 hover:bg-surface-raised transition-colors"
          >
            <MessageSquare className="w-[18px] h-[18px]" />
          </Link>

          <button
            onClick={handleSave}
            className={`ml-auto flex items-center gap-1.5 px-3 h-9 rounded-lg transition-colors ${
              article.isSaved ? 'text-brand-400 bg-brand-500/10' : 'text-gray-400 hover:text-brand-400 hover:bg-surface-raised'
            }`}
          >
            <Bookmark className={`w-[18px] h-[18px] ${article.isSaved ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

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
    </article>
  )
}
