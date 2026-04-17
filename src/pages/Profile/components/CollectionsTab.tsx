import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Folder, Plus } from 'lucide-react'
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
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    collectionService.getUserCollections(username).then(setCollections).catch(() => {}).finally(() => setIsLoading(false))
  }, [username])

  const handleCreate = async (payload: CreateCollectionPayload) => {
    const created = await collectionService.create(payload)
    setCollections((prev) => [created, ...prev])
    toast.success('Koleksiyon oluşturuldu')
  }

  if (isLoading) return <div className="flex justify-center py-10"><Spinner /></div>

  return (
    <div className="flex flex-col gap-4">
      {isOwn && (
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>
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
            <Link
              key={col.id}
              to={`/collection/${col.id}`}
              className="card p-4 hover:border-brand-500/50 transition-colors group"
            >
              <div className="flex items-center gap-2 mb-2">
                <Folder className="w-5 h-5 text-brand-400" />
                <span className="font-medium text-white group-hover:text-brand-300 transition-colors">{col.name}</span>
                {col.visibility === 'private' && (
                  <Lock className="w-3.5 h-3.5 text-gray-500 ml-auto" />
                )}
              </div>
              {col.description && (
                <p className="text-sm text-gray-500 line-clamp-2 mb-2">{col.description}</p>
              )}
              <Badge variant="default">{col.postsCount} gönderi</Badge>
            </Link>
          ))}
        </div>
      )}

      <CollectionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleCreate}
      />
    </div>
  )
}
