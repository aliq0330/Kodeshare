import { useState } from 'react'
import { Globe, Lock } from 'lucide-react'
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
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [visibility, setVisibility] = useState<CollectionVisibility>(initial?.visibility ?? 'public')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await onSave({ name, description, visibility })
    setLoading(false)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Koleksiyonu Düzenle' : 'Yeni Koleksiyon'}
      size="sm"
    >
      <div className="flex flex-col gap-4">
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
                    ? 'border-brand-500 bg-brand-900/20 text-brand-300'
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
