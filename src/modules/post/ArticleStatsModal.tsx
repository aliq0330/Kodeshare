import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { X, Heart, Bookmark, Eye } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { supabase } from '@/lib/supabase'

interface UserRow {
  id: string
  username: string
  displayName: string
  avatarUrl: string | null
}

interface Props {
  open: boolean
  onClose: () => void
  articleId: string
  likesCount: number
  savesCount: number
  viewsCount: number
}

type Tab = 'likes' | 'saves'

async function fetchLikers(articleId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('article_likes')
    .select('user:profiles!article_likes_user_id_fkey(id, username, display_name, avatar_url)')
    .eq('article_id', articleId)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Array<{ user: Record<string, unknown> | null }>)
    .map((row) => row.user)
    .filter((u): u is Record<string, unknown> => u !== null)
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
    }))
}

async function fetchSavers(articleId: string): Promise<UserRow[]> {
  const { data, error } = await supabase
    .from('article_saves')
    .select('user:profiles!article_saves_user_id_fkey(id, username, display_name, avatar_url)')
    .eq('article_id', articleId)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as Array<{ user: Record<string, unknown> | null }>)
    .map((row) => row.user)
    .filter((u): u is Record<string, unknown> => u !== null)
    .map((u) => ({
      id:          u.id as string,
      username:    u.username as string,
      displayName: u.display_name as string,
      avatarUrl:   (u.avatar_url as string) ?? null,
    }))
}

export default function ArticleStatsModal({
  open, onClose, articleId, likesCount, savesCount, viewsCount,
}: Props) {
  const [tab, setTab]       = useState<Tab>('likes')
  const [likers, setLikers] = useState<UserRow[]>([])
  const [savers, setSavers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    Promise.all([fetchLikers(articleId), fetchSavers(articleId)])
      .then(([l, s]) => { setLikers(l); setSavers(s) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, articleId])

  if (!open) return null

  const list = tab === 'likes' ? likers : savers

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm card shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border">
          <h2 className="font-semibold text-white text-sm">İstatistikler</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Views stat */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-surface-border bg-surface-raised/40">
          <Eye className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-400">
            <span className="font-semibold text-white">{viewsCount}</span> görüntülenme
          </span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-surface-border">
          <button
            onClick={() => setTab('likes')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'likes'
                ? 'border-red-400 text-red-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Heart className="w-4 h-4" />
            Beğenenler
            <span className="text-xs bg-surface-raised px-1.5 py-0.5 rounded-full">{likesCount}</span>
          </button>
          <button
            onClick={() => setTab('saves')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === 'saves'
                ? 'border-brand-400 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            Kaydedilenler
            <span className="text-xs bg-surface-raised px-1.5 py-0.5 rounded-full">{savesCount}</span>
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-80">
          {loading ? (
            <div className="flex justify-center py-10"><Spinner /></div>
          ) : list.length === 0 ? (
            <p className="text-center text-gray-500 text-sm py-10">
              {tab === 'likes' ? 'Henüz beğeni yok' : 'Henüz kaydeden yok'}
            </p>
          ) : (
            list.map((u) => (
              <div
                key={u.id}
                className="flex items-center gap-3 px-4 py-3 hover:bg-surface-raised/50 transition-colors"
              >
                <Link
                  to={`/profile/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-2.5 min-w-0"
                >
                  <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{u.displayName}</p>
                    <p className="text-xs text-gray-500">@{u.username}</p>
                  </div>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
