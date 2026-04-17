import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Code2, Image, Link2, Maximize2, X } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Modal from '@components/ui/Modal'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import SnippetCodeEditor, { type SnippetLang } from './SnippetCodeEditor'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useEditorStore } from '@store/editorStore'
import { POST_TYPES } from '@utils/constants'
import toast from 'react-hot-toast'
import type { PostType } from '@/types'

const DRAFT_KEY = 'kodeshare:composer-draft'
const DEFAULT_LANG: SnippetLang = 'javascript'

const EXT_MAP: Record<SnippetLang, string> = {
  javascript: 'js',
  css:        'css',
  html:       'html',
}

// Etiketlere göre dil tahmini — kullanıcı diyalogdan manuel seçmediyse tetiklenir.
const TAG_TO_LANG: Record<string, SnippetLang> = {
  js: 'javascript', javascript: 'javascript', node: 'javascript',
  jsx: 'javascript', ts: 'javascript', typescript: 'javascript',
  react: 'javascript', vue: 'javascript',
  css: 'css', sass: 'css', scss: 'css', tailwind: 'css',
  html: 'html',
}

interface Draft {
  postType: PostType
  title: string
  description: string
  tags: string
  code: string
  language: SnippetLang
}

function loadDraft(): Partial<Draft> | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function saveDraft(d: Draft) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(d)) } catch { /* kota dolu olabilir */ }
}

function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch { /* noop */ }
}

function detectLangFromTags(tags: string): SnippetLang | null {
  const parts = tags.toLowerCase().split(',').map((t) => t.trim()).filter(Boolean)
  for (const p of parts) if (TAG_TO_LANG[p]) return TAG_TO_LANG[p]
  return null
}

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

  // Snippet kod alanı durumu
  const [code, setCode]           = useState('')
  const [language, setLanguage]   = useState<SnippetLang>(DEFAULT_LANG)
  const [langManual, setLangManual] = useState(false)
  const [expanded, setExpanded]   = useState(false)

  // Taslak geri yükle (modal ilk açıldığında)
  const hydratedRef = useRef(false)
  useEffect(() => {
    if (!open || hydratedRef.current) return
    hydratedRef.current = true
    const d = loadDraft()
    if (!d) return
    if (d.postType) setPostType(d.postType)
    if (d.title)       setTitle(d.title)
    if (d.description) setDescription(d.description)
    if (d.tags)        setTags(d.tags)
    if (d.code)        setCode(d.code)
    if (d.language)  { setLanguage(d.language); setLangManual(true) }
  }, [open])

  // Taslağı otomatik kaydet — snippet sekmesinde anlamlı alan varsa
  useEffect(() => {
    if (!open) return
    const hasContent = title || description || tags || code
    if (!hasContent) return
    saveDraft({ postType, title, description, tags, code, language })
  }, [open, postType, title, description, tags, code, language])

  // Etiketlerden dil algıla (kullanıcı manuel seçmediyse)
  useEffect(() => {
    if (langManual) return
    const detected = detectLangFromTags(tags)
    if (detected && detected !== language) setLanguage(detected)
  }, [tags, langManual, language])

  // ESC expanded modunda önce onu kapatsın
  useEffect(() => {
    if (!expanded) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); setExpanded(false) } }
    document.addEventListener('keydown', h, true)
    return () => document.removeEventListener('keydown', h, true)
  }, [expanded])

  const handleLanguageChange = (lang: SnippetLang) => {
    setLanguage(lang)
    setLangManual(true)
  }

  const reset = () => {
    setTitle('')
    setDescription('')
    setTags('')
    setPreviewImageUrl('')
    setLiveDemoUrl('')
    setShowImageInput(false)
    setShowDemoInput(false)
    setPostType('snippet')
    setCode('')
    setLanguage(DEFAULT_LANG)
    setLangManual(false)
    setExpanded(false)
    hydratedRef.current = false
  }

  const handleClose = () => {
    setOpen(false)
    // Taslağı sakla (modal kapandıktan sonra geri döndüğünde geri yüklenebilsin)
    // reset formu — state temizle ama localStorage korunsun
    setExpanded(false)
    hydratedRef.current = false
  }

  const handleOpenInEditor = () => {
    // Snippet sekmesinde butonu inline genişletme toggle'ı yap
    if (postType === 'snippet') {
      setExpanded((v) => !v)
      return
    }
    setProjectTitle(title.trim() || 'Yeni Proje')
    setOpen(false)
    reset()
    clearDraft()
    navigate('/editor')
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setLoading(true)
    try {
      const files =
        postType === 'snippet' && code.trim()
          ? [{
              name:     `snippet.${EXT_MAP[language]}`,
              language,
              content:  code,
              order:    0,
            }]
          : []

      await createPost({
        type: postType,
        title: title.trim(),
        description: description.trim() || undefined,
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        files,
        previewImageUrl: previewImageUrl.trim() || undefined,
        liveDemoUrl: liveDemoUrl.trim() || undefined,
      })
      toast.success('Gönderi paylaşıldı!')
      clearDraft()
      reset()
      setOpen(false)
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

          {/* Snippet kod editörü */}
          {postType === 'snippet' && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-400">Kod</label>
              <SnippetCodeEditor
                value={code}
                onChange={setCode}
                language={language}
                onLanguageChange={handleLanguageChange}
                expanded={expanded}
                onToggleExpand={() => setExpanded((v) => !v)}
              />
              <p className="text-[11px] text-gray-600">
                Tab ile girinti, Ctrl/Cmd+Z ile geri al. Taslağın otomatik kaydedilir.
              </p>
            </div>
          )}

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
              className={postType === 'snippet' && expanded ? 'text-brand-400' : 'text-gray-500'}
              onClick={handleOpenInEditor}
            >
              {postType === 'snippet' ? <Maximize2 className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
              {postType === 'snippet'
                ? (expanded ? 'Küçült' : 'Editörde Aç')
                : 'Editörde Aç'}
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
