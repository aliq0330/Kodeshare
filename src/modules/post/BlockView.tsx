import { useState } from 'react'
import { Copy, Check, FolderOpen, FileCode, FileText, ExternalLink, Play } from 'lucide-react'
import CMHighlight from '@components/shared/CMHighlight'
import { LANGUAGE_COLORS } from '@utils/constants'
import { useIsLightMode } from '@hooks/useIsLightMode'
import type { PostBlock } from '@/types'

function buildProjectSrcdoc(files: { language: string; content: string }[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? ''
  const css  = files.filter((f) => f.language === 'css').map((f) => f.content).join('\n')
  const js   = files.filter((f) => f.language === 'javascript' || f.language === 'typescript').map((f) => f.content).join('\n')
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m?.[1] ?? null
}

interface SnippetBlockViewProps {
  block: PostBlock
  compact?: boolean
}

function SnippetBlockView({ block, compact }: SnippetBlockViewProps) {
  const [copied, setCopied] = useState(false)
  const isLight = useIsLightMode()
  const language = (block.data.language as string) ?? 'javascript'
  const content  = (block.data.content  as string) ?? ''

  const containerBg     = isLight ? '#ffffff' : '#0d1117'
  const containerBorder = isLight ? '#d0d7de' : '#30363d'
  const headerBg        = isLight ? '#f6f8fa' : '#161b22'
  const headerBorder    = isLight ? '#d0d7de' : '#21262d'
  const gradientFrom    = isLight ? 'from-white' : 'from-[#0d1117]'

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* noop */ }
  }

  const copyBtn = copied
    ? (isLight ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-400 bg-emerald-900/20')
    : (isLight ? 'text-gray-500 hover:bg-black/5 hover:text-gray-800' : 'text-gray-400 hover:bg-white/10 hover:text-white')

  if (compact) {
    return (
      <div className="rounded-xl border overflow-hidden mb-3" style={{ background: containerBg, borderColor: containerBorder }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: headerBg, borderColor: headerBorder }}>
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: LANGUAGE_COLORS[language] ?? '#8b9ab5' }}>
            {language}
          </span>
          <button onClick={handleCopy} className={`p-1.5 rounded-md transition-colors ${copyBtn}`} title={copied ? 'Kopyalandı!' : 'Kopyala'}>
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
        <div className="relative select-none">
          <CMHighlight code={content} lang={language} className="max-h-[7.5rem] overflow-hidden" />
          <div className={`absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t ${gradientFrom} to-transparent pointer-events-none`} />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border overflow-hidden mb-5" style={{ background: containerBg, borderColor: containerBorder }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ background: headerBg, borderColor: headerBorder }}>
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: LANGUAGE_COLORS[language] ?? '#8b9ab5' }}>
          {(block.data.name as string) ?? language}
        </span>
        <button onClick={handleCopy} className={`p-1.5 rounded-md transition-colors ${copyBtn}`} title={copied ? 'Kopyalandı!' : 'Kopyala'}>
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <CMHighlight code={content} lang={language} scroll className="max-h-[60vh]" />
    </div>
  )
}

interface ProjectBlockViewProps {
  block: PostBlock
  compact?: boolean
  title?: string
  onFork?: () => void
}

function ProjectBlockView({ block, compact, title, onFork }: ProjectBlockViewProps) {
  const files = (block.data.files as Array<{ name: string; language: string; content: string }>) ?? []

  if (compact) {
    return (
      <div className="rounded-xl border border-surface-border overflow-hidden mb-3">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-card/60">
          <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
          <span className="text-sm font-medium text-white truncate">{title ?? 'Proje'}</span>
        </div>
        <div className="h-36 bg-white">
          <iframe srcDoc={buildProjectSrcdoc(files)} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0" title="Proje önizleme" />
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-surface-border overflow-hidden mb-5">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-surface-border bg-surface-card/60">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-5 h-5 text-brand-400 shrink-0" />
          <span className="font-medium text-white">{title ?? 'Proje'}</span>
        </div>
        {onFork && (
          <button onClick={onFork} className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 transition-colors">
            <FileCode className="w-3.5 h-3.5" />
            Editörde Aç
          </button>
        )}
      </div>
      <div className="border-b border-surface-border">
        {files.map((f, i) => (
          <div key={i} className="flex items-center gap-2.5 px-3 py-2 border-b border-surface-border/40 last:border-0">
            <span className="text-[10px] font-bold font-mono w-8 shrink-0" style={{ color: LANGUAGE_COLORS[f.language] ?? '#8b9ab5' }}>
              {f.name.split('.').pop()?.toUpperCase()}
            </span>
            <FileCode className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            <span className="text-sm text-gray-300 font-mono">{f.name}</span>
          </div>
        ))}
      </div>
      <div className="h-72 bg-white">
        <iframe srcDoc={buildProjectSrcdoc(files)} sandbox="allow-scripts allow-same-origin" className="w-full h-full border-0" title="Proje önizleme" />
      </div>
    </div>
  )
}

function ImageBlockView({ block, compact }: { block: PostBlock; compact?: boolean }) {
  const url = (block.data.url as string) ?? ''
  const alt = (block.data.alt as string) ?? ''
  if (!url) return null
  return (
    <div className={`rounded-xl overflow-hidden border border-surface-border mb-${compact ? '3' : '5'}`}>
      <img src={url} alt={alt} className={`w-full object-cover ${compact ? 'max-h-48' : ''}`} />
    </div>
  )
}

function LinkBlockView({ block }: { block: PostBlock }) {
  const url   = (block.data.url   as string) ?? ''
  const title = (block.data.title as string) ?? url
  if (!url) return null
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="flex items-center gap-2.5 p-3 mb-3 rounded-xl border border-surface-border bg-surface-raised/30 hover:border-brand-700/50 transition-colors group"
    >
      <ExternalLink className="w-4 h-4 text-brand-400 shrink-0" />
      <span className="text-sm text-brand-300 group-hover:underline truncate">{title}</span>
    </a>
  )
}

