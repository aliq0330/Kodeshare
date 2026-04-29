import { useState, useEffect } from 'react'
import { IconStack2, IconStackPush, IconStackPop } from '@tabler/icons-react'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import { seriesService } from '@services/seriesService'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import type { Series } from '@/types'

interface AddToSeriesModalProps {
  open: boolean
  onClose: () => void
  postId: string
}

export default function AddToSeriesModal({ open, onClose, postId }: AddToSeriesModalProps) {
  const { user } = useAuthStore()
  const [seriesList, setSeriesList]   = useState<Series[]>([])
  const [inSeries, setInSeries]       = useState<Set<string>>(new Set())
  const [loading, setLoading]         = useState(true)
  const [toggling, setToggling]       = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    Promise.all([
      seriesService.getUserSeries(user.username),
      seriesService.getSeriesIdsForPost(postId),
    ])
      .then(([list, ids]) => {
        setSeriesList(list)
        setInSeries(new Set(ids))
      })
      .catch(() => toast.error('Seriler yüklenemedi'))
      .finally(() => setLoading(false))
  }, [open, user, postId])

  const handleToggle = async (series: Series) => {
    if (toggling) return
    setToggling(series.id)
    const isIn = inSeries.has(series.id)
    try {
      if (isIn) {
        await seriesService.removePost(series.id, postId)
        setInSeries((prev) => { const s = new Set(prev); s.delete(series.id); return s })
        setSeriesList((prev) => prev.map((s) => s.id === series.id ? { ...s, postsCount: Math.max(0, s.postsCount - 1) } : s))
        toast.success(`"${series.title}" serisinden kaldırıldı`)
      } else {
        await seriesService.addPost(series.id, postId, series.postsCount)
        setInSeries((prev) => new Set([...prev, series.id]))
        setSeriesList((prev) => prev.map((s) => s.id === series.id ? { ...s, postsCount: s.postsCount + 1 } : s))
        toast.success(`"${series.title}" serisine eklendi`)
      }
    } catch {
      toast.error('İşlem başarısız')
    } finally {
      setToggling(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Seriye Ekle" size="sm">
      <div className="flex flex-col gap-2">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : seriesList.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <IconStack2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
            <p className="text-sm">Henüz seri oluşturmadın</p>
            <p className="text-xs mt-1 text-gray-600">Profil sayfandan seri oluşturabilirsin.</p>
          </div>
        ) : (
          seriesList.map((series) => {
            const isIn = inSeries.has(series.id)
            const isToggling = toggling === series.id
            return (
              <button
                key={series.id}
                onClick={() => handleToggle(series)}
                disabled={!!toggling}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-surface-border hover:border-brand-500/50 transition-colors group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isIn ? 'bg-brand-500/20 text-brand-400' : 'bg-surface-raised text-gray-500 group-hover:text-brand-400'}`}>
                  {isToggling ? (
                    <Spinner className="w-3.5 h-3.5" />
                  ) : isIn ? (
                    <IconStackPop className="w-4 h-4" />
                  ) : (
                    <IconStackPush className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-medium text-white truncate">{series.title}</p>
                  <p className="text-xs text-gray-500">{series.postsCount} gönderi</p>
                </div>
                {isIn && (
                  <span className="text-xs text-brand-400 shrink-0">Eklendi</span>
                )}
              </button>
            )
          })
        )}
      </div>
    </Modal>
  )
}
