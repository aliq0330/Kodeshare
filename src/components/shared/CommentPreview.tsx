import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCommentStore } from '@store/commentStore'
import { articleService } from '@services/articleService'

interface PreviewItem {
  id: string
  author: { displayName: string }
  content: string
}

interface Props {
  postId?: string
  articleId?: string
  commentsCount: number
  detailLink: string
}

function cleanText(text: string) {
  return text
    .replace(/```[\s\S]*?```/g, '[kod]')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
}

export default function CommentPreview({ postId, articleId, commentsCount, detailLink }: Props) {
  const [items, setItems] = useState<PreviewItem[]>([])
  const didFetch = useRef(false)

  const { fetchComments, commentsByPost, isLoading } = useCommentStore()

  useEffect(() => {
    if (postId) {
      if (!commentsByPost[postId] && !isLoading[postId]) {
        fetchComments(postId)
      }
      return
    }
    if (articleId && !didFetch.current) {
      didFetch.current = true
      articleService.getComments(articleId).then(cs =>
        setItems(cs.slice(0, 2).map(c => ({ id: c.id, author: c.author, content: c.content })))
      )
    }
  }, [postId, articleId])

  useEffect(() => {
    if (postId && commentsByPost[postId]) {
      setItems(commentsByPost[postId].slice(0, 2))
    }
  }, [commentsByPost, postId])

  if (items.length === 0) return null

  return (
    <div className="mt-3 pt-3 border-t border-surface-border/30 flex flex-col gap-1.5">
      {items.map(item => (
        <Link
          key={item.id}
          to={detailLink}
          className="flex items-baseline gap-1.5 text-sm min-w-0 hover:opacity-80 transition-opacity"
        >
          <span className="font-semibold text-white shrink-0 max-w-[140px] truncate">
            {item.author.displayName}
          </span>
          <span className="text-gray-400 truncate min-w-0">
            {cleanText(item.content)}
          </span>
        </Link>
      ))}
      {commentsCount > 2 && (
        <Link to={detailLink} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
          {commentsCount} yorumun tamamını gör
        </Link>
      )}
    </div>
  )
}
