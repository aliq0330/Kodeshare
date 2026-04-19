import { useState, useEffect } from 'react'
import { X, Pencil } from 'lucide-react'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { postService } from '@services/postService'
import toast from 'react-hot-toast'
import type { Post, PostPreview } from '@/types'

interface EditFile {
  id: string
  name: string
  language: SnippetLang
  content: string
  order: number
}

interface EditPostModalProps {
  open: boolean
  onClose: () => void
  post: Post | PostPreview
  onSaved: (updated: { title: string; description: string | null; tags: string[] }) => void
}

const VALID_LANGS: SnippetLang[] = ['javascript', 'css', 'html']
function toSnippetLang(lang: string): SnippetLang {
  return VALID_LANGS.includes(lang as SnippetLang) ? (lang as SnippetLang) : 'javascript'
}

export default function EditPostModal({ open, onClose, post, onSaved }: EditPostModalProps) {
  const [title, setTitle]             = useState(post.title)
  const [description, setDescription] = useState(post.description ?? '')
  const [tagsInput, setTagsInput]     = useState(post.tags.join(', '))
  const [files, setFiles]             = useState<EditFile[]>([])
  const [filesLoading, setFilesLoading] = useState(false)
  const [expandedId, setExpandedId]   = useState<string | null>(null)
  const [loading, setLoading]         = useState(false)

  const hasCode = post.type === 'snippet' || post.type === 'project'

  useEffect(() => {
    if (!open || !hasCode) return

    // If we already have full file content (Post type from PostDetail)
    const fullPost = post as Post
    if (fullPost.files?.length) {
      setFiles(fullPost.files.map((f) => ({
        id:       f.id,
        name:     f.name,
        language: toSnippetLang(f.language),
        content:  f.content,
        order:    f.order,
      })))
      return
    }

    // Otherwise fetch (PostPreview from PostCard)
    setFilesLoading(true)
    postService.getPost(post.id)
      .then((p) => {
        setFiles(p.files.map((f) => ({
          id:       f.id,
          name:     f.name,
          language: toSnippetLang(f.language),
          content:  f.content,
          order:    f.order,
        })))
      })
      .catch(() => toast.error('Dosyalar yüklenemedi'))
      .finally(() => setFilesLoading(false))
  }, [open, hasCode, post.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null

  const updateFile = (id: string, patch: Partial<EditFile>) =>
    setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, ...patch } : f)))

  const handleSave = async () => {
    if (!title.trim()) { toast.error('Başlık boş olamaz'); return }
    setLoading(true)
    try {
      const tags = tagsInput.split(/[,\s]+/).map((t) => t.trim().toLowerCase()).filter(Boolean)
      await postService.editPost(post.id, {
        title: title.trim(),
        description: description.trim() || undefined,
        tags,
        files: hasCode && files.length
          ? files.map((f, i) => ({ name: f.name, language: f.language, content: f.content, order: i }))
          : undefined,
      })
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
      <div className={`relative w-full ${hasCode ? 'max-w-2xl' : 'max-w-md'} card shadow-2xl flex flex-col gap-5 p-5 animate-slide-up max-h-[90vh] overflow-y-auto`}>
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

        <Input
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Gönderi başlığı"
        />
        <Textarea
          label={post.type === 'article' ? 'İçerik' : 'Açıklama'}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={post.type === 'article' ? 'Makale içeriğini yaz...' : 'Kısa açıklama...'}
          rows={post.type === 'article' ? 6 : 3}
        />
        <Input
          label="Etiketler"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="javascript, react, css  (virgülle ayır)"
        />

        {/* Code editors for snippet / project */}
        {hasCode && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-gray-400">Kod</label>
            {filesLoading ? (
              <div className="flex justify-center py-6"><Spinner /></div>
            ) : files.map((file, idx) => (
              <div key={file.id} className="flex flex-col gap-1.5">
                {files.length > 1 && (
                  <p className="text-[11px] font-medium text-gray-500">{file.name}</p>
                )}
                <SnippetCodeEditor
                  value={file.content}
                  onChange={(v) => updateFile(file.id, { content: v })}
                  language={file.language}
                  onLanguageChange={(l) => updateFile(file.id, { language: l })}
                  expanded={expandedId === file.id}
                  onToggleExpand={() => setExpandedId((cur) => (cur === file.id ? null : file.id))}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1 border-t border-surface-border">
          <Button variant="ghost" size="sm" onClick={onClose}>İptal</Button>
          <Button variant="primary" size="sm" loading={loading} onClick={handleSave}>Kaydet</Button>
        </div>
      </div>
    </div>
  )
}
