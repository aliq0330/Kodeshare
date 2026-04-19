import { useState } from 'react'
import { X, Pencil } from 'lucide-react'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import { postService } from '@services/postService'
import toast from 'react-hot-toast'
import type { Post, PostPreview } from '@/types'

interface EditPostModalProps {
  open: boolean
  onClose: () => void
  post: Post | PostPreview
  onSaved: (updated: { title: string; description: string | null; tags: string[] }) => void
}

export default function EditPostModal({ open, onClose, post, onSaved }: EditPostModalProps) {
  const [title, setTitle]           = useState(post.title)
  const [description, setDescription] = useState(post.description ?? '')
  const [tagsInput, setTagsInput]   = useState(post.tags.join(', '))
  const [loading, setLoading]       = useState(false)

  if (!open) return null

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Başlık boş olamaz'); return }
    setLoading(true)
    try {
      const tags = tagsInput.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean)
      await postService.editPost(post.id, { title: title.trim(), description: description.trim() || undefined, tags })
      onSaved({ title: title.trim(), description: description.trim() || null, tags })
      toast.success('Gönderi güncellendi')
      onClose()
    } catch (e: any) {
      toast.error(e?.message ?? 'Güncellenemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md card shadow-2xl flex flex-col gap-5 p-5 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-white">Gönderiyi Düzenle</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <Input
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gönderi başlığı"
        />
        <Textarea
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kısa açıklama..."
          rows={3}
        />
        <Input
          label="Etiketler"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="javascript, react, css  (virgülle ayır)"
        />

        <div className="flex justify-end gap-2 pt-1 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>Kaydet</Button>
        </div>
      </div>
    </div>
  )
}
