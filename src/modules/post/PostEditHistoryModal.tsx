import { useState, useEffect } from 'react'
import { IconX, IconClock, IconChevronDown, IconChevronUp, IconCode, IconFolderOpen, IconFileText, IconPhoto, IconLink, IconVideo, IconCopy, IconCheck } from '@tabler/icons-react'
import Spinner from '@components/ui/Spinner'
import CMHighlight from '@components/shared/CMHighlight'
import { postService } from '@services/postService'
import { timeAgo } from '@utils/formatters'
import toast from 'react-hot-toast'
import type { Post, PostBlock } from '@/types'

interface PostEditHistoryModalProps {
  open: boolean
  onClose: () => void
  post: Post
}

interface EditRecord {
  id: string
  original_title: string
  original_description: string | null
  original_tags: string[]
  original_blocks: PostBlock[] | null
  edited_at: string
}

interface Version {
  label: string
  sublabel: string | null
  title: string
  description: string | null
  tags: string[]
  blocks: PostBlock[]
  isCurrent: boolean
}

function buildVersions(edits: EditRecord[], post: Post): Version[] {
  const versions: Version[] = edits.map((e, i) => ({
    label:       i === 0 ? 'Orijinal' : `${i}. Düzenleme`,
    sublabel:    timeAgo(e.edited_at),
    title:       e.original_title,
    description: e.original_description,
    tags:        e.original_tags ?? [],
    blocks:      e.original_blocks ?? [],
    isCurrent:   false,
  }))

  versions.push({
    label:       'Şu anki hal',
    sublabel:    null,
    title:       post.title,
    description: post.description,
    tags:        post.tags,
    blocks:      post.blocks,
    isCurrent:   true,
  })

  return versions.reverse()
}

function useCopy(): { copied: boolean; copy: (text: string) => void } {
  const [copied, setCopied] = useState(false)
  const copy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }
  return { copied, copy }
}

function CopyBtn({ text, className = '' }: { text: string; className?: string }) {
  const { copied, copy } = useCopy()
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); copy(text) }}
      title="Kopyala"
      className={`p-1 rounded transition-colors ${copied ? 'text-green-400' : 'text-gray-500 hover:text-gray-300'} ${className}`}
    >
      {copied ? <IconCheck className="w-3 h-3" /> : <IconCopy className="w-3 h-3" />}
    </button>
  )
}

function FileBadge({ file }: { file: { name: string; language: string; content?: string } }) {
  const { copied, copy } = useCopy()
  const handleCopy = () => {
    if (!file.content) return
    copy(file.content)
    toast.success(`${file.name} dosyasının içeriği kopyalandı`)
  }
  return (
    <span className="group/badge relative inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded bg-surface-raised font-mono text-gray-300">
      {file.name}
      {file.content && (
        <button
          type="button"
          onClick={handleCopy}
          title={`${file.name} kopyala`}
          className="opacity-0 group-hover/badge:opacity-100 transition-opacity"
        >
          {copied ? <IconCheck className="w-2.5 h-2.5 text-green-400" /> : <IconCopy className="w-2.5 h-2.5 text-gray-500 hover:text-gray-300" />}
        </button>
      )}
    </span>
  )
}

