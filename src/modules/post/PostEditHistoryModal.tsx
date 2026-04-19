import { useState, useEffect } from 'react'
import { X, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import Spinner from '@components/ui/Spinner'
import CMHighlight from '@components/shared/CMHighlight'
import { postService } from '@services/postService'
import { timeAgo } from '@utils/formatters'
import type { Post, PostPreview } from '@/types'

interface PostEditHistoryModalProps {
  open: boolean
  onClose: () => void
  post: Post | PostPreview
}

interface EditRecord {
  id: string
  original_title: string
  original_description: string | null
  original_tags: string[]
  original_files: Array<{ name: string; language: string; content: string; order: number }> | null
  edited_at: string
}

interface Version {
  label: string
  sublabel: string | null
  title: string
  description: string | null
  tags: string[]
  files: Array<{ name: string; language: string; content: string }> | null
  isCurrent: boolean
  codeExpected: boolean
}

function buildVersions(edits: EditRecord[], post: Post | PostPreview): Version[] {
  const hasCode = post.type === 'snippet' || post.type === 'project'

  // Each post_edits record = state BEFORE that edit (ordered ascending)
  // edits[0] = original, edits[i>0] = state after i-th edit, current = latest
  const versions: Version[] = edits.map((e, i) => ({
    label:        i === 0 ? 'Orijinal' : `${i}. Düzenleme`,
    sublabel:     timeAgo(e.edited_at),
    title:        e.original_title,
    description:  e.original_description,
    tags:         e.original_tags ?? [],
    files:        hasCode && e.original_files?.length ? e.original_files : null,
    isCurrent:    false,
    codeExpected: hasCode,
  }))

  const fullPost = post as Post
  const currentFiles: Version['files'] =
    hasCode && fullPost.files?.length
      ? fullPost.files.map((f) => ({ name: f.name, language: f.language, content: f.content }))
      : hasCode && (post as PostPreview).snippetPreview
        ? [{ name: 'snippet', language: (post as PostPreview).snippetLanguage ?? 'javascript', content: (post as PostPreview).snippetPreview! }]
        : null

  versions.push({
    label:        'Şu anki hal',
    sublabel:     null,
    title:        post.title,
    description:  post.description,
    tags:         post.tags,
    files:        currentFiles,
    isCurrent:    true,
    codeExpected: hasCode,
  })

  return versions.reverse() // newest first
}

function VersionCard({ version, index, total }: { version: Version; index: number; total: number }) {
  const [codeOpen, setCodeOpen] = useState(false)
  const firstFile = version.files?.[0]

  return (
    <div className={`relative pl-7 ${index < total - 1 ? 'pb-5' : ''}`}>
      {/* Timeline line */}
      {index < total - 1 && (
        <div className="absolute left-[9px] top-5 bottom-0 w-px bg-surface-border" />
      )}
      {/* Dot */}
      <div className={`absolute left-0 top-1.5 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center
        ${version.isCurrent ? 'border-brand-400 bg-brand-900/30' : 'border-surface-raised bg-surface-card'}`}
      >
        {version.isCurrent && <div className="w-2 h-2 rounded-full bg-brand-400" />}
      </div>

      {/* Card */}
      <div className={`card-raised p-4 ${version.isCurrent ? 'border-brand-700/40' : ''}`}>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${version.isCurrent ? 'text-brand-400' : 'text-gray-400'}`}>
            {version.label}
          </span>
          {version.sublabel && (
            <span className="flex items-center gap-1 text-[11px] text-gray-600">
              <Clock className="w-3 h-3" />
              {version.sublabel}
            </span>
          )}
        </div>

        <p className="text-sm font-semibold text-white mb-1">{version.title}</p>

        {version.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-2">{version.description}</p>
        )}

        {version.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {version.tags.map((t) => (
              <span key={t} className="tag text-[11px]">#{t}</span>
            ))}
          </div>
        )}

        {/* No file content note for old records without original_files */}
        {version.codeExpected && !version.files && !version.isCurrent && (
          <p className="text-[11px] text-gray-600 italic mt-1">Kod içeriği bu sürüm için mevcut değil</p>
        )}

        {/* Code preview */}
        {firstFile && (
          <div className="mt-2 rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden">
            <button
              type="button"
              onClick={() => setCodeOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-surface-card/60 hover:bg-surface-raised/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {firstFile.language}{version.files!.length > 1 ? ` · ${version.files!.length} dosya` : ''}
              </span>
              {codeOpen ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </button>

            {codeOpen ? (
              version.files!.map((f, fi) => (
                <div key={fi}>
                  {version.files!.length > 1 && (
                    <p className="px-3 py-1 text-[10px] text-gray-600 border-b border-surface-border/50">{f.name}</p>
                  )}
                  <CMHighlight code={f.content.slice(0, 1500)} lang={f.language} className="max-h-56 overflow-hidden" />
                </div>
              ))
            ) : (
              <div className="pointer-events-none">
                <CMHighlight code={firstFile.content.slice(0, 150)} lang={firstFile.language} className="max-h-14 overflow-hidden" />
              </div>
            )}
          </div>
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border shrink-0">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-white">Düzenleme Geçmişi</h2>
            {!loading && edits.length > 0 && (
              <span className="text-xs text-gray-500 bg-surface-raised px-2 py-0.5 rounded-full">
                {edits.length} düzenleme
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
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
