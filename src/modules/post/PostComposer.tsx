import { useState } from 'react'
import { Code2, Image, Link2 } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { POST_TYPES } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostType } from '@/types'

export default function PostComposer() {
  const { user } = useAuthStore()
  const { createPost } = usePostStore()
  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState<PostType>('snippet')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      await createPost({
        type: postType,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        files: [],
      })
      toast.success('Gönderi paylaşıldı!')
      setOpen(false)
      setTitle('')
      setDescription('')
      setTags('')
      setPostType('snippet')
    } catch (err) {
      toast.error((err as Error).message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className="card p-4 flex items-center gap-3 cursor-pointer hover:border-surface-raised transition-colors"
        onClick={() => setOpen(true)}
      >
        <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="sm" />
        <span className="flex-1 text-sm text-gray-500 bg-surface-raised rounded-lg px-4 py-2 hover:bg-surface-border transition-colors">
          Ne paylaşmak istiyorsun?
        </span>
        <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); setOpen(true) }}>
          <Code2 className="w-4 h-4" />
          Kod Paylaş
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Yeni Gönderi" size="lg">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            {POST_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPostType(t.id as PostType)}
                className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  postType === t.id
                    ? 'border-brand-500 bg-brand-900/20 text-brand-300'
                    : 'border-surface-border text-gray-500 hover:border-surface-raised hover:text-gray-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <Input
            label="Başlık"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Projenin adı..."
          />

          <Textarea
            label="Açıklama"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ne yaptığını anlat..."
            rows={3}
          />

          <Input
            label="Etiketler"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, css, animation (virgülle ayır)"
          />

          <div className="flex gap-2 pt-1">
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Code2 className="w-4 h-4" />
              Editörde Aç
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Image className="w-4 h-4" />
              Görsel
            </Button>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Link2 className="w-4 h-4" />
              Demo URL
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!title.trim()}>
              Paylaş
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
