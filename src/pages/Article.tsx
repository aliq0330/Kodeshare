import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, Clock, CheckCheck, MoreHorizontal, Eye, Link2, Globe, EyeOff, Copy } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore, type ArticleBlock } from '@store/articleStore'
import ArticleEditor from '@modules/article/ArticleEditor'
import CodeBlockPreview from '@modules/article/blocks/CodeBlockPreview'
import PostEmbedBlock from '@modules/article/blocks/PostEmbedBlock'
import toast from 'react-hot-toast'

function SaveStatus({ isDirty, isSaving }: { isDirty: boolean; isSaving: boolean }) {
  const [savedFlash, setSavedFlash] = useState(false)

  useEffect(() => {
    if (isSaving || isDirty) return
    setSavedFlash(true)
    const t = setTimeout(() => setSavedFlash(false), 2500)
    return () => clearTimeout(t)
  }, [isSaving, isDirty])

  if (!isSaving && !isDirty && !savedFlash) return null

  return (
    <span className={cn('flex items-center gap-1.5 text-xs transition-colors',
      isSaving      ? 'text-gray-500' :
      savedFlash    ? 'text-green-400' : 'text-gray-500',
    )}>
      {isSaving    ? <Clock className="w-3.5 h-3.5 animate-pulse" /> :
       savedFlash  ? <CheckCheck className="w-3.5 h-3.5" /> :
                     <Clock className="w-3.5 h-3.5 animate-pulse" />}
      <span className="hidden sm:inline">
        {isSaving ? 'Kaydediliyor...' : savedFlash ? 'Kaydedildi' : 'Kaydediliyor...'}
      </span>
    </span>
  )
}

