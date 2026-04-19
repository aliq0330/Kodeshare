import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Heart, Repeat2, BadgeCheck } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import FollowButton from '@modules/social/FollowButton'
import { postService } from '@services/postService'
import { useAuthStore } from '@store/authStore'
import { userService } from '@services/userService'
import type { User } from '@/types'

interface PostStatsModalProps {
  open: boolean
  onClose: () => void
  postId: string
  likesCount: number
  repostCount: number
}

type Tab = 'likes' | 'reposts'

export default function PostStatsModal({ open, onClose, postId, likesCount, repostCount }: PostStatsModalProps) {
  const { user: me } = useAuthStore()
  const [tab, setTab] = useState<Tab>('likes')
  const [likers, setLikers] = useState<User[]>([])
  const [reposters, setReposters] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      postService.getPostLikers(postId),
      postService.getPostReposters(postId),
      me ? userService.getFollowingIds() : Promise.resolve(new Set<string>()),
    ])
      .then(([l, r, ids]) => {
        setLikers(l as User[])
        setReposters(r as User[])
        setFollowingIds(ids)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, postId, me])

  if (!open) return null

  const list = tab === 'likes' ? likers : reposters

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="font-semibold text-white text-sm">İstatistikler</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border">
          <button
            onClick={() => setTab('likes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'likes' ? 'border-red-400 text-red-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Heart className="w-4 h-4" />
            Beğenenler
            <span className="text-xs bg-surface-raised px-1.5 py-0.5 rounded-full">{likesCount}</span>
          </button>
          <button
            onClick={() => setTab('reposts')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'reposts' ? 'border-green-400 text-green-400' : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Repeat2 className="w-4 h-4" />
            Repost
            <span className="text-xs bg-surface-raised px-1.5 py-0.5 rounded-full">{repostCount}</span>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">
              {tab === 'likes' ? 'Henüz beğeni yok' : 'Henüz repost yok'}
            </p>
          ) : (
            list.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
                <Link to={`/profile/${u.username}`} onClick={onClose} className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" online={u.isOnline} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-white truncate">{u.displayName}</span>
                      {u.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
                    </div>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </Link>
                {me && me.id !== u.id && (
                  <FollowButton userId={u.id} isFollowing={followingIds.has(u.id)} size="xs" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
