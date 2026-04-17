import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Image, Link2, X } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useEditorStore } from '@store/editorStore'
import { POST_TYPES } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostType } from '@/types'

export default function PostComposer() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createPost } = usePostStore()
  const { setProjectTitle } = useEditorStore()

  const [open, setOpen] = useState(false)
  const [postType, setPostType] = useState<PostType>('snippet')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [previewImageUrl, setPreviewImageUrl] = useState('')
  const [liveDemoUrl, setLiveDemoUrl] = useState('')
  const [showImageInput, setShowImageInput] = useState(false)
  const [showDemoInput, setShowDemoInput] = useState(false)
  const [loading, setLoading] = useState(false)

  const reset = () => {
    setTitle('')
    setDescription('')
    setTags('')
    setPreviewImageUrl('')
    setLiveDemoUrl('')
    setShowImageInput(false)
    setShowDemoInput(false)
    setPostType('snippet')
  }

  const handleClose = () => {
    setOpen(false)
    reset()
  }

  const handleOpenInEditor = () => {
    setProjectTitle(title.trim() || 'Yeni Proje')
    setOpen(false)
    reset()
    navigate('/editor')
  }

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
        previewImageUrl: previewImageUrl.trim() || undefined,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
      })
      toast.success('Gönderi paylaşıldı!')
      handleClose()
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

      <Modal open={open} onClose={handleClose} title="Yeni Gönderi" size="lg">
        <div className="flex flex-col gap-4">
          {/* Type selector */}
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
            label={postType === 'article' ? 'İçerik' : 'Açıklama'}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={postType === 'article' ? 'Makale içeriğini yaz...' : 'Ne yaptığını anlat...'}
            rows={postType === 'article' ? 6 : 3}
          />

          <Input
            label="Etiketler"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, css, animation (virgülle ayır)"
          />

          {/* Inline inputs for image and demo URL */}
          {showImageInput && (
            <div className="flex items-center gap-2">
              <Input
                label="Görsel URL"
                value={previewImageUrl}
                onChange={(e) => setPreviewImageUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <button
                onClick={() => { setShowImageInput(false); setPreviewImageUrl('') }}
                className="mt-6 p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {showDemoInput && (
            <div className="flex items-center gap-2">
              <Input
                label="Demo URL"
                value={liveDemoUrl}
                onChange={(e) => setLiveDemoUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1"
              />
              <button
                onClick={() => { setShowDemoInput(false); setLiveDemoUrl('') }}
                className="mt-6 p-1.5 text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-500"
              onClick={handleOpenInEditor}
            >
              <Code2 className="w-4 h-4" />
              Editörde Aç
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={showImageInput ? 'text-brand-400' : 'text-gray-500'}
              onClick={() => setShowImageInput((v) => !v)}
            >
              <Image className="w-4 h-4" />
              Görsel
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={showDemoInput ? 'text-brand-400' : 'text-gray-500'}
              onClick={() => setShowDemoInput((v) => !v)}
            >
              <Link2 className="w-4 h-4" />
              Demo URL
            </Button>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
            <Button variant="ghost" onClick={handleClose}>İptal</Button>
            <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!title.trim()}>
              Paylaş
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
