import { useState, useEffect } from 'react'
import { Folder, Check, Plus, Minus } from 'lucide-react'
import Modal from '@components/ui/Modal'
import Spinner from '@components/ui/Spinner'
import { collectionService } from '@services/collectionService'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import type { Collection } from '@/types'

interface Props {
  postId?: string
  articleId?: string
  open: boolean
  onClose: () => void
}

export default function AddToCollectionModal({ postId, articleId, open, onClose }: Props) {
  const { user } = useAuth()
  const [collections, setCollections] = useState<Collection[]>([])
  const [added, setAdded] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !user) return
    setLoading(true)
    const fetchAll = async () => {
      const [cols, addedIds] = await Promise.all([
        collectionService.getUserCollections(user.username),
        postId
          ? collectionService.getCollectionIdsForPost(postId)
          : articleId
            ? collectionService.getCollectionIdsForArticle(articleId)
            : Promise.resolve([] as string[]),
      ])
      setCollections(cols)
      setAdded(new Set(addedIds))
    }
    fetchAll().catch(() => {}).finally(() => setLoading(false))
  }, [open, user, postId, articleId])

  const toggle = async (collection: Collection) => {
    const isAdded = added.has(collection.id)
    setSaving(collection.id)
    try {
      if (articleId) {
        if (isAdded) {
          await collectionService.removeArticle(collection.id, articleId)
          setAdded((prev) => { const s = new Set(prev); s.delete(collection.id); return s })
          toast.success(`"${collection.name}" koleksiyonundan çıkarıldı`)
        } else {
          await collectionService.addArticle(collection.id, articleId)
          setAdded((prev) => new Set(prev).add(collection.id))
          toast.success(`"${collection.name}" koleksiyonuna eklendi`)
        }
      } else if (postId) {
        if (isAdded) {
          await collectionService.removePost(collection.id, postId)
          setAdded((prev) => { const s = new Set(prev); s.delete(collection.id); return s })
          toast.success(`"${collection.name}" koleksiyonundan çıkarıldı`)
        } else {
          await collectionService.addPost(collection.id, postId)
          setAdded((prev) => new Set(prev).add(collection.id))
          toast.success(`"${collection.name}" koleksiyonuna eklendi`)
        }
      }
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setSaving(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Koleksiyona Ekle" size="sm">
      {loading ? (
        <div className="flex justify-center py-6"><Spinner /></div>
      ) : collections.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Folder className="w-8 h-8 mx-auto mb-2 text-gray-600" />
          <p className="text-sm">Henüz koleksiyonun yok.</p>
          <p className="text-xs mt-1">Profilinden koleksiyon oluşturabilirsin.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {collections.map((col) => {
            const isAdded = added.has(col.id)
            const isSaving = saving === col.id
            return (
              <button
                key={col.id}
                onClick={() => toggle(col)}
                disabled={isSaving}
                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left disabled:opacity-60 ${
                  isAdded
                    ? 'border-brand-500/60 bg-brand-500/5 hover:bg-red-500/5 hover:border-red-500/40'
                    : 'border-surface-border hover:border-brand-500/50 hover:bg-surface-raised'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isAdded ? 'bg-brand-500/20' : 'bg-brand-900/40'
                }`}>
                  <Folder className={`w-4 h-4 ${isAdded ? 'text-brand-400' : 'text-brand-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{col.name}</p>
                  <p className="text-xs text-gray-500">{col.postsCount} gönderi</p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors shrink-0 ${
                  isAdded
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : 'border-surface-border text-gray-600'
                }`}>
                  {isSaving ? (
                    <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                  ) : isAdded ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </div>
              </button>
            )
          })}
          <p className="text-xs text-gray-600 text-center pt-1">
            Ekli koleksiyona tıklayarak çıkarabilirsin
          </p>
        </div>
      )}
    </Modal>
  )
}
