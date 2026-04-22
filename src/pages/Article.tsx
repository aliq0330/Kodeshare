import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Send, Clock, CheckCheck, MoreHorizontal, Eye } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import ArticleEditor from '@modules/article/ArticleEditor'

function SaveStatus({ isDirty }: { isDirty: boolean }) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const t = setTimeout(() => setSaved(true), 800)
    return () => clearTimeout(t)
  }, [isDirty])

  useEffect(() => {
    if (saved) {
      const t = setTimeout(() => setSaved(false), 2500)
      return () => clearTimeout(t)
    }
  }, [saved])

  if (!isDirty && !saved) return null

  return (
    <span className={cn('flex items-center gap-1.5 text-xs transition-colors', saved ? 'text-green-400' : 'text-gray-500')}>
      {saved ? <CheckCheck className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5 animate-pulse" />}
      <span className="hidden sm:inline">{saved ? 'Kaydedildi' : 'Kaydediliyor...'}</span>
    </span>
  )
}

export default function ArticlePage() {
  const navigate = useNavigate()
  const { title, isDirty, reset, saveArticle } = useArticleStore()
  const [showPreview, setShowPreview] = useState(false)
  const [savedFlash, setSavedFlash] = useState(false)

  // Reset article store on unmount so a fresh article is created next visit
  useEffect(() => () => reset(), [reset])

  const handleSaveDraft = () => {
    saveArticle()
    setSavedFlash(true)
    setTimeout(() => setSavedFlash(false), 2000)
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* ── Fixed top header ── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-surface/95 backdrop-blur-md border-b border-surface-border">
        <div className="flex items-center justify-between h-full px-3 sm:px-5 max-w-[1200px] mx-auto gap-3">
          {/* Back */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline text-sm">Geri</span>
          </button>

          {/* Center: title + save status */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm text-gray-500 truncate max-w-[180px] sm:max-w-xs">
              {title || 'Başlıksız makale'}
            </span>
            <SaveStatus isDirty={isDirty} />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setShowPreview((v) => !v)}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-lg text-sm transition-colors',
                showPreview
                  ? 'bg-surface-raised text-white'
                  : 'text-gray-400 hover:text-white hover:bg-surface-raised',
              )}
              title="Önizleme"
            >
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">Önizle</span>
            </button>

            <button
              onClick={handleSaveDraft}
              className={cn(
                'flex items-center gap-1.5 px-3 h-8 rounded-lg border text-sm transition-colors',
                savedFlash
                  ? 'border-green-500/50 text-green-400 bg-green-500/10'
                  : 'border-surface-border text-gray-300 hover:text-white hover:bg-surface-raised',
              )}
            >
              {savedFlash ? <CheckCheck className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span className="hidden sm:inline">{savedFlash ? 'Kaydedildi!' : 'Taslak'}</span>
            </button>

            <button className="flex items-center gap-1.5 px-4 h-8 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
              <Send className="w-3.5 h-3.5" />
              <span>Yayınla</span>
            </button>

            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-white hover:bg-surface-raised transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Scrollable content ── */}
      <main className="flex-1 pt-14 overflow-y-auto">
        {showPreview ? (
          <ArticlePreview />
        ) : (
          <ArticleEditor />
        )}
      </main>
    </div>
  )
}

// ── Preview mode ──────────────────────────────────────────────────────────────
function ArticlePreview() {
  const { title, subtitle, coverImage, blocks } = useArticleStore()

  return (
    <div className="min-h-full bg-surface">
      {coverImage && (
        <img src={coverImage} alt="" className="w-full h-64 sm:h-96 object-cover" />
      )}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {title && (
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight text-white mb-4">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xl text-gray-400 font-light leading-relaxed mb-8">
            {subtitle}
          </p>
        )}
        <div className="w-16 h-px bg-surface-border mb-8" />

        <div className="flex flex-col gap-5">
          {blocks.map((block) => {
            if (block.type === 'paragraph') {
              return (
                <div
                  key={block.id}
                  className="text-[17px] leading-[1.85] text-gray-200 article-content"
                  dangerouslySetInnerHTML={{ __html: block.content ?? '' }}
                />
              )
            }
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
                block.calloutColor === 'green'  ? 'bg-green-500/10 border-green-500/30' :
                block.calloutColor === 'red'    ? 'bg-red-500/10 border-red-500/30' :
                block.calloutColor === 'purple' ? 'bg-purple-500/10 border-purple-500/30' :
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
            if (block.type === 'code') return (
              <div key={block.id} className="rounded-xl overflow-hidden border border-white/10 bg-[#282c34] my-2">
                <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
                  <span className="text-xs text-gray-400 font-mono">{block.language ?? 'code'}</span>
                  {block.filename && <span className="text-xs text-gray-500">{block.filename}</span>}
                </div>
                <pre className="p-4 overflow-x-auto text-[13.5px] font-mono leading-[1.65] text-gray-200">
                  <code>{block.code}</code>
                </pre>
              </div>
            )
            if (block.type === 'divider') return (
              <div key={block.id} className="flex items-center justify-center gap-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
              </div>
            )
            return null
          })}
        </div>
      </article>
    </div>
  )
}
