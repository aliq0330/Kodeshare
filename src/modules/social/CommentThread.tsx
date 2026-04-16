import { useState } from 'react'
import { Send } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import CommentItem from './CommentItem'
import { useAuthStore } from '@store/authStore'
import type { Comment } from '@/types'

interface CommentThreadProps {
  postId: string
}

export default function CommentThread({ postId: _ }: CommentThreadProps) {
  const { user, isAuthenticated } = useAuthStore()
  const [text, setText] = useState('')
  const [isLoading] = useState(false)
  const [comments] = useState<Comment[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    // dispatch to commentStore
    setText('')
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Composer */}
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
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      )}

      {/* Comments */}
      {isLoading && comments.length === 0 ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : comments.length === 0 ? (
        <div className="card p-8 text-center text-gray-500">
          <p className="font-medium">Henüz yorum yok</p>
          <p className="text-sm mt-1">İlk yorumu sen yap!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}
