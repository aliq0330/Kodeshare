import { useState } from 'react'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import type { Series, CreateSeriesPayload } from '@/types'

interface SeriesModalProps {
  open: boolean
  onClose: () => void
  onSave: (payload: CreateSeriesPayload) => Promise<void>
  initial?: Series
}

export default function SeriesModal({ open, onClose, onSave, initial }: SeriesModalProps) {
  const [title, setTitle]             = useState(initial?.title ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [loading, setLoading]         = useState(false)

  const handleSave = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await onSave({ title: title.trim(), description: description.trim() || undefined })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Seriyi Düzenle' : 'Yeni Seri'}
      size="sm"
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Seri Adı"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Seri adını gir..."
        />
        <Textarea
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Bu seri hakkında..."
          rows={3}
        />

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="primary" onClick={handleSave} loading={loading} disabled={!title.trim()}>
            {initial ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
