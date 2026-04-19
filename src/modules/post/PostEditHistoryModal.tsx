import { useState, useEffect } from 'react'
import { X, Clock, ChevronDown, ChevronUp } from 'lucide-react'
import Spinner from '@components/ui/Spinner'
import CMHighlight from '@components/shared/CMHighlight'
import { postService } from '@services/postService'
import { timeAgo } from '@utils/formatters'
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

function VersionCard({ version, index, total }: { version: Version; index: number; total: number }) {
  const [codeOpen, setCodeOpen] = useState(false)
  const firstSnippet = version.blocks.find((b) => b.type === 'snippet')
  const snippetCount = version.blocks.filter((b) => b.type === 'snippet').length

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

        {firstSnippet && (
          <div className="mt-2 rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden">
            <button
              type="button"
              onClick={() => setCodeOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-1.5 border-b border-surface-border bg-surface-card/60 hover:bg-surface-raised/40 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                {(firstSnippet.data.language as string) ?? 'code'}
                {snippetCount > 1 ? ` · ${snippetCount} snippet` : ''}
              </span>
              {codeOpen ? <ChevronUp className="w-3 h-3 text-gray-500" /> : <ChevronDown className="w-3 h-3 text-gray-500" />}
            </button>

            {codeOpen ? (
              version.blocks
                .filter((b) => b.type === 'snippet')
                .map((b, i) => (
                  <div key={i}>
                    {snippetCount > 1 && (
                      <p className="px-3 py-1 text-[10px] text-gray-600 border-b border-surface-border/50">
                        {(b.data.name as string) ?? `snippet ${i + 1}`}
                      </p>
                    )}
                    <CMHighlight
                      code={((b.data.content as string) ?? '').slice(0, 1500)}
                      lang={(b.data.language as string) ?? 'javascript'}
                      className="max-h-56 overflow-hidden"
                    />
                  </div>
                ))
            ) : (
              <div className="pointer-events-none">
                <CMHighlight
                  code={((firstSnippet.data.content as string) ?? '').slice(0, 150)}
                  lang={(firstSnippet.data.language as string) ?? 'javascript'}
                  className="max-h-14 overflow-hidden"
                />
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
