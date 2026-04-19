import { useState, useEffect, useCallback } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Trash2, Users, FileText, MessageSquare, ShieldCheck, ExternalLink } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import { adminService } from '@services/adminService'
import { isAdmin } from '@/lib/admin'
import toast from 'react-hot-toast'

type Tab = 'users' | 'posts' | 'comments'

export default function AdminPage() {
  const { user } = useAuthStore()
  const [tab, setTab]         = useState<Tab>('users')
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ users: 0, posts: 0, comments: 0 })
  const [users, setUsers]     = useState<any[]>([])
  const [posts, setPosts]     = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)

  if (!isAdmin(user?.id)) return <Navigate to="/" replace />

  const fetchStats = useCallback(async () => {
    try { setStats(await adminService.getStats()) } catch {}
  }, [])

  const fetchTab = useCallback(async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'users')    setUsers(await adminService.getAllUsers())
      if (t === 'posts')    setPosts(await adminService.getAllPosts())
      if (t === 'comments') setComments(await adminService.getAllComments())
    } catch (e: any) {
      toast.error(e?.message ?? 'Veri yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStats() }, [fetchStats])
  useEffect(() => { fetchTab(tab) }, [tab, fetchTab])

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return
    setDeletingId(postId)
    try {
      await adminService.deletePost(postId)
      setPosts((p) => p.filter((x) => x.id !== postId))
      setStats((s) => ({ ...s, posts: s.posts - 1 }))
      toast.success('Gönderi silindi')
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Bu yorumu silmek istediğine emin misin?')) return
    setDeletingId(commentId)
    try {
      await adminService.deleteComment(commentId)
      setComments((c) => c.filter((x) => x.id !== commentId))
      setStats((s) => ({ ...s, comments: s.comments - 1 }))
      toast.success('Yorum silindi')
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi')
    } finally {
      setDeletingId(null)
    }
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'users',    label: 'Kullanıcılar', icon: <Users className="w-4 h-4" />,         count: stats.users },
    { id: 'posts',    label: 'Gönderiler',   icon: <FileText className="w-4 h-4" />,       count: stats.posts },
    { id: 'comments', label: 'Yorumlar',     icon: <MessageSquare className="w-4 h-4" />, count: stats.comments },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="card p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-900/40 border border-brand-700/40 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-brand-400" />
        </div>
        <div>
          <h1 className="font-bold text-white text-lg">Admin Paneli</h1>
          <p className="text-xs text-gray-500">Tüm platform aktivitelerini yönet</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {tabs.map(({ id, label, icon, count }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`card p-4 flex flex-col gap-1 text-left transition-colors hover:border-brand-600/60 ${tab === id ? 'border-brand-500/60 bg-brand-900/10' : ''}`}
          >
            <div className="flex items-center gap-2 text-gray-400 text-xs">{icon}{label}</div>
            <p className="text-2xl font-bold text-white">{count.toLocaleString()}</p>
          </button>
        ))}
      </div>

      {/* Tab Nav */}
      <div className="flex gap-1 border-b border-surface-border">
        {tabs.map(({ id, label, icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {icon}{label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <>
          {/* USERS */}
          {tab === 'users' && (
            <div className="flex flex-col gap-2">
              {users.length === 0 && <p className="text-center text-gray-500 py-10">Kullanıcı yok</p>}
              {users.map((u) => (
                <div key={u.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={u.avatar_url} alt={u.display_name} size="sm" />
                    <Link to={`/admin/user/${u.id}`} className="min-w-0 group">
                      <p className="text-sm font-medium text-brand-400 truncate group-hover:text-brand-300 transition-colors">{u.display_name}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </Link>
                  </div>
                  <div className="hidden sm:flex items-center gap-6 text-xs text-gray-500 shrink-0">
                    <span>{u.posts_count} gönderi</span>
                    <span>{u.followers_count} takipçi</span>
                    <span>{new Date(u.created_at).toLocaleDateString('tr')}</span>
                  </div>
                  <Link
                    to={`/profile/${u.username}`}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors shrink-0"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}

          {/* POSTS */}
          {tab === 'posts' && (
            <div className="flex flex-col gap-2">
              {posts.length === 0 && <p className="text-center text-gray-500 py-10">Gönderi yok</p>}
              {posts.map((p) => (
                <div key={p.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={p.author?.avatar_url} alt={p.author?.display_name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{p.title}</p>
                      <p className="text-xs text-gray-500">@{p.author?.username} · {p.type}</p>
                    </div>
                  </div>
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span>♥ {p.likes_count}</span>
                    <span>💬 {p.comments_count}</span>
                    <span>{new Date(p.created_at).toLocaleDateString('tr')}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/post/${p.id}`}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                    <Button
                      variant="ghost"
                      size="xs"
                      loading={deletingId === p.id}
                      onClick={() => handleDeletePost(p.id)}
                      className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMMENTS */}
          {tab === 'comments' && (
            <div className="flex flex-col gap-2">
              {comments.length === 0 && <p className="text-center text-gray-500 py-10">Yorum yok</p>}
              {comments.map((c) => (
                <div key={c.id} className="card p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={c.author?.avatar_url} alt={c.author?.display_name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-sm text-white truncate">{c.content}</p>
                      <p className="text-xs text-gray-500">
                        @{c.author?.username}
                        {c.post?.title && <> · {c.post.title}</>}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="hidden sm:block text-xs text-gray-500">
                      {new Date(c.created_at).toLocaleDateString('tr')}
                    </span>
                    <Button
                      variant="ghost"
                      size="xs"
                      loading={deletingId === c.id}
                      onClick={() => handleDeleteComment(c.id)}
                      className="text-red-400 hover:bg-red-900/30 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
