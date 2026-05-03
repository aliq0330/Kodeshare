import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconX, IconHeart, IconRepeat, IconBookmark, IconFolderPlus, IconRosetteFilled } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import FollowButton from '@modules/social/FollowButton'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@store/authStore'
import { userService } from '@services/userService'

interface UserRow {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
  isVerified: boolean
  isOnline: boolean
}

interface PostStatsModalProps {
  open: boolean
  onClose: () => void
  postId: string
  likesCount: number
  repostCount: number
}

type Tab = 'likes' | 'reposts' | 'saves' | 'collections'

async function fetchPostLikers(postId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('post_likes')
    .select('created_at, user:profiles!post_likes_user_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Array<{ user: Record<string, unknown> | null }>)
    .map((row) => row.user)
    .filter((u): u is Record<string, unknown> => u !== null)
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
      isVerified:  (u.is_verified as boolean) ?? false,
      isOnline:    (u.is_online as boolean) ?? false,
    }))
}

async function fetchPostReposters(postId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('created_at, author:profiles!posts_author_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
    .eq('reposted_from', postId)
    .eq('type', 'repost')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Array<{ author: Record<string, unknown> | null }>)
    .map((row) => row.author)
    .filter((u): u is Record<string, unknown> => u !== null)
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
      isVerified:  (u.is_verified as boolean) ?? false,
      isOnline:    (u.is_online as boolean) ?? false,
    }))
}

async function fetchPostSavers(postId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('post_saves')
    .select('created_at, user:profiles!post_saves_user_id_fkey(id, username, display_name, avatar_url, is_verified, is_online)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Array<{ user: Record<string, unknown> | null }>)
    .map((row) => row.user)
    .filter((u): u is Record<string, unknown> => u !== null)
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
      isVerified:  (u.is_verified as boolean) ?? false,
      isOnline:    (u.is_online as boolean) ?? false,
    }))
}

async function fetchPostCollectors(postId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('collection_posts')
    .select('collection:collections!collection_posts_collection_id_fkey(owner:profiles!collections_owner_id_fkey(id, username, display_name, avatar_url, is_verified, is_online))')
    .eq('post_id', postId)
  if (error) throw new Error(error.message)

  const seen = new Set<string>()
  return ((data ?? []) as unknown as Array<{ collection: { owner: Record<string, unknown> | null } | null }>)
    .map((row) => row.collection?.owner)
    .filter((u): u is Record<string, unknown> => u !== null && u !== undefined)
    .filter((u) => {
      if (seen.has(u.id as string)) return false
      seen.add(u.id as string)
      return true
    })
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
      isVerified:  (u.is_verified as boolean) ?? false,
      isOnline:    (u.is_online as boolean) ?? false,
    }))
}

export default function PostStatsModal({ open, onClose, postId, likesCount, repostCount }: PostStatsModalProps) {
  const { user: me } = useAuthStore()
  const [tab, setTab] = useState<Tab>('likes')
  const [likers, setLikers]         = useState<UserRow[]>([])
  const [reposters, setReposters]   = useState<UserRow[]>([])
  const [savers, setSavers]         = useState<UserRow[]>([])
  const [collectors, setCollectors] = useState<UserRow[]>([])
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setLikers([])
      setReposters([])
      setSavers([])
      setCollectors([])
      setFollowingIds(new Set())
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.allSettled([
      fetchPostLikers(postId),
      fetchPostReposters(postId),
      fetchPostSavers(postId),
      fetchPostCollectors(postId),
      me ? userService.getFollowingIds() : Promise.resolve(new Set<string>()),
    ]).then(([l, r, s, c, ids]) => {
      if (cancelled) return
      if (l.status === 'fulfilled') setLikers(l.value)
      if (r.status === 'fulfilled') setReposters(r.value)
      if (s.status === 'fulfilled') setSavers(s.value)
      if (c.status === 'fulfilled') setCollectors(c.value)
      if (ids.status === 'fulfilled') setFollowingIds(ids.value as Set<string>)
    }).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [open, postId, me])

  if (!open) return null

  const lists: Record<Tab, UserRow[]> = {
    likes: likers, reposts: reposters, saves: savers, collections: collectors,
  }
  const list = lists[tab]

  const tabs: { id: Tab; icon: React.ReactNode; label: string; count: number | string }[] = [
    { id: 'likes',       icon: <IconHeart className="w-3.5 h-3.5" />,     label: 'Beğenenler',   count: likesCount },
    { id: 'reposts',     icon: <IconRepeat className="w-3.5 h-3.5" />,   label: 'Repost',       count: repostCount },
    { id: 'saves',       icon: <IconBookmark className="w-3.5 h-3.5" />,  label: 'Kaydeden',     count: loading ? '…' : savers.length },
    { id: 'collections', icon: <IconFolderPlus className="w-3.5 h-3.5" />,label: 'Koleksiyon',   count: loading ? '…' : collectors.length },
  ]

  const tabColors: Record<Tab, string> = {
    likes:       'border-red-400 text-red-400',
    reposts:     'border-green-400 text-green-400',
    saves:       'border-brand-400 text-brand-400',
    collections: 'border-purple-400 text-purple-400',
  }

  const tabTextColors: Record<Tab, string> = {
    likes:       'text-red-400',
    reposts:     'text-green-400',
    saves:       'text-brand-400',
    collections: 'text-purple-400',
  }

  const activeTab = tabs.find((t) => t.id === tab) ?? tabs[0]

  const emptyMessages: Record<Tab, string> = {
    likes:       'Henüz beğeni yok',
    reposts:     'Henüz repost yok',
    saves:       'Henüz kaydeden yok',
    collections: 'Henüz koleksiyona eklenmemiş',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative w-full max-w-md card shadow-2xl max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden animate-slide-up z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="font-semibold text-white text-sm">İstatistikler</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <IconX className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs - sadece ikonlar */}
        <div className="flex border-b border-surface-border">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center py-3 border-b-2 -mb-px transition-colors ${
                tab === t.id ? tabColors[t.id] : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              {t.icon}
            </button>
          ))}
        </div>

        {/* Aktif sekme etiketi + sayı */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border">
          <span className={`text-sm font-medium ${tabTextColors[tab]}`}>{activeTab.label}</span>
          <span className="text-xs text-gray-500 bg-surface-raised px-1.5 py-0.5 rounded-full">{activeTab.count}</span>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
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
