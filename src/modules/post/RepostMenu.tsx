import { useEffect, useRef, useState } from 'react'
import { IconRepeat, IconQuote } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { compactNumber } from '@utils/formatters'
import type { PostPreview } from '@/types'

interface RepostMenuProps {
  post: PostPreview
  onRepost: () => void
  onQuote: () => void
  showCount?: boolean
  className?: string
}

export default function RepostMenu({ post, onRepost, onQuote, showCount = true, className }: RepostMenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 text-sm transition-colors',
          post.isReposted ? 'text-green-400' : 'text-gray-500 hover:text-green-400',
        )}
        title="Yeniden paylaş"
      >
        <IconRepeat className="w-[18px] h-[18px]" />
        {showCount && compactNumber(post.repostCount)}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-20 w-48 card shadow-2xl py-1">
          <button
            type="button"
            onClick={() => { setOpen(false); onRepost() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
          >
            <IconRepeat className="w-4 h-4 text-green-400" />
            <span className="text-white">
              {post.isReposted ? 'Repost\'u kaldır' : 'Yeniden Gönder'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onQuote() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-surface-raised transition-colors"
          >
            <IconQuote className="w-4 h-4 text-brand-400" />
            <span className="text-white">Alıntı yap</span>
          </button>
        </div>
      )}
    </div>
  )
}
