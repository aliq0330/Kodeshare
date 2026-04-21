import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Clock, Calendar, Tag, Share2, PenLine, Globe, Lock } from 'lucide-react'
import { useArticleStore, type BlockType } from '@store/articleStore'
import { useAuthStore } from '@store/authStore'

// ── Block renderer (read-only) ─────────────────────────────────────────────────

function ViewBlock({ type, content }: { type: BlockType; content: string }) {
  if (type === 'divider') return <hr className="border-[#2a3347] my-8" />

  if (type === 'image') {
    if (!content.trim()) return null
    return (
      <figure className="my-8">
        <img
          src={content.replace(/<[^>]+>/g, '').trim()}
          alt=""
          className="w-full rounded-2xl object-cover max-h-[520px] border border-[#2a3347]"
        />
      </figure>
    )
  }

  if (type === 'code') {
    return (
      <pre className="bg-[#0a0f1a] border border-[#2a3347] rounded-2xl p-5 my-6 overflow-x-auto">
        <code
          className="font-mono text-sm text-green-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </pre>
    )
  }

  if (type === 'quote') {
    return (
      <blockquote
        className="border-l-4 border-brand-400 pl-6 py-1 my-6 italic text-xl text-gray-300 leading-relaxed"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    )
  }

  if (type === 'h1') return (
    <h1 className="text-3xl font-bold text-white mt-10 mb-4 leading-tight"
      dangerouslySetInnerHTML={{ __html: content }} />
  )
  if (type === 'h2') return (
    <h2 className="text-2xl font-bold text-white mt-8 mb-3 leading-snug"
      dangerouslySetInnerHTML={{ __html: content }} />
  )
  if (type === 'h3') return (
    <h3 className="text-xl font-semibold text-white mt-6 mb-2"
      dangerouslySetInnerHTML={{ __html: content }} />
  )

  // paragraph
  if (!content.trim() || content === '<br>') return <div className="my-2" />
  return (
    <p
      className="text-[17px] text-gray-200 leading-[1.85] my-4"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

// ── Main view page ─────────────────────────────────────────────────────────────

export default function ArticleViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { articles } = useArticleStore()
  const { user } = useAuthStore()

  const article = articles.find(a => a.id === id)

  if (!article) {
    return (
      <div className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center gap-4 text-center px-4">
        <p className="text-2xl font-bold text-white">Makale bulunamadı</p>
        <p className="text-gray-500 text-sm">Bu makale mevcut değil ya da silinmiş olabilir.</p>
        <button
          onClick={() => navigate('/articles')}
          className="mt-2 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Makalelerime Dön
        </button>
      </div>
    )
  }

  const title    = article.title.replace(/<[^>]+>/g, '').trim() || 'Başlıksız Makale'
  const subtitle = article.subtitle.replace(/<[^>]+>/g, '').trim()
  const date     = new Date(article.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => alert('Bağlantı kopyalandı!'))
      .catch(() => {})
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-white">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 border-b border-[#2a3347] bg-[#0d1117]/95 backdrop-blur-md">
        <div className="max-w-[720px] mx-auto px-6 h-13 flex items-center gap-3">
          <button
            onClick={() => navigate('/articles')}
            className="p-1.5 rounded-lg hover:bg-[#1e2535] text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 truncate">{title}</p>
          </div>

          <div className="flex items-center gap-2">
            {article.published
              ? <span className="flex items-center gap-1 text-xs text-green-400"><Globe className="w-3.5 h-3.5" />Yayında</span>
              : <span className="flex items-center gap-1 text-xs text-gray-500"><Lock className="w-3.5 h-3.5" />Taslak</span>
            }
            <Link
              to={`/article/${article.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[#1e2535] transition-colors"
            >
              <PenLine className="w-3.5 h-3.5" />
              Düzenle
            </Link>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-brand-600 hover:bg-brand-500 text-white transition-colors"
            >
              <Share2 className="w-3.5 h-3.5" />
              Paylaş
            </button>
          </div>
        </div>
      </header>

      {/* ── Article content ── */}
      <article className="max-w-[680px] mx-auto px-6 py-14">

        {/* Meta */}
        <div className="flex items-center gap-3 mb-8 text-xs text-gray-500">
          <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{date}</span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{article.readingTime} dk okuma</span>
          {article.tags.length > 0 && (
            <>
              <span className="w-1 h-1 rounded-full bg-gray-700" />
              <span className="flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                {article.tags.slice(0, 4).map(t => (
                  <span key={t} className="text-brand-400">#{t}</span>
                ))}
              </span>
            </>
          )}
        </div>

        {/* Title */}
        <h1 className="text-[2.6rem] font-bold text-white leading-tight mb-4">{title}</h1>

        {/* Subtitle */}
        {subtitle && (
          <p className="text-xl text-gray-400 leading-relaxed mb-10">{subtitle}</p>
        )}

        <div className="border-t border-[#2a3347] mb-10" />

        {/* Blocks */}
        <div>
          {article.blocks.map(block => (
            <ViewBlock key={block.id} type={block.type} content={block.content} />
          ))}
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-[#2a3347] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt={user.displayName} className="w-9 h-9 rounded-full" />
            )}
            <div>
              <p className="text-sm font-medium text-white">{user?.displayName ?? 'Yazar'}</p>
              {user?.username && <p className="text-xs text-gray-500">@{user.username}</p>}
            </div>
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#2a3347] hover:border-brand-600/50 text-gray-400 hover:text-white text-sm transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            Bağlantıyı Kopyala
          </button>
        </div>
      </article>
    </div>
  )
}
