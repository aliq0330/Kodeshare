import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, MessageCircle, Share2, Bookmark, Play, Repeat2, FolderPlus, Check, Copy, FolderOpen, Repeat, MoreHorizontal, Trash2, BarChart2, Pencil, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import AddToCollectionModal from '@collections/AddToCollectionModal'
import ShareModal from '@modules/social/ShareModal'
import PostStatsModal from '@modules/post/PostStatsModal'
import EditPostModal from '@modules/post/EditPostModal'
import PostEditHistoryModal from '@modules/post/PostEditHistoryModal'
import CMHighlight from '@components/shared/CMHighlight'
import RepostMenu from '@modules/post/RepostMenu'
import QuoteComposer from '@modules/post/QuoteComposer'
import { postService } from '@services/postService'
import { compactNumber, timeAgo } from '@utils/formatters'
import { LANGUAGE_COLORS } from '@utils/constants'
import { useAuth } from '@/hooks/useAuth'
import { usePostStore } from '@store/postStore'
import type { PostPreview } from '@/types'

function buildProjectSrcdoc(files: { language: string; content: string }[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? ''
  const css  = files.filter((f) => f.language === 'css').map((f) => f.content).join('\n')
  const js   = files.filter((f) => f.language === 'javascript' || f.language === 'typescript').map((f) => f.content).join('\n')
  return `<!doctype html><html><head><meta charset="utf-8"/><style>${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

interface PostCardProps {
  post: PostPreview
  onLike?: (postId: string) => void
  onSave?: (postId: string) => void
}

export default function PostCard({ post, onLike, onSave }: PostCardProps) {
  const { isAuthenticated, user } = useAuth()
  const repostPost = usePostStore((s) => s.repostPost)
  const [collectModalOpen, setCollectModalOpen] = useState(false)
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [quoteOpen, setQuoteOpen] = useState(false)
  const [statsOpen, setStatsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [localPost, setLocalPost] = useState(post)
  const menuRef = useRef<HTMLDivElement>(null)

  const isOwner = !!user && user.id === post.author.id

  useEffect(() => {
    if (!menuOpen) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const handleDelete = async () => {
    setMenuOpen(false)
    if (!window.confirm('Bu gönderiyi silmek istediğine emin misin?')) return
    try {
      await postService.delete(post.id)
      toast.success('Gönderi silindi')
      setDeleted(true)
    } catch {
      toast.error('Gönderi silinemedi')
    }
  }

  const handleEditSaved = (updated: { title: string; description: string | null; tags: string[] }) => {
    setLocalPost((p) => ({ ...p, ...updated, isEdited: true }))
  }

  // For a plain repost, render the original post's content in the card body.
  const display: PostPreview = localPost.type === 'repost' && localPost.repostedFrom
    ? ({
        ...localPost.repostedFrom,
        filesCount: localPost.repostedFrom.files?.length ?? 0,
      } as unknown as PostPreview)
    : localPost

  const mainTag = display.tags[0]

  const isOwnerPost = localPost.type !== 'repost' || !localPost.repostedFrom

  const handleCopySnippet = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!display.snippetPreview) return
    try {
      await navigator.clipboard.writeText(display.snippetPreview)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard API yoksa sessiz geç */ }
  }

  const handleRepost = () => {
    if (!isAuthenticated) return
    const targetId = localPost.type === 'repost' && localPost.repostedFrom ? localPost.repostedFrom.id : localPost.id
    void repostPost(targetId)
  }

  const handleQuote = () => {
    if (!isAuthenticated) return
    setQuoteOpen(true)
  }

  // For the repost menu/counter we always target the original
  const repostTarget: PostPreview = localPost.type === 'repost' && localPost.repostedFrom
    ? {
        ...localPost.repostedFrom,
        filesCount: localPost.repostedFrom.files?.length ?? 0,
        isReposted: localPost.isReposted,
      } as PostPreview
    : localPost

  if (deleted) return null

  return (
    <article className="card p-4 hover:border-surface-raised transition-colors group">
      {/* Repost indicator — "KullanıcıAdı tarafından yeniden gönderildi" */}
      {localPost.type === 'repost' && localPost.repostedFrom && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
          <Repeat className="w-3.5 h-3.5" />
          <Link to={`/profile/${localPost.author.username}`} className="hover:text-gray-300">
            {localPost.author.displayName}
          </Link>
          tarafından yeniden gönderildi
        </div>
      )}

      {/* Author (original author for plain reposts, wrapper author otherwise) */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link to={`/profile/${display.author.username}`} className="flex items-center gap-2.5 min-w-0">
          <Avatar src={display.author.avatarUrl} alt={display.author.displayName} size="sm" online={display.author.isOnline} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{display.author.displayName}</p>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              @{display.author.username} · {timeAgo(display.createdAt)}
              {localPost.isEdited && (
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setHistoryOpen(true) }}
                  className="inline-flex items-center gap-0.5 text-gray-600 hover:text-gray-400 transition-colors"
                  title="Düzenleme geçmişini gör"
                >
                  <Clock className="w-3 h-3" />
                  düzenlendi
                </button>
              )}
            </p>
          </div>
        </Link>
        <div className="flex items-center gap-2 shrink-0">
          {mainTag && (
            <Badge variant="brand" className="shrink-0">#{mainTag}</Badge>
          )}
          {isAuthenticated && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
                title="Daha fazla"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setStatsOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <BarChart2 className="w-4 h-4 text-purple-400" />
                    <span className="text-white">İstatistikler</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setShareModalOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <Share2 className="w-4 h-4 text-sky-400" />
                    <span className="text-white">Paylaş</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setMenuOpen(false); setCollectModalOpen(true) }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                  >
                    <FolderPlus className="w-4 h-4 text-brand-400" />
                    <span className="text-white">Koleksiyona ekle</span>
                  </button>
                  {isOwner && isOwnerPost && (
                    <button
                      type="button"
                      onClick={() => { setMenuOpen(false); setEditOpen(true) }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-amber-400" />
                      <span className="text-white">Düzenle</span>
                    </button>
                  )}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                      <span className="text-white">Sil</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <Link to={`/post/${display.id}`} className="block mb-3">
        <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-2 mb-1">
          {display.title}
        </h3>
        {display.description && (
          <p className="text-sm text-gray-400 line-clamp-2">{display.description}</p>
        )}
      </Link>

      {/* Snippet code panel (snippet posts and gonderi/quote posts with code) */}
      {(display.type === 'snippet' || display.type === 'gonderi') && display.snippetPreview && (
        <div className="mb-3 rounded-xl border border-surface-border bg-[#0d1117] overflow-hidden">
          {/* Header bar */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-surface-card/60">
            <span
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: LANGUAGE_COLORS[display.snippetLanguage ?? ''] ?? '#8b9ab5' }}
            >
              {display.snippetLanguage ?? 'code'}
            </span>
            <button
              onClick={handleCopySnippet}
              className={`p-1.5 rounded-md transition-colors ${
                copied
                  ? 'text-emerald-400 bg-emerald-900/20'
                  : 'text-gray-400 hover:bg-surface-raised hover:text-white'
              }`}
              title={copied ? 'Kopyalandı!' : 'Kopyala'}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Code view — truncated with fade, click to open */}
          <Link to={`/post/${display.id}`} className="block relative select-none">
            <CMHighlight
              code={display.snippetPreview}
              lang={display.snippetLanguage ?? 'javascript'}
              className="max-h-[7.5rem] overflow-hidden"
            />
            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
          </Link>
        </div>
      )}

      {/* Project preview */}
      {display.type === 'project' && display.projectFiles && display.projectFiles.length > 0 && (
        <div className="mb-3 rounded-xl border border-surface-border overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-surface-border bg-surface-card/60">
            <FolderOpen className="w-4 h-4 text-brand-400 shrink-0" />
            <span className="text-sm font-medium text-white truncate">{display.title}</span>
          </div>
          <div className="h-36 bg-white">
            <iframe
              srcDoc={buildProjectSrcdoc(display.projectFiles)}
              sandbox="allow-scripts allow-same-origin"
              className="w-full h-full border-0"
              title="Proje önizleme"
            />
          </div>
        </div>
      )}

      {/* Preview image (hidden when a snippet code panel is shown) */}
      {!display.snippetPreview && display.type !== 'snippet' && display.previewImageUrl && (
        <Link to={`/post/${display.id}`} className="block mb-3 rounded-lg overflow-hidden border border-surface-border">
          <div className="relative bg-surface-raised aspect-video group/preview">
            <img src={display.previewImageUrl} alt={display.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
              <Play className="w-10 h-10 text-white" />
            </div>
          </div>
        </Link>
      )}

      {/* Quote post embed — original post shown inside quote */}
      {localPost.type === 'gonderi' && localPost.repostedFrom && (
        <div className="mb-3 rounded-xl border border-surface-border bg-surface-raised/30 p-3">
          <div className="flex items-center gap-2 mb-2">
            <Avatar
              src={localPost.repostedFrom.author.avatarUrl}
              alt={localPost.repostedFrom.author.displayName}
              size="xs"
            />
            <Link
              to={`/profile/${localPost.repostedFrom.author.username}`}
              className="text-xs text-gray-400 hover:text-gray-200"
            >
              <span className="font-medium text-gray-200">{localPost.repostedFrom.author.displayName}</span>
              <span className="ml-1">@{localPost.repostedFrom.author.username}</span>
            </Link>
          </div>
          <Link to={`/post/${localPost.repostedFrom.id}`} className="block">
            <p className="text-sm font-semibold text-white line-clamp-2">{localPost.repostedFrom.title}</p>
            {localPost.repostedFrom.description && (
              <p className="text-xs text-gray-400 line-clamp-2 mt-0.5">{localPost.repostedFrom.description}</p>
            )}
          </Link>

          {/* Original snippet code */}
          {localPost.repostedFrom.snippetPreview && (
            <div className="mt-2 rounded-lg border border-surface-border bg-[#0d1117] overflow-hidden">
              <div className="flex items-center px-2.5 py-1.5 border-b border-surface-border bg-surface-card/60">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: LANGUAGE_COLORS[localPost.repostedFrom.snippetLanguage ?? ''] ?? '#8b9ab5' }}
                >
                  {localPost.repostedFrom.snippetLanguage ?? 'code'}
                </span>
              </div>
              <Link to={`/post/${localPost.repostedFrom.id}`} className="block relative select-none">
                <CMHighlight
                  code={localPost.repostedFrom.snippetPreview}
                  lang={localPost.repostedFrom.snippetLanguage ?? 'javascript'}
                  className="max-h-24 overflow-hidden"
                />
                <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-[#0d1117] to-transparent pointer-events-none" />
              </Link>
            </div>
          )}

          {/* Original project preview */}
          {localPost.repostedFrom.type === 'project' && localPost.repostedFrom.projectFiles && localPost.repostedFrom.projectFiles.length > 0 && (
            <div className="mt-2 rounded-lg border border-surface-border overflow-hidden">
              <div className="flex items-center gap-2 px-2.5 py-1.5 border-b border-surface-border bg-surface-card/60">
                <FolderOpen className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span className="text-xs font-medium text-white truncate">{localPost.repostedFrom.title}</span>
              </div>
              <div className="h-28 bg-white">
                <iframe
                  srcDoc={buildProjectSrcdoc(localPost.repostedFrom.projectFiles)}
                  sandbox="allow-scripts allow-same-origin"
                  className="w-full h-full border-0"
                  title="Alıntı proje önizleme"
                />
              </div>
            </div>
          )}

          {/* Original preview image (only if no snippet/project) */}
          {!localPost.repostedFrom.snippetPreview && localPost.repostedFrom.type !== 'project' && localPost.repostedFrom.previewImageUrl && (
            <Link to={`/post/${localPost.repostedFrom.id}`} className="block mt-2 rounded-lg overflow-hidden border border-surface-border">
              <img src={localPost.repostedFrom.previewImageUrl} alt={localPost.repostedFrom.title} className="w-full aspect-video object-cover" />
            </Link>
          )}
        </div>
      )}

      {/* Language tags */}
      {display.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {display.tags.map((tag) => (
            <Link
              key={tag}
              to={`/explore?tag=${tag}`}
              onClick={(e) => e.stopPropagation()}
              className="tag"
              style={{ color: LANGUAGE_COLORS[tag] ?? undefined }}
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-3 border-t border-surface-border">
        <button
          onClick={() => onLike?.(display.id)}
          className={`flex items-center gap-1.5 text-sm transition-colors ${
            display.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
          }`}
        >
          <Heart className={`w-4 h-4 ${display.isLiked ? 'fill-current' : ''}`} />
          {compactNumber(display.likesCount)}
        </button>

        <Link
          to={`/post/${display.id}#comments`}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          {compactNumber(display.commentsCount)}
        </Link>

        {isAuthenticated ? (
          <RepostMenu
            post={repostTarget}
            onRepost={handleRepost}
            onQuote={handleQuote}
          />
        ) : (
          <span className="flex items-center gap-1.5 text-sm text-gray-500">
            <Repeat2 className="w-4 h-4" />
            {compactNumber(repostTarget.repostCount)}
          </span>
        )}

        <button
          onClick={() => onSave?.(display.id)}
          className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${
            display.isSaved ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${display.isSaved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {isAuthenticated && (
        <AddToCollectionModal
          postId={display.id}
          open={collectModalOpen}
          onClose={() => setCollectModalOpen(false)}
        />
      )}
      <ShareModal
        open={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        postId={display.id}
        postTitle={display.title}
      />
      <PostStatsModal
        open={statsOpen}
        onClose={() => setStatsOpen(false)}
        postId={display.id}
        likesCount={display.likesCount}
        repostCount={display.repostCount}
      />
      {isAuthenticated && (
        <QuoteComposer
          open={quoteOpen}
          onClose={() => setQuoteOpen(false)}
          post={repostTarget}
        />
      )}
      {isOwner && isOwnerPost && (
        <>
          <EditPostModal
            open={editOpen}
            onClose={() => setEditOpen(false)}
            post={localPost}
            onSaved={handleEditSaved}
          />
          <PostEditHistoryModal
            open={historyOpen}
            onClose={() => setHistoryOpen(false)}
            post={localPost}
          />
        </>
      )}
    </article>
  )
}
