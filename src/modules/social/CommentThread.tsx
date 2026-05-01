import { useEffect, useState } from 'react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import CommentItem from './CommentItem'
import CommentComposeModal from './CommentComposeModal'
import type { ComposeContext } from './CommentComposeModal'
import { useAuthStore } from '@store/authStore'
import { useCommentStore } from '@store/commentStore'
import toast from 'react-hot-toast'

interface CommentThreadProps {
  postId?: string
  articleId?: string
  onCommentAdded?: () => void
  context?: ComposeContext
}

export default function CommentThread({ postId, articleId, onCommentAdded, context }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { commentsByPost, isLoading, fetchComments, addComment } = useCommentStore()
  const [modalOpen, setModalOpen] = useState(false)

  const storeKey = articleId ? `article:${articleId}` : (postId ?? '')
  const comments = commentsByPost[storeKey] ?? []
  const loading = isLoading[storeKey] ?? false

  useEffect(() => { fetchComments(storeKey) }, [storeKey, fetchComments])

  const handleSubmit = async (text: string) => {
    try {
      await addComment(storeKey, text)
      onCommentAdded?.()
    } catch {
      toast.error('Yorum gönderilemedi')
      throw new Error('failed')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isAuthenticated && (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-3 w-full text-left group"
        >
          <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" className="shrink-0" />
          <div className="flex-1 bg-surface-raised border border-surface-border group-hover:border-brand-500/50 rounded-xl px-3 py-2.5 text-sm text-gray-500 transition-colors">
            Yorum yaz...
          </div>
        </button>
      )}

      {context && (
        <CommentComposeModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          context={context}
          placeholder="Yorumunu yaz... (@mention destekler)"
          onSubmit={handleSubmit}
        />
      )}

      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : comments.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="font-medium">Henüz yorum yok</p>
          <p className="text-sm mt-1">İlk yorumu sen yap!</p>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-surface-border/50">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={storeKey} />
          ))}
        </div>
      )}
    </div>
  )
}
