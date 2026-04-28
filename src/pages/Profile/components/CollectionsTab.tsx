import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Globe, Folder, Plus, Pencil } from 'lucide-react'
import Badge from '@components/ui/Badge'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import CollectionModal from '@collections/CollectionModal'
import { collectionService } from '@services/collectionService'
import toast from 'react-hot-toast'
import type { Collection, CreateCollectionPayload } from '@/types'

interface CollectionsTabProps {
  username: string
  isOwn?: boolean
}

export default function CollectionsTab({ username, isOwn }: CollectionsTabProps) {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Collection | null>(null)

  useEffect(() => {
    setIsLoading(true)
    collectionService.getUserCollections(username).then(setCollections).catch(() => {}).finally(() => setIsLoading(false))
  }, [username])

  const handleCreate = async (payload: CreateCollectionPayload) => {
    const created = await collectionService.create(payload)
    setCollections((prev) => [created, ...prev])
    toast.success('Koleksiyon oluşturuldu')
  }

  const handleEdit = async (payload: CreateCollectionPayload) => {
    if (!editTarget) return
    const updated = await collectionService.update(editTarget.id, payload)
    setCollections((prev) => prev.map((c) => c.id === updated.id ? updated : c))
    toast.success('Koleksiyon güncellendi')
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4">
      {isOwn && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            Yeni Koleksiyon
          </Button>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="card p-10 text-center text-gray-500">
          <Folder className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="font-medium">Henüz koleksiyon yok</p>
          {isOwn && (
            <p className="text-sm mt-1">Yukarıdaki butona tıklayarak koleksiyon oluşturabilirsin.</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="relative group">
              <Link
                to={`/collection/${col.id}`}
                className="card p-4 hover:border-brand-500/50 transition-colors flex flex-col gap-2 block"
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-5 h-5 text-brand-400 shrink-0" />
                  <span className="font-medium text-white group-hover:text-brand-300 transition-colors truncate flex-1">{col.name}</span>
                  {col.visibility === 'private' ? (
                    <Lock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                  )}
                  {isOwn && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditTarget(col) }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-surface-raised text-gray-500 hover:text-white shrink-0"
                      title="Düzenle"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                {col.description && (
                  <p className="text-sm text-gray-500 line-clamp-2">{col.description}</p>
                )}
                <Badge variant="default">{col.postsCount} gönderi</Badge>
              </Link>
            </div>
          ))}
        </div>
      )}

      <CollectionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSave={handleCreate}
      />
      <CollectionModal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={handleEdit}
        initial={editTarget ?? undefined}
      />
    </div>
  )
}
