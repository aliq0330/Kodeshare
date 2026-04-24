import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import CommentItem from './CommentItem'
import { useAuthStore } from '@store/authStore'
import { useCommentStore } from '@store/commentStore'
import toast from 'react-hot-toast'

interface CommentThreadProps {
  postId: string
  onCommentAdded?: () => void
}

export default function CommentThread({ postId, onCommentAdded }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuthStore()
  const { commentsByPost, isLoading, fetchComments, addComment } = useCommentStore()
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const comments = commentsByPost[postId] ?? []
  const loading = isLoading[postId] ?? false

  useEffect(() => {
    fetchComments(postId)
  }, [postId, fetchComments])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      await addComment(postId, text.trim())
      setText('')
      onCommentAdded?.()
    } catch {
      toast.error('Yorum gönderilemedi')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {isAuthenticated && (
        <form onSubmit={handleSubmit} className="flex items-start gap-3">
          <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" className="mt-1 shrink-0" />
          <div className="flex-1 flex items-end gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Yorum yaz... (@mention, #hashtag destekler)"
              rows={1}
              className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none"
              style={{ minHeight: '24px', maxHeight: '120px' }}
              onInput={(e) => {
                const t = e.target as HTMLTextAreaElement
                t.style.height = 'auto'
                t.style.height = t.scrollHeight + 'px'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="shrink-0 p-1.5 rounded-lg text-brand-400 hover:text-brand-300 disabled:opacity-40 transition-colors"
            >
              {submitting ? <Spinner className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
            </button>
          </div>
        </form>
      )}

      {loading && comments.length === 0 ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : comments.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="font-medium">Henüz yorum yok</p>
          <p className="text-sm mt-1">İlk yorumu sen yap!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} postId={postId} />
          ))}
        </div>
      )}
    </div>
  )
}
