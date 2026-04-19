import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Navigate, Link } from 'react-router-dom'
import {
  ArrowLeft, FileText, MessageSquare, FolderOpen, Heart,
  Bookmark, Mail, ChevronDown, ChevronUp, Trash2,
  ShieldAlert, ExternalLink, BadgeCheck,
} from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import { adminService } from '@services/adminService'
import { isAdmin } from '@/lib/admin'
import toast from 'react-hot-toast'

type SectionKey = 'posts' | 'comments' | 'collections' | 'likes' | 'saves' | 'messages'

const SECTIONS: { key: SectionKey; label: string; icon: React.ReactNode }[] = [
  { key: 'posts',       label: 'Gönderiler',        icon: <FileText className="w-4 h-4" /> },
  { key: 'comments',    label: 'Yorumlar & Yanıtlar', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'collections', label: 'Koleksiyonlar',      icon: <FolderOpen className="w-4 h-4" /> },
  { key: 'likes',       label: 'Beğeniler',          icon: <Heart className="w-4 h-4" /> },
  { key: 'saves',       label: 'Kaydedilenler',      icon: <Bookmark className="w-4 h-4" /> },
  { key: 'messages',    label: 'Mesajlar',            icon: <Mail className="w-4 h-4" /> },
]

export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user: me } = useAuthStore()

  const [profile, setProfile] = useState<any>(null)
  const [activity, setActivity] = useState<Record<SectionKey, number>>({
    posts: 0, comments: 0, collections: 0, likes: 0, saves: 0, messages: 0,
  })
  const [items, setItems] = useState<Record<SectionKey, any[]>>({
    posts: [], comments: [], collections: [], likes: [], saves: [], messages: [],
  })
  const [expanded, setExpanded] = useState<SectionKey | null>(null)
  const [loadingItems, setLoadingItems] = useState<SectionKey | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  if (!isAdmin(me?.id)) return <Navigate to="/" replace />

  const fetchProfile = useCallback(async () => {
    if (!userId) return
    setProfileLoading(true)
    try {
      const [prof, act] = await Promise.all([
        adminService.getUserById(userId),
        adminService.getUserActivity(userId),
      ])
      setProfile(prof)
      setActivity(act)
    } catch (e: any) {
      toast.error(e?.message ?? 'Yüklenemedi')
    } finally {
      setProfileLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const toggleSection = async (key: SectionKey) => {
    if (expanded === key) { setExpanded(null); return }
    setExpanded(key)
    if (items[key].length > 0) return
    setLoadingItems(key)
    try {
      const fetchers: Record<SectionKey, () => Promise<any[]>> = {
        posts:       () => adminService.getUserPosts(userId!),
        comments:    () => adminService.getUserComments(userId!),
        collections: () => adminService.getUserCollections(userId!),
        likes:       () => adminService.getUserLikes(userId!),
        saves:       () => adminService.getUserSaves(userId!),
        messages:    () => adminService.getUserMessages(userId!),
      }
      const data = await fetchers[key]()
      setItems((prev) => ({ ...prev, [key]: data }))
    } catch (e: any) {
      toast.error(e?.message ?? 'Yüklenemedi')
    } finally {
      setLoadingItems(null)
    }
  }

  const bulkDelete = async (key: SectionKey) => {
    const labels: Record<SectionKey, string> = {
      posts: 'tüm gönderilerini', comments: 'tüm yorumlarını',
      collections: 'tüm koleksiyonlarını', likes: 'tüm beğenilerini',
      saves: 'tüm kaydedilenlerini', messages: 'tüm mesajlarını',
    }
    if (!confirm(`@${profile?.username} kullanıcısının ${labels[key]} silmek istiyor musun?`)) return
    setDeleting(`bulk-${key}`)
    try {
      const actions: Record<SectionKey, () => Promise<void>> = {
        posts:       () => adminService.deleteAllUserPosts(userId!),
        comments:    () => adminService.deleteAllUserComments(userId!),
        collections: () => adminService.deleteAllUserCollections(userId!),
        likes:       () => adminService.deleteAllUserLikes(userId!),
        saves:       () => adminService.deleteAllUserSaves(userId!),
        messages:    () => adminService.deleteAllUserMessages(userId!),
      }
      await actions[key]()
      setItems((prev) => ({ ...prev, [key]: [] }))
      setActivity((prev) => ({ ...prev, [key]: 0 }))
      toast.success('Silindi')
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const deleteItem = async (key: SectionKey, itemId: string) => {
    setDeleting(itemId)
    try {
      if (key === 'posts')    await adminService.deletePost(itemId)
      if (key === 'comments') await adminService.deleteComment(itemId)
      setItems((prev) => ({ ...prev, [key]: prev[key].filter((x: any) => (x.id ?? x.post_id) !== itemId) }))
      setActivity((prev) => ({ ...prev, [key]: Math.max(0, prev[key] - 1) }))
      toast.success('Silindi')
    } catch (e: any) {
      toast.error(e?.message ?? 'Silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  const deleteAccount = async () => {
    if (!confirm(`⚠️ @${profile?.username} kullanıcısının hesabını kalıcı olarak silmek istediğine emin misin? Bu işlem geri alınamaz!`)) return
    if (!confirm('Son onay: Hesap ve tüm veriler silinecek. Devam et?')) return
    setDeleting('account')
    try {
      await adminService.deleteUserAccount(userId!)
      toast.success('Hesap silindi')
      navigate('/admin')
    } catch (e: any) {
      toast.error(e?.message ?? 'Hesap silinemedi')
    } finally {
      setDeleting(null)
    }
  }

  if (profileLoading) return <div className="flex justify-center py-20"><Spinner /></div>
  if (!profile) return <div className="text-center text-gray-500 py-20">Kullanıcı bulunamadı</div>

  return (
    <div className="flex flex-col gap-5">
      {/* Back */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-fit"
      >
        <ArrowLeft className="w-4 h-4" /> Admin Paneline Dön
      </button>

      {/* User Card */}
      <div className="card p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Avatar src={profile.avatar_url} alt={profile.display_name} size="lg" online={profile.is_online} />
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-white text-lg">{profile.display_name}</h2>
              {profile.is_verified && <BadgeCheck className="w-4 h-4 text-brand-400" />}
            </div>
            <p className="text-sm text-gray-500">@{profile.username}</p>
            <p className="text-xs text-gray-600 mt-1">
              Katılım: {new Date(profile.created_at).toLocaleDateString('tr')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-center">
            <p className="text-white font-bold">{profile.followers_count}</p>
            <p className="text-xs text-gray-500">Takipçi</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{profile.following_count}</p>
            <p className="text-xs text-gray-500">Takip</p>
          </div>
          <div className="text-center">
            <p className="text-white font-bold">{profile.posts_count}</p>
            <p className="text-xs text-gray-500">Gönderi</p>
          </div>
          <Link
            to={`/profile/${profile.username}`}
            className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Activity Sections */}
      <div className="flex flex-col gap-3">
        {SECTIONS.map(({ key, label, icon }) => (
          <div key={key} className="card overflow-hidden">
            {/* Section Header */}
            <div className="p-4 flex items-center justify-between gap-3">
              <button
                className="flex items-center gap-2.5 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                onClick={() => toggleSection(key)}
              >
                <span className="text-gray-500">{icon}</span>
                {label}
                <span className="ml-1 px-2 py-0.5 rounded-full bg-surface-raised text-xs text-gray-400">
                  {activity[key]}
                </span>
                {expanded === key
                  ? <ChevronUp className="w-4 h-4 text-gray-500" />
                  : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              {activity[key] > 0 && (
                <Button
                  variant="ghost"
                  size="xs"
                  loading={deleting === `bulk-${key}`}
                  onClick={() => bulkDelete(key)}
                  className="text-red-400 hover:bg-red-900/30 hover:text-red-300 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Tümünü Sil
                </Button>
              )}
            </div>

            {/* Expanded Items */}
            {expanded === key && (
              <div className="border-t border-surface-border">
                {loadingItems === key ? (
                  <div className="flex justify-center py-6"><Spinner /></div>
                ) : items[key].length === 0 ? (
                  <p className="text-center text-gray-600 text-sm py-6">İçerik yok</p>
                ) : (
                  <div className="divide-y divide-surface-border max-h-80 overflow-y-auto">
                    {items[key].map((item: any) => {
                      const id = item.id ?? item.post_id
                      const canDelete = key === 'posts' || key === 'comments'
                      return (
                        <div key={id} className="px-4 py-3 flex items-center justify-between gap-3 hover:bg-surface-raised/50">
                          <div className="min-w-0 flex-1">
                            {key === 'posts' && (
                              <div>
                                <p className="text-sm text-white truncate">{item.title}</p>
                                <p className="text-xs text-gray-500">{item.type} · ♥ {item.likes_count} · {new Date(item.created_at).toLocaleDateString('tr')}</p>
                              </div>
                            )}
                            {key === 'comments' && (
                              <div>
                                <p className="text-sm text-white truncate">{item.content}</p>
                                <p className="text-xs text-gray-500">{item.post?.title ?? ''} · {new Date(item.created_at).toLocaleDateString('tr')}</p>
                              </div>
                            )}
                            {key === 'collections' && (
                              <div>
                                <p className="text-sm text-white truncate">{item.name}</p>
                                <p className="text-xs text-gray-500">{item.posts_count} gönderi · {item.visibility}</p>
                              </div>
                            )}
                            {(key === 'likes' || key === 'saves') && (
                              <div>
                                <p className="text-sm text-white truncate">{item.post?.title ?? item.post_id}</p>
                                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('tr')}</p>
                              </div>
                            )}
                            {key === 'messages' && (
                              <div>
                                <p className="text-sm text-white truncate">{item.content}</p>
                                <p className="text-xs text-gray-500">{new Date(item.created_at).toLocaleDateString('tr')}</p>
                              </div>
                            )}
                          </div>
                          {canDelete && (
                            <button
                              disabled={deleting === id}
                              onClick={() => deleteItem(key, id)}
                              className="p-1.5 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-900/20 transition-colors shrink-0 disabled:opacity-40"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Danger Zone */}
      <div className="card border-red-900/40 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-900/30 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <p className="font-semibold text-red-400">Hesabı Kalıcı Olarak Sil</p>
            <p className="text-xs text-gray-500">Tüm veriler, gönderiler ve hesap bilgileri silinir. Geri alınamaz.</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          loading={deleting === 'account'}
          onClick={deleteAccount}
          className="text-red-400 border border-red-900/50 hover:bg-red-900/30 hover:text-red-300 shrink-0"
        >
          <Trash2 className="w-4 h-4 mr-1.5" /> Hesabı Sil
        </Button>
      </div>
    </div>
  )
}
