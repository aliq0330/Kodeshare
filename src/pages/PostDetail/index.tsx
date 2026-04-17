import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Bookmark, Share2, GitFork, Copy, Check } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import CodePreview from '@components/shared/CodePreview'
import SyntaxHighlight from '@components/shared/SyntaxHighlight'
import CommentThread from '@modules/social/CommentThread'
import { timeAgo, compactNumber } from '@utils/formatters'
import { LANGUAGE_COLORS } from '@utils/constants'
import { postService } from '@services/postService'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import type { Post } from '@/types'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()
  const { isAuthenticated } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [snippetView, setSnippetView] = useState<'code' | 'preview'>('code')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!postId) return
    setLoading(true)
    postService.getPost(postId)
      .then(setPost)
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false))
  }, [postId])

  const handleLike = async () => {
    if (!post || !isAuthenticated) return
    const wasLiked = post.isLiked
    setPost((p) => p ? { ...p, isLiked: !p.isLiked, likesCount: Math.max(0, p.likesCount + (p.isLiked ? -1 : 1)) } : p)
    try {
      await (wasLiked ? postService.unlike(post.id) : postService.like(post.id))
    } catch {
      setPost((p) => p ? { ...p, isLiked: wasLiked, likesCount: Math.max(0, p.likesCount + (wasLiked ? 1 : -1)) } : p)
    }
  }

  const handleSave = async () => {
    if (!post || !isAuthenticated) return
    const wasSaved = post.isSaved
    setPost((p) => p ? { ...p, isSaved: !p.isSaved } : p)
    try {
      await (wasSaved ? postService.unsave(post.id) : postService.save(post.id))
    } catch {
      setPost((p) => p ? { ...p, isSaved: wasSaved } : p)
    }
  }

  const handleFork = async () => {
    if (!post || !isAuthenticated) { toast.error('Önce giriş yapmalısın'); return }
    try {
      await postService.repost(post.id)
      toast.success('Gönderi paylaşıldı!')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const handleCopy = async () => {
    if (!post?.files[0]?.content) return
    try {
      await navigator.clipboard.writeText(post.files[0].content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard API yoksa sessiz geç */ }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20 text-gray-500">
        <p className="text-lg mb-2">Gönderi bulunamadı</p>
        <Link to="/" className="text-brand-400 hover:underline text-sm">Ana sayfaya dön</Link>
      </div>
    )
  }

  const snippetFile = post.type === 'snippet' ? post.files[0] : null

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-2">{post.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={handleFork}>
            <GitFork className="w-4 h-4" />
            Fork
          </Button>
        </div>

        {post.description && <p className="text-sm text-gray-400 mb-4">{post.description}</p>}

        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-2.5 mb-5">
          <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" online={post.author.isOnline} />
          <div>
            <p className="text-sm font-medium text-white">{post.author.displayName}</p>
            <p className="text-xs text-gray-500">@{post.author.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {/* Snippet: Kod / Önizle panel */}
        {snippetFile && (
          <div className="rounded-xl border border-surface-border bg-[#0d1117] overflow-hidden mb-5">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-surface-card/60">
              <span
                className="text-[11px] font-bold uppercase tracking-widest"
                style={{ color: LANGUAGE_COLORS[snippetFile.language] ?? '#8b9ab5' }}
              >
                {snippetFile.language}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCopy}
                  className={`p-1.5 rounded-md transition-colors ${
                    copied
                      ? 'text-emerald-400 bg-emerald-900/20'
                      : 'text-gray-400 hover:bg-surface-raised hover:text-white'
                  }`}
                  title={copied ? 'Kopyalandı!' : 'Kopyala'}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setSnippetView('code')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    snippetView === 'code'
                      ? 'bg-surface-raised text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Kod
                </button>
                <button
                  onClick={() => setSnippetView('preview')}
                  className={`px-2 py-1 text-xs rounded-md transition-colors ${
                    snippetView === 'preview'
                      ? 'bg-surface-raised text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Önizle
                </button>
              </div>
            </div>

            {/* Code view: syntax highlighted, no line numbers, scrollable */}
            {snippetView === 'code' && (
              <pre className="px-4 py-3 text-[13px] leading-[1.65] font-mono overflow-auto max-h-[60vh] whitespace-pre">
                <SyntaxHighlight code={snippetFile.content} lang={snippetFile.language} />
              </pre>
            )}

            {/* Preview view: iframe */}
            {snippetView === 'preview' && (
              <CodePreview files={post.files} className="h-72" />
            )}
          </div>
        )}

        {/* Non-snippet file preview */}
        {!snippetFile && post.files.length > 0 && (
          <CodePreview files={post.files} className="h-72 mb-5" />
        )}

        <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors ${
              post.isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <Heart className={`w-4 h-4 ${post.isLiked ? 'fill-current' : ''}`} />
            {compactNumber(post.likesCount)}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors">
            <Share2 className="w-4 h-4" />
            {compactNumber(post.sharesCount)}
          </button>
          <button
            onClick={handleSave}
            className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${
              post.isSaved ? 'text-brand-400' : 'text-gray-500 hover:text-brand-400'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${post.isSaved ? 'fill-current' : ''}`} />
            {post.isSaved ? 'Kaydedildi' : 'Kaydet'}
          </button>
        </div>
      </div>

      <div id="comments">
        <h2 className="text-base font-semibold text-white mb-4">Yorumlar ({post.commentsCount})</h2>
        <CommentThread
          postId={post.id}
          onCommentAdded={() => setPost((p) => p ? { ...p, commentsCount: p.commentsCount + 1 } : p)}
        />
      </div>
    </div>
  )
}