function VideoBlockView({ block, compact }: { block: PostBlock; compact?: boolean }) {
  const url = (block.data.url as string) ?? ''
  if (!url) return null
  const ytId = getYouTubeId(url)

  if (compact) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-2.5 p-3 mb-3 rounded-xl border border-surface-border bg-surface-raised/30 hover:border-brand-700/50 transition-colors group"
      >
        <Play className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-sm text-gray-300 group-hover:text-white truncate">{url}</span>
      </a>
    )
  }

  if (ytId) {
    return (
      <div className="rounded-xl overflow-hidden border border-surface-border mb-5 aspect-video">
        <iframe
          src={`https://www.youtube.com/embed/${ytId}`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
          title="Video"
        />
      </div>
    )
  }

  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 p-3 mb-5 rounded-xl border border-surface-border bg-surface-raised/30 hover:border-brand-700/50 transition-colors">
      <Play className="w-4 h-4 text-red-400 shrink-0" />
      <span className="text-sm text-brand-300 hover:underline truncate">{url}</span>
    </a>
  )
}

function ArticleBlockView({ block, compact }: { block: PostBlock; compact?: boolean }) {
  const articleId  = (block.data.articleId  as string) ?? ''
  const title      = (block.data.title      as string) ?? ''
  const content    = (block.data.content    as string) ?? ''
  const coverImage = (block.data.coverImage as string) ?? ''

  if (!title && !content) return null

  const articleUrl = articleId ? `${import.meta.env.BASE_URL}makale/${articleId}` : null

  const inner = (
    <div className={`rounded-xl border border-surface-border overflow-hidden mb-${compact ? '3' : '5'} bg-surface-card/40 hover:border-brand-700/50 transition-colors`}>
      {/* Kapak görseli */}
      {coverImage && (
        <img
          src={coverImage}
          alt=""
          className={`w-full object-cover ${compact ? 'h-28' : 'h-40'}`}
        />
      )}

      <div className="p-3 flex flex-col gap-1.5">
        {/* Üst: ikon + etiket */}
        <div className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5 text-brand-400 shrink-0" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-brand-400">Makale</span>
        </div>

        {/* Başlık — tek satır */}
        {title && (
          <p className="text-sm font-semibold text-white leading-snug line-clamp-1">
            {title}
          </p>
        )}

        {/* İçerik özeti */}
        {content && (
          <p className={`text-xs text-gray-400 leading-relaxed ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>
            {content}
          </p>
        )}

        {/* Devamını oku */}
        {articleUrl && (
          <span className="text-xs text-brand-400 font-medium mt-0.5">
            Devamını oku →
          </span>
        )}
      </div>
    </div>
  )

  if (articleUrl) {
    return (
      <a href={articleUrl} onClick={(e) => e.stopPropagation()} className="block no-underline">
        {inner}
      </a>
    )
  }
  return inner
}

interface BlockViewProps {
  blocks: PostBlock[]
  compact?: boolean
  postTitle?: string
  onForkProject?: (files: Array<{ name: string; language: string; content: string }>) => void
}

export default function BlockView({ blocks, compact, postTitle, onForkProject }: BlockViewProps) {
  if (!blocks.length) return null

  return (
    <>
      {blocks.map((block) => {
        switch (block.type) {
          case 'snippet':
            return <SnippetBlockView key={block.id} block={block} compact={compact} />
          case 'project':
            return (
              <ProjectBlockView
                key={block.id}
                block={block}
                compact={compact}
                title={postTitle}
                onFork={onForkProject
                  ? () => onForkProject((block.data.files as Array<{ name: string; language: string; content: string }>) ?? [])
                  : undefined
                }
              />
            )
          case 'image':
            return <ImageBlockView key={block.id} block={block} compact={compact} />
          case 'link':
            return <LinkBlockView key={block.id} block={block} />
          case 'video':
            return <VideoBlockView key={block.id} block={block} compact={compact} />
          case 'article':
            return <ArticleBlockView key={block.id} block={block} compact={compact} />
          default:
            return null
        }
      })}
    </>
  )
}
