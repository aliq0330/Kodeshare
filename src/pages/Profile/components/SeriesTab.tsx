import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { IconBook2, IconPlus, IconPencil } from '@tabler/icons-react'
import Badge from '@components/ui/Badge'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import SeriesModal from '@modules/series/SeriesModal'
import { seriesService } from '@services/seriesService'
import toast from 'react-hot-toast'
import type { Series, CreateSeriesPayload } from '@/types'

interface SeriesTabProps {
  username: string
  isOwn?: boolean
}

export default function SeriesTab({ username, isOwn }: SeriesTabProps) {
  const [seriesList, setSeriesList] = useState<Series[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Series | null>(null)

  useEffect(() => {
    setIsLoading(true)
    seriesService.getUserSeries(username)
      .then(setSeriesList)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [username])

  const handleCreate = async (payload: CreateSeriesPayload) => {
    const created = await seriesService.create(payload)
    setSeriesList((prev) => [created, ...prev])
    toast.success('Seri oluşturuldu')
  }

  const handleEdit = async (payload: CreateSeriesPayload) => {
    if (!editTarget) return
    const updated = await seriesService.update(editTarget.id, payload)
    setSeriesList((prev) => prev.map((s) => s.id === updated.id ? updated : s))
    toast.success('Seri güncellendi')
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4">
      {isOwn && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <IconPlus className="w-4 h-4" />
            Yeni Seri
          </Button>
        </div>
      )}

      {seriesList.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <IconBook2 className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="font-medium">Henüz seri yok</p>
          {isOwn && (
            <p className="text-sm mt-1">Gönderilerini bir seri altında toplayabilirsin.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seriesList.map((series) => (
            <div key={series.id} className="relative group">
              <Link
                to={`/series/${series.id}`}
                className="card p-4 hover:border-brand-500/50 transition-colors flex flex-col gap-2 block"
              >
                <div className="flex items-center gap-2">
                  <IconBook2 className="w-5 h-5 text-brand-400 shrink-0" />
                  <span className="font-medium text-white group-hover:text-brand-300 transition-colors truncate flex-1">
                    {series.title}
                  </span>
                </div>
                {series.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{series.description}</p>
                )}
                <Badge variant="default">{series.postsCount} gönderi</Badge>
              </Link>
              {isOwn && (
                <button
                  onClick={(e) => { e.preventDefault(); setEditTarget(series) }}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-surface-raised text-gray-500 hover:text-white"
                  title="Düzenle"
                >
                  <IconPencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <SeriesModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
      <SeriesModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        initial={editTarget ?? undefined}
      />
    </div>
  )
}
