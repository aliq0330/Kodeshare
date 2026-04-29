import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconX, IconHeart, IconRepeatOnce, IconBookmark, IconFolderPlus, IconRosetteFilled } from '@tabler/icons-react'
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

type Tab = 'likes' | 'reposts' | 'saves' | 'collections'

export default function PostStatsModal({ open, onClose, postId, likesCount, repostCount }: PostStatsModalProps) {
  const { user: me } = useAuthStore()
  const [tab, setTab] = useState<Tab>('likes')
  const [likers, setLikers]         = useState<User[]>([])
  const [reposters, setReposters]   = useState<User[]>([])
  const [savers, setSavers]         = useState<User[]>([])
  const [collectors, setCollectors] = useState<User[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([
      postService.getPostLikers(postId),
      postService.getPostReposters(postId),
      postService.getPostSavers(postId),
      postService.getPostCollectors(postId),
      me ? userService.getFollowingIds() : Promise.resolve(new Set<string>()),
    ])
      .then(([l, r, s, c, ids]) => {
        setLikers(l as User[])
        setReposters(r as User[])
        setSavers(s as User[])
        setCollectors(c as User[])
        setFollowingIds(ids)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, postId, me])

  if (!open) return null

  const lists: Record<Tab, User[]> = {
    likes: likers, reposts: reposters, saves: savers, collections: collectors,
  }
  const list = lists[tab]

  const tabs: { id: Tab; icon: React.ReactNode; label: string; count: number | string }[] = [
    { id: 'likes',       icon: <IconHeart className="w-3.5 h-3.5" />,     label: 'Beğenenler',   count: likesCount },
    { id: 'reposts',     icon: <IconRepeatOnce className="w-3.5 h-3.5" />,   label: 'Repost',       count: repostCount },
    { id: 'saves',       icon: <IconBookmark className="w-3.5 h-3.5" />,  label: 'Kaydeden',     count: loading ? '…' : savers.length },
    { id: 'collections', icon: <IconFolderPlus className="w-3.5 h-3.5" />,label: 'Koleksiyon',   count: loading ? '…' : collectors.length },
  ]

  const tabColors: Record<Tab, string> = {
    likes:       'border-red-400 text-red-400',
    reposts:     'border-green-400 text-green-400',
    saves:       'border-brand-400 text-brand-400',
    collections: 'border-purple-400 text-purple-400',
  }

  const emptyMessages: Record<Tab, string> = {
    likes:       'Henüz beğeni yok',
    reposts:     'Henüz repost yok',
    saves:       'Henüz kaydeden yok',
    collections: 'Henüz koleksiyona eklenmemiş',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl card shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="font-semibold text-white text-sm">İstatistikler</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id ? tabColors[t.id] : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-1">{t.icon}{t.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-surface-raised' : 'bg-surface-raised/60'}`}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">{emptyMessages[tab]}</p>
          ) : (
            list.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors">
                <Link to={`/profile/${u.username}`} onClick={onClose} className="flex items-center gap-2.5 min-w-0">
                  <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" online={u.isOnline} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-white truncate">{u.displayName}</span>
                      {u.isVerified && <IconRosetteFilled className="w-3.5 h-3.5 text-brand-400 shrink-0" />}
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
