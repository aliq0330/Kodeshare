import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { IconArrowLeft, IconBook2, IconTrash, IconGripVertical } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import SeriesModal from '@modules/series/SeriesModal'
import { seriesService } from '@services/seriesService'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import type { Series, PostPreview, CreateSeriesPayload } from '@/types'

export default function SeriesDetailPage() {
  const { seriesId } = useParams<{ seriesId: string }>()
  const { user }     = useAuthStore()
  const [series, setSeries]   = useState<Series | null>(null)
  const [posts, setPosts]     = useState<PostPreview[]>([])
  const [isLoading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  useEffect(() => {
    if (!seriesId) return
    setLoading(true)
    Promise.all([
      seriesService.getSeries(seriesId),
      seriesService.getSeriesPosts(seriesId),
    ])
      .then(([s, p]) => { setSeries(s); setPosts(p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [seriesId])

  const isOwner = !!user && !!series && user.id === series.author.id

  const handleRemovePost = async (postId: string) => {
    if (!seriesId) return
    setRemoving(postId)
    try {
      await seriesService.removePost(seriesId, postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      setSeries((s) => s ? { ...s, postsCount: Math.max(0, s.postsCount - 1) } : s)
      toast.success('Seriden çıkarıldı')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setRemoving(null)
    }
  }

  const handleEdit = async (payload: CreateSeriesPayload) => {
    if (!seriesId) return
    const updated = await seriesService.update(seriesId, payload)
    setSeries(updated)
    toast.success('Seri güncellendi')
  }

  const handleDelete = async () => {
    if (!seriesId || !window.confirm('Bu seriyi silmek istediğine emin misin?')) return
    try {
      await seriesService.delete(seriesId)
      toast.success('Seri silindi')
      window.history.back()
    } catch {
      toast.error('Seri silinemedi')
    }
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!series) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <p className="font-medium">Seri bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Link to={`/profile/${series.author.username}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <IconArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-900/40 flex items-center justify-center shrink-0">
            <IconBook2 className="w-6 h-6 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white">{series.title}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <Link to={`/profile/${series.author.username}`} className="flex items-center gap-1.5">
                <Avatar src={series.author.avatarUrl} alt={series.author.displayName} size="xs" />
                <span className="text-xs text-gray-500">{series.author.displayName}</span>
              </Link>
              <span className="text-gray-700">·</span>
              <Badge variant="default">{posts.length} gönderi</Badge>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1 shrink-0">
              <button
                onClick={() => setEditOpen(true)}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-surface-border hover:border-surface-raised rounded-lg transition-colors"
              >
                Düzenle
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-600 hover:text-red-400 border border-surface-border hover:border-red-900 rounded-lg transition-colors"
                title="Seriyi Sil"
              >
                <IconTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {series.description && (
          <p className="text-sm text-gray-400 mt-4">{series.description}</p>
        )}
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <IconGripVertical className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="font-medium">Seri boş</p>
          {isOwner && (
            <p className="text-sm mt-1 text-gray-600">Gönderi detay sayfasından bu seriye gönderi ekleyebilirsin.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-0">
          {posts.map((post, index) => (
            <div key={post.id} className="relative group">
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6 text-xs text-gray-700 font-mono w-5 text-right">
                {index + 1}
              </div>
              <PostCard
                post={post}
                onRemoveFromCollection={isOwner && !removing ? () => handleRemovePost(post.id) : undefined}
                removeFromCollectionLabel="Bu seriden çıkar"
              />
            </div>
          ))}
        </div>
      )}

      <SeriesModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleEdit}
        initial={series}
      />
    </div>
  )
}
