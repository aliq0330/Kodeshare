import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Bookmark, Share2, GitFork } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import CodePreview from '@components/shared/CodePreview'
import CommentThread from '@modules/social/CommentThread'
import { timeAgo } from '@utils/formatters'

export default function PostDetailPage() {
  const { postId } = useParams<{ postId: string }>()

  // Placeholder — swap with usePostStore hook
  const post = {
    id: postId!,
    title: 'Glassmorphism Card Component',
    description: 'Modern bir glassmorphism kartı, CSS backdrop-filter ve gradient kullanılarak yapıldı.',
    tags: ['css', 'ui', 'animation'],
    files: [
      { id: 'f1', name: 'index.html', language: 'html' as const, content: '<div class="card"><h1>Hello World</h1></div>', order: 0 },
      { id: 'f2', name: 'style.css',  language: 'css' as const,  content: '.card { backdrop-filter: blur(10px); background: rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; }', order: 1 },
    ],
    author: { id: '1', username: 'ayse_dev', displayName: 'Ayşe Kaya', avatarUrl: null as null, isVerified: false, isOnline: true },
    likesCount: 284,
    commentsCount: 12,
    sharesCount: 34,
    savesCount: 67,
    isLiked: false,
    isSaved: false,
    createdAt: new Date(Date.now() - 3600_000 * 5).toISOString(),
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      {/* Back */}
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-2">{post.title}</h1>
            <div className="flex flex-wrap gap-1.5">
              {post.tags.map((tag) => <span key={tag} className="tag">#{tag}</span>)}
            </div>
          </div>
          <Button variant="primary" size="sm">
            <GitFork className="w-4 h-4" />
            Fork
          </Button>
        </div>

        {post.description && <p className="text-sm text-gray-400 mb-4">{post.description}</p>}

        {/* Author */}
        <Link to={`/profile/${post.author.username}`} className="flex items-center gap-2.5 mb-5">
          <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" online={post.author.isOnline} />
          <div>
            <p className="text-sm font-medium text-white">{post.author.displayName}</p>
            <p className="text-xs text-gray-500">@{post.author.username} · {timeAgo(post.createdAt)}</p>
          </div>
        </Link>

        {/* Preview */}
        <CodePreview files={post.files} className="h-72 mb-5" />

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4 border-t border-surface-border">
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-400 transition-colors">
            <Heart className="w-4 h-4" />
            {post.likesCount}
          </button>
          <button className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-400 transition-colors">
            <Share2 className="w-4 h-4" />
            {post.sharesCount}
          </button>
          <button className="ml-auto flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-400 transition-colors">
            <Bookmark className="w-4 h-4" />
            Kaydet
          </button>
        </div>
      </div>

      {/* Comments */}
      <div id="comments">
        <h2 className="text-base font-semibold text-white mb-4">Yorumlar ({post.commentsCount})</h2>
        <CommentThread postId={post.id} />
      </div>
    </div>
  )
}