function BlockPreview({ block }: { block: PostBlock }) {
  const [open, setOpen] = useState(false)

  if (block.type === 'snippet') {
    const lang    = (block.data.language as string) ?? 'javascript'
    const content = (block.data.content as string) ?? ''
    return (
      <div className="rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden group">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-surface-card/60 hover:bg-surface-raised/40 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <IconCode className="w-3 h-3" />
            {lang}
            {block.data.name ? ` · ${block.data.name}` : ''}
          </span>
          <span className="flex items-center gap-1">
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              <CopyBtn text={content} />
            </span>
            {open ? <IconChevronUp className="w-3 h-3 text-gray-500" /> : <IconChevronDown className="w-3 h-3 text-gray-500" />}
          </span>
        </button>
        {open ? (
          <CMHighlight code={content.slice(0, 2000)} lang={lang} className="max-h-64 overflow-hidden" />
        ) : (
          <div className="pointer-events-none">
            <CMHighlight code={content.slice(0, 120)} lang={lang} className="max-h-12 overflow-hidden" />
          </div>
        )}
      </div>
    )
  }

  if (block.type === 'project') {
    const files = (block.data.files as Array<{ name: string; language: string; content?: string }>) ?? []
    const copyText = files.map((f) => f.content ? `// ${f.name}\n${f.content}` : f.name).join('\n\n')
    return (
      <div className="group rounded-lg border border-surface-border bg-surface-card/60 px-3 py-2 flex items-center gap-2 flex-wrap relative">
        <IconFolderOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
        {files.length === 0 ? (
          <span className="text-xs text-gray-500">Boş proje</span>
        ) : (
          files.map((f, i) => (
            <FileBadge key={i} file={f} />
          ))
        )}
        {files.length > 0 && (
          <span className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
            <CopyBtn text={copyText} />
          </span>
        )}
      </div>
    )
  }

  if (block.type === 'article') {
    const content = (block.data.content as string) ?? ''
    return (
      <div className="group rounded-lg border border-surface-border bg-surface-card/60 overflow-hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="w-full flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-surface-card/60 hover:bg-surface-raised/40 transition-colors"
        >
          <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500">
            <IconFileText className="w-3 h-3" />
            Makale
          </span>
          <span className="flex items-center gap-1">
            {content && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <CopyBtn text={content} />
              </span>
            )}
            {open ? <IconChevronUp className="w-3 h-3 text-gray-500" /> : <IconChevronDown className="w-3 h-3 text-gray-500" />}
          </span>
        </button>
        <p className={`px-3 py-2 text-xs text-gray-300 whitespace-pre-wrap ${open ? '' : 'line-clamp-2'}`}>
          {content || <span className="text-gray-600 italic">Boş</span>}
        </p>
      </div>
    )
  }

  if (block.type === 'image') {
    const url = (block.data.url as string) ?? ''
    return (
      <div className="group rounded-lg border border-surface-border bg-surface-card/60 px-3 py-2 flex items-center gap-2">
        <IconPhoto className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="text-xs text-gray-400 truncate flex-1">{url || <span className="italic text-gray-600">URL yok</span>}</span>
        {url && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <CopyBtn text={url} />
          </span>
        )}
      </div>
    )
  }

  if (block.type === 'link') {
    const url   = (block.data.url as string) ?? ''
    const title = (block.data.title as string) ?? ''
    return (
      <div className="group rounded-lg border border-surface-border bg-surface-card/60 px-3 py-2 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <IconLink className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          <span className="text-xs text-gray-400 truncate flex-1">{url || <span className="italic text-gray-600">URL yok</span>}</span>
          {url && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <CopyBtn text={url} />
            </span>
          )}
        </div>
        {title && <p className="text-[11px] text-gray-500 pl-5">{title}</p>}
      </div>
    )
  }

  if (block.type === 'video') {
    const url = (block.data.url as string) ?? ''
    return (
      <div className="group rounded-lg border border-surface-border bg-surface-card/60 px-3 py-2 flex items-center gap-2">
        <IconVideo className="w-3.5 h-3.5 text-gray-500 shrink-0" />
        <span className="text-xs text-gray-400 truncate flex-1">{url || <span className="italic text-gray-600">URL yok</span>}</span>
        {url && (
          <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <CopyBtn text={url} />
          </span>
        )}
      </div>
    )
  }

  return null
}

function VersionCard({ version, index, total }: { version: Version; index: number; total: number }) {
  return (
    <div className={`relative pl-7 ${index < total - 1 ? 'pb-5' : ''}`}>
      {index < total - 1 && (
        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-surface-border" />
      )}
      <div className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
        ${version.isCurrent ? 'border-brand-400 bg-brand-900/30' : 'border-surface-raised bg-surface-card'}`}
      >
        {version.isCurrent && <div className="w-2 h-2 rounded-full bg-brand-400" />}
      </div>

      <div className={`card-raised p-4 ${version.isCurrent ? 'border-brand-700/40' : ''}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${version.isCurrent ? 'text-brand-400' : 'text-gray-400'}`}>
            {version.label}
          </span>
          {version.sublabel && (
            <span className="flex items-center gap-1 text-[11px] text-gray-600">
              <IconClock className="w-3 h-3" />
              {version.sublabel}
            </span>
          )}
        </div>

        {version.isCurrent ? (
          <p className="text-xs text-gray-500 italic">Gönderi şu anki halinde görüntüleniyor.</p>
        ) : (
          <>
            <div className="group flex items-start gap-1 mb-1">
              <p className="text-sm font-semibold text-white flex-1">{version.title}</p>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5">
                <CopyBtn text={version.title} />
              </span>
            </div>

            {version.description && (
              <div className="group flex items-start gap-1 mb-2">
                <p className="text-xs text-gray-400 line-clamp-2 flex-1">{version.description}</p>
                <span className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <CopyBtn text={version.description} />
                </span>
              </div>
            )}

            {version.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {version.tags.map((t) => (
                  <span key={t} className="tag text-[11px]">#{t}</span>
                ))}
              </div>
            )}

            {version.blocks.length > 0 && (
              <div className="flex flex-col gap-2">
                {version.blocks.map((block, i) => (
                  <BlockPreview key={block.id ?? i} block={block} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function PostEditHistoryModal({ open, onClose, post }: PostEditHistoryModalProps) {
  const [edits, setEdits]     = useState<EditRecord[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    postService.getPostEdits(post.id)
      .then(setEdits)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, post.id])

  if (!open) return null

  const versions = buildVersions(edits, post)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl card shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[85vh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2">
            <IconClock className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-white">Düzenleme Geçmişi</h2>
            {!loading && edits.length > 0 && (
              <span className="text-xs text-gray-500 bg-surface-raised px-2 py-0.5 rounded-full">
                {edits.length} düzenleme
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : edits.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Düzenleme geçmişi bulunamadı</p>
          ) : (
            versions.map((v, i) => (
              <VersionCard key={i} version={v} index={i} total={versions.length} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