export default function ArticlePage() {
  const navigate = useNavigate()
  const {
    title, isDirty, isSaving, supabaseId, isPublished,
    reset, saveArticle, publishArticle, unpublishArticle,
  } = useArticleStore()

  const [showPreview,   setShowPreview]   = useState(false)
  const [menuOpen,      setMenuOpen]      = useState(false)

  useEffect(() => () => reset(), [reset])

  const articleUrl = supabaseId ? `${window.location.origin}/makale/${supabaseId}` : null

  const handleSaveDraft = async () => {
    try {
      await saveArticle()
      toast.success('Taslak kaydedildi')
    } catch (err) {
      toast.error((err as Error).message || 'Kaydedilemedi')
    }
  }

  const handlePublish = async () => {
    try {
      await publishArticle()
      toast.success('Makale yayınlandı!')
    } catch (err) {
      toast.error((err as Error).message || 'Yayınlanamadı')
    }
  }

  const handleUnpublish = async () => {
    try {
      await unpublishArticle()
      toast.success('Yayından kaldırıldı')
      setMenuOpen(false)
    } catch (err) {
      toast.error((err as Error).message || 'İşlem başarısız')
    }
  }

  const handleCopyLink = () => {
    if (!articleUrl) return
    navigator.clipboard.writeText(articleUrl).then(() => toast.success('Link kopyalandı!'))
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Sabit üst başlık ── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-surface/95 backdrop-blur-md border-b border-surface-border">
        <div className="flex items-center justify-between h-full px-3 sm:px-5 max-w-[1200px] mx-auto gap-3">
          {/* Geri */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Geri</span>
          </button>

          {/* Orta: başlık + kayıt durumu */}
          <div className="flex items-center gap-2 min-w-0">
            {isPublished && (
              <span className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 text-[10px] font-semibold uppercase tracking-wider shrink-0">
                <Globe className="w-3 h-3" />
                Yayında
              </span>
            )}
            <span className="text-sm text-gray-500 truncate max-w-[140px] sm:max-w-xs">
              {title || 'Başlıksız makale'}
            </span>
            <SaveStatus isDirty={isDirty} isSaving={isSaving} />
          </div>

          {/* Eylemler */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Link kopyala (yayındaysa) */}
            {isPublished && articleUrl && (
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
                title="Linki kopyala"
              >
                <Link2 className="w-4 h-4" />
                <span className="hidden sm:inline">Link</span>
              </button>
            )}

            {/* Önizle */}
            <button
              onClick={() => setShowPreview((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors',
                showPreview
                  ? 'bg-surface-raised text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-raised',
              )}
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Önizle</span>
            </button>

            {/* Taslak kaydet */}
            {!isPublished && (
              <button
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-surface-border text-sm text-gray-300 hover:text-white hover:bg-surface-raised disabled:opacity-50 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span className="hidden sm:inline">Taslak</span>
              </button>
            )}

            {/* Yayınla / Yayında */}
            {isPublished ? (
              <button
                onClick={() => navigate(`/makale/${supabaseId}`)}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition-colors"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Görüntüle</span>
              </button>
            ) : (
              <button
                onClick={handlePublish}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Yayınla</span>
              </button>
            )}

            {/* Daha fazla menüsü */}
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 card shadow-2xl py-1 z-50">
                  {isPublished ? (
                    <>
                      <button
                        onClick={handleCopyLink}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                      >
                        <Copy className="w-4 h-4 text-brand-400 shrink-0" />
                        Linki Kopyala
                      </button>
                      <button
                        onClick={handleUnpublish}
                        disabled={isSaving}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors disabled:opacity-50"
                      >
                        <EyeOff className="w-4 h-4 text-yellow-400 shrink-0" />
                        Yayından Kaldır
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => { handleSaveDraft(); setMenuOpen(false) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left text-gray-300 hover:text-white hover:bg-surface-raised transition-colors"
                    >
                      <Save className="w-4 h-4 text-brand-400 shrink-0" />
                      Taslak Kaydet
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── İçerik alanı ── */}
      <main className="flex-1 pt-14">
        {showPreview ? <ArticlePreview /> : <ArticleEditor />}
      </main>
    </div>
  )
}

// ── Önizleme modu ──────────────────────────────────────────────────────────────
function ArticlePreview() {
  const { title, subtitle, coverImage, blocks } = useArticleStore()
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const mention = (e.target as HTMLElement).closest<HTMLElement>('[data-mention]')
    if (mention) { e.preventDefault(); navigate(`/profile/${mention.dataset.mention}`); return }
    const tag = (e.target as HTMLElement).closest<HTMLElement>('[data-tag]')
    if (tag) { e.preventDefault(); navigate(`/explore?tag=${tag.dataset.tag}`) }
  }

  return (
    <div className="min-h-full bg-surface">
      {coverImage && <img src={coverImage} alt="" className="w-full h-64 sm:h-96 object-cover" />}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10" onClick={handleClick}>
        {title && (
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-8">{subtitle}</p>
        )}
        <div className="w-16 h-px bg-surface-border mb-8" />
        <ArticleBlocksRenderer blocks={blocks} />
      </article>
    </div>
  )
}

// ── Blok render motoru (hem önizleme hem public sayfa kullanır) ────────────────
export function ArticleBlocksRenderer({ blocks }: { blocks: ArticleBlock[] }) {
  const navigate = useNavigate()

  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    const mention = (e.target as HTMLElement).closest<HTMLElement>('[data-mention]')
    if (mention) { e.preventDefault(); navigate(`/profile/${mention.dataset.mention}`); return }
    const tag = (e.target as HTMLElement).closest<HTMLElement>('[data-tag]')
    if (tag) { e.preventDefault(); navigate(`/explore?tag=${tag.dataset.tag}`) }
  }

  return (
    <div className="flex flex-col gap-5" onClick={handleClick}>
      {blocks.map((block) => {
        if (block.type === 'paragraph') return (
          <div key={block.id} className="text-[17px] leading-[1.85] text-gray-200 article-content"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
        )
        if (block.type === 'heading1') return (
          <h2 key={block.id} className="text-4xl font-extrabold text-white mt-4"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
        )
        if (block.type === 'heading2') return (
          <h3 key={block.id} className="text-3xl font-bold text-white mt-3"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
        )
        if (block.type === 'heading3') return (
          <h4 key={block.id} className="text-2xl font-semibold text-white mt-2"
            dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
        )
        if (block.type === 'quote') return (
          <blockquote key={block.id} className="pl-5 border-l-4 border-brand-500 italic">
            <div className="text-[17px] leading-[1.85] text-gray-300"
              dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
            {block.caption && <cite className="mt-2 block text-sm text-gray-500">{block.caption}</cite>}
          </blockquote>
        )
        if (block.type === 'callout') return (
          <div key={block.id} className={cn(
            'flex gap-3 p-4 rounded-xl border',
            block.calloutColor === 'yellow' ? 'bg-yellow-500/10 border-yellow-500/30' :
            block.calloutColor === 'green'  ? 'bg-green-500/10 border-green-500/30'  :
            block.calloutColor === 'red'    ? 'bg-red-500/10 border-red-500/30'      :
            block.calloutColor === 'purple' ? 'bg-purple-500/10 border-purple-500/30':
            'bg-blue-500/10 border-blue-500/30',
          )}>
            <span className="text-2xl shrink-0">{block.emoji ?? '💡'}</span>
            <div className="text-[16px] leading-relaxed text-gray-200"
              dangerouslySetInnerHTML={{ __html: block.content ?? '' }} />
          </div>
        )
        if (block.type === 'image') return (
          <figure key={block.id} className="my-2">
            {block.src && <img src={block.src} alt={block.caption ?? ''} className="w-full rounded-xl max-h-[520px] object-cover" />}
            {block.caption && <figcaption className="mt-2 text-sm text-center text-gray-500 italic">{block.caption}</figcaption>}
          </figure>
        )
        if (block.type === 'code')    return <CodeBlockPreview key={block.id} block={block} />
        if (block.type === 'divider') return (
          <div key={block.id} className="flex items-center justify-center gap-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          </div>
        )
        if (block.type === 'post-embed') return <PostEmbedBlock key={block.id} block={block} />
        return null
      })}
    </div>
  )
}
