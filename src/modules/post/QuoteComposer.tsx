import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '@components/ui/Modal'
import Button from '@components/ui/Button'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Avatar from '@components/ui/Avatar'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { postService } from '@services/postService'
import { usePostStore } from '@store/postStore'
import { LANGUAGE_COLORS } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostPreview } from '@/types'

interface QuoteComposerProps {
  open: boolean
  onClose: () => void
  post: PostPreview | null
}

const EXT_MAP: Record<SnippetLang, string> = {
  javascript: 'js',
  css: 'css',
  html: 'html',
}

export default function QuoteComposer({ open, onClose, post }: QuoteComposerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<SnippetLang>('javascript')
  const [expanded, setExpanded] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(''); setDescription(''); setTags(''); setCode(''); setLanguage('javascript')
  }, [open])

  if (!post) return null

  const handleSubmit = async () => {
    const t = title.trim()
    if (!t) { toast.error('Başlık gerekli'); return }
    setLoading(true)
    try {
      const files = code.trim()
        ? [{ name: `snippet.${EXT_MAP[language]}`, language, content: code, order: 0 }]
        : []
      await postService.quote({
        title: t,
        description: description.trim() || undefined,
        tags: tags.split(',').map((x) => x.trim()).filter(Boolean),
        files,
        repostedFrom: post.id,
      })
      usePostStore.setState((s) => ({
        posts: s.posts.map((p) =>
          p.id === post.id ? { ...p, repostCount: p.repostCount + 1 } : p,
        ),
      }))
      toast.success('Alıntı paylaşıldı!')
      onClose()
    } catch (err) {
      toast.error((err as Error).message || 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Alıntı ile Paylaş" size="lg">
      <div className="flex flex-col gap-4">
        <Input
          label="Başlık"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Bu alıntıya ne katıyorsun?"
        />
        <Textarea
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Kendi yorumunu ekle..."
          rows={3}
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-gray-400">Snippet (opsiyonel)</label>
          <SnippetCodeEditor
            value={code}
            onChange={setCode}
            language={language}
            onLanguageChange={setLanguage}
            expanded={expanded}
            onToggleExpand={() => setExpanded((v) => !v)}
          />
        </div>

        <Input
          label="Etiketler"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="react, css, ... (virgülle ayır)"
        />

        {/* Embedded original post */}
        <div className="rounded-xl border border-surface-border bg-surface-raised/40 p-3">
          <div className="text-[11px] uppercase tracking-widest text-gray-500 mb-2">Alıntılanan Gönderi</div>
          <div className="flex items-center gap-2.5 mb-2">
            <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="sm" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-white truncate">{post.author.displayName}</p>
              <p className="text-xs text-gray-500 truncate">@{post.author.username}</p>
            </div>
          </div>
          <Link to={`/post/${post.id}`} className="block">
            <p className="text-sm font-semibold text-white line-clamp-2">{post.title}</p>
            {post.description && (
              <p className="text-xs text-gray-400 line-clamp-2 mt-1">{post.description}</p>
            )}
            {post.snippetPreview && (
              <pre
                className="mt-2 text-[11px] font-mono bg-[#0d1117] rounded-md p-2 overflow-hidden max-h-24 whitespace-pre-wrap"
                style={{ color: LANGUAGE_COLORS[post.snippetLanguage ?? ''] ?? '#8b9ab5' }}
              >
                {post.snippetPreview.slice(0, 220)}
              </pre>
            )}
          </Link>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-surface-border">
          <Button variant="ghost" onClick={onClose}>İptal</Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading} disabled={!title.trim()}>
            Paylaş
          </Button>
        </div>
      </div>
    </Modal>
  )
}
