import { useState, useEffect } from 'react'
import { Globe, Lock, ImageIcon, X } from 'lucide-react'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import { cn } from '@utils/cn'
import type { Collection, CollectionVisibility, CreateCollectionPayload } from '@/types'

interface CollectionModalProps {
  open: boolean
  onClose: () => void
  onSave: (payload: CreateCollectionPayload) => Promise<void>
  initial?: Collection
}

export default function CollectionModal({ open, onClose, onSave, initial }: CollectionModalProps) {
  const [name, setName]             = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [coverUrl, setCoverUrl]     = useState(initial?.coverUrl ?? '')
  const [visibility, setVisibility] = useState<CollectionVisibility>(initial?.visibility ?? 'public')
  const [loading, setLoading]       = useState(false)
  const [imgError, setImgError]     = useState(false)

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? '')
      setDescription(initial?.description ?? '')
      setCoverUrl(initial?.coverUrl ?? '')
      setVisibility(initial?.visibility ?? 'public')
      setImgError(false)
    }
  }, [open, initial])

  // Yeni URL girilince hata durumunu sıfırla
  useEffect(() => { setImgError(false) }, [coverUrl])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave({ name, description, coverUrl: coverUrl.trim() || undefined, visibility })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  const showPreview = !!coverUrl.trim() && !imgError

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Koleksiyonu Düzenle' : 'Yeni Koleksiyon'}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {/* Kapak fotoğrafı */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-1.5">Kapak Fotoğrafı</p>
          {showPreview && (
            <div className="relative mb-2 rounded-xl overflow-hidden h-32 bg-surface-raised">
              <img
                src={coverUrl.trim()}
                alt="Kapak"
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
              <button
                type="button"
                onClick={() => setCoverUrl('')}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <Input
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
            placeholder="https://örnek.com/kapak.jpg"
            leftIcon={<ImageIcon className="w-4 h-4" />}
          />
          {imgError && coverUrl.trim() && (
            <p className="text-xs text-red-400 mt-1">Görsel yüklenemedi, URL'yi kontrol et.</p>
          )}
        </div>

        <Input
          label="İsim"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Koleksiyon adı"
        />
        <Textarea
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bu koleksiyon hakkında..."
          rows={2}
        />

        {/* Visibility */}
        <div>
          <p className="text-sm font-medium text-gray-300 mb-2">Görünürlük</p>
          <div className="grid grid-cols-2 gap-2">
            {([
              { id: 'public',  icon: Globe, label: 'Herkese Açık' },
              { id: 'private', icon: Lock,  label: 'Gizli' },
            ] as const).map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setVisibility(id)}
                className={cn(
                  'flex items-center gap-2 p-3 rounded-lg border text-sm transition-colors',
                  visibility === id
                    ? 'border-brand-500 bg-brand-500/10 text-brand-500'
                    : 'border-surface-border text-gray-500 hover:border-surface-raised hover:text-gray-300',
                )}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} disabled={!name}>
            {initial ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
