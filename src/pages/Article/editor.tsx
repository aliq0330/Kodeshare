import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Clock, Tag, Plus, Bold, Italic,
  Link2, Code, Heading2, Heading3, Quote as QuoteIcon,
  Type, Heading1, Code2, Image as ImageIcon, Minus, Trash2,
  Check, Eye, X,
} from 'lucide-react'
import { useArticleStore, type BlockType, type ArticleBlock, genBlockId } from '@store/articleStore'

// ── Block insert toolbar ───────────────────────────────────────────────────────

const BLOCK_OPTIONS: { type: BlockType; icon: React.ElementType; label: string }[] = [
  { type: 'p',       icon: Type,      label: 'Metin'    },
  { type: 'h1',      icon: Heading1,  label: 'Başlık 1' },
  { type: 'h2',      icon: Heading2,  label: 'Başlık 2' },
  { type: 'h3',      icon: Heading3,  label: 'Başlık 3' },
  { type: 'quote',   icon: QuoteIcon, label: 'Alıntı'   },
  { type: 'code',    icon: Code2,     label: 'Kod'      },
  { type: 'image',   icon: ImageIcon, label: 'Görsel'   },
  { type: 'divider', icon: Minus,     label: 'Ayırıcı'  },
]

function BlockInsertToolbar({ onSelect, onClose }: { onSelect: (t: BlockType) => void; onClose: () => void }) {
  return (
    <div className="sticky top-[52px] z-30 border-b border-[#2a3347] bg-[#0a0f1a]/98 backdrop-blur-md">
      <div className="max-w-[680px] mx-auto px-4 flex items-center gap-1 py-2 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-gray-600 uppercase tracking-wider font-semibold mr-1 shrink-0">Blok:</span>
        {BLOCK_OPTIONS.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => onSelect(type)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#131c2e] hover:bg-[#1e2a3d] border border-[#2a3347] hover:border-brand-600/40 text-gray-300 hover:text-white text-xs font-medium transition-colors shrink-0 whitespace-nowrap"
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
        <button
          onClick={onClose}
          className="ml-2 w-7 h-7 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-[#1a2233] transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Block placeholders ─────────────────────────────────────────────────────────

const PLACEHOLDER: Record<BlockType, string> = {
  p:       'Yazmaya başla...',
  h1:      'Başlık 1',
  h2:      'Başlık 2',
  h3:      'Başlık 3',
  quote:   'Alıntı metni...',
  code:    'Kodu buraya yapıştır...',
  image:   'Görsel URL...',
  divider: '',
}

// ── Cursor helpers ─────────────────────────────────────────────────────────────

function placeCursorAtEnd(el: HTMLElement) {
  const range = document.createRange()
  const sel   = window.getSelection()
  range.selectNodeContents(el)
  range.collapse(false)
  sel?.removeAllRanges()
  sel?.addRange(range)
}

function placeCursorAtStart(el: HTMLElement) {
  const range = document.createRange()
  const sel   = window.getSelection()
  range.setStart(el, 0)
  range.collapse(true)
  sel?.removeAllRanges()
  sel?.addRange(range)
}

// ── Single block renderer ──────────────────────────────────────────────────────

interface BlockProps {
  block: ArticleBlock
  focused: boolean
  onInput: (id: string, html: string) => void
  onKeyDown: (id: string, e: React.KeyboardEvent<HTMLElement>) => void
  onFocus: () => void
  onDelete: () => void
  setRef: (id: string, el: HTMLElement | null) => void
}

function Block({ block, focused, onInput, onKeyDown, onFocus, onDelete, setRef }: BlockProps) {
  const elRef = useRef<HTMLElement>(null)

  const refCb = useCallback((el: HTMLElement | null) => {
    (elRef as React.MutableRefObject<HTMLElement | null>).current = el
    setRef(block.id, el)
  }, [block.id, setRef])

  // Set initial content only on mount
  useEffect(() => {
    if (elRef.current) elRef.current.innerHTML = block.content
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (block.type === 'divider') {
    return (
      <div className="relative group/div py-4">
        <hr className="border-[#2a3347]" />
        <button
          onClick={onDelete}
          className="absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover/div:opacity-100 p-1 rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  if (block.type === 'image') {
    return (
      <div className="relative group/img my-4">
        {block.content ? (
          <figure>
            <img
              src={block.content}
              alt=""
              className="w-full rounded-2xl object-cover max-h-96 border border-[#2a3347]"
              onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
            />
          </figure>
        ) : (
          <div
            ref={refCb as React.RefCallback<HTMLDivElement>}
            contentEditable
            suppressContentEditableWarning
            onInput={e => onInput(block.id, e.currentTarget.innerHTML)}
            onKeyDown={e => onKeyDown(block.id, e)}
            onFocus={onFocus}
            data-placeholder={PLACEHOLDER.image}
            className="w-full rounded-2xl border-2 border-dashed border-[#2a3347] p-8 text-center text-gray-600 outline-none focus:border-brand-600 transition-colors empty:before:content-[attr(data-placeholder)]"
          />
        )}
        <button
          onClick={onDelete}
          className="absolute top-2 right-2 opacity-0 group-hover/img:opacity-100 p-1.5 rounded-lg bg-[#0d1117]/80 hover:bg-red-900/40 text-gray-400 hover:text-red-400 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  const sharedProps = {
    contentEditable: true as const,
    suppressContentEditableWarning: true,
    onInput:   (e: React.FormEvent<HTMLElement>) => onInput(block.id, e.currentTarget.innerHTML),
    onKeyDown: (e: React.KeyboardEvent<HTMLElement>) => onKeyDown(block.id, e),
    onFocus,
    'data-placeholder': PLACEHOLDER[block.type],
    ref: refCb as React.RefCallback<HTMLElement>,
  }

  const emptyClass = 'empty:before:content-[attr(data-placeholder)] empty:before:text-gray-700 empty:before:pointer-events-none'

  if (block.type === 'h1')    return <h1    {...sharedProps as React.HTMLAttributes<HTMLHeadingElement>}    className={`text-3xl font-bold text-white outline-none py-1 leading-tight ${emptyClass}`} />
  if (block.type === 'h2')    return <h2    {...sharedProps as React.HTMLAttributes<HTMLHeadingElement>}    className={`text-2xl font-bold text-white outline-none py-1 leading-snug ${emptyClass}`} />
  if (block.type === 'h3')    return <h3    {...sharedProps as React.HTMLAttributes<HTMLHeadingElement>}    className={`text-xl font-semibold text-white outline-none py-0.5 ${emptyClass}`} />
  if (block.type === 'quote') return <blockquote {...sharedProps as React.HTMLAttributes<HTMLElement>} className={`border-l-[3px] border-brand-400 pl-4 italic text-gray-300 outline-none py-1 text-lg ${emptyClass}`} />
  if (block.type === 'code')  return <pre   {...sharedProps as React.HTMLAttributes<HTMLPreElement>}   className={`bg-[#0d1117] border border-[#2a3347] rounded-xl p-4 font-mono text-sm text-green-300 outline-none overflow-x-auto focus:border-brand-700/50 transition-colors ${emptyClass}`} />

  // paragraph (default)
  return <p {...sharedProps as React.HTMLAttributes<HTMLParagraphElement>} className={`text-gray-200 leading-relaxed outline-none py-0.5 text-[17px] ${emptyClass}`} />
}

// ── Main Editor ────────────────────────────────────────────────────────────────

export default function ArticleEditorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const { articles, create, save, publish } = useArticleStore()

  const [articleId, setArticleId]   = useState('')
  const [blocks,    setBlocks]      = useState<ArticleBlock[]>([])
  const [tags,      setTags]        = useState<string[]>([])
  const [saving,    setSaving]      = useState(false)
  const [savedAt,   setSavedAt]     = useState<string>('')
  const [showTags,  setShowTags]    = useState(false)
  const [tagInput,  setTagInput]    = useState('')
  const [focusedId,         setFocusedId]         = useState<string | null>(null)
  const [hoverAdd,          setHoverAdd]          = useState<string | null>(null)
  const [showFmtBar,        setShowFmtBar]        = useState(false)
  const [fmtBarPos,         setFmtBarPos]         = useState({ top: 0, left: 0 })
  const [blockToolbarOpen,  setBlockToolbarOpen]  = useState(false)
  const [toolbarInsertId,   setToolbarInsertId]   = useState<string | null>(null)

  // Uncontrolled content refs
  const titleRef    = useRef<HTMLDivElement>(null)
  const subtitleRef = useRef<HTMLDivElement>(null)
  const blockElems  = useRef<Map<string, HTMLElement>>(new Map())
  const blockConts  = useRef<Map<string, string>>(new Map())
  const saveTimer   = useRef<ReturnType<typeof setTimeout>>()

  const article = articles.find(a => a.id === articleId)

  // Init on mount
  useEffect(() => {
    const isNew = !id || id === 'new'
    if (!isNew) {
      const found = articles.find(a => a.id === id)
      if (!found) { navigate('/articles'); return }
      setArticleId(found.id)
      setBlocks(found.blocks)
      setTags(found.tags)
      found.blocks.forEach(b => blockConts.current.set(b.id, b.content))
    } else {
      const a = create()
      setArticleId(a.id)
      setBlocks(a.blocks)
      a.blocks.forEach(b => blockConts.current.set(b.id, b.content))
      navigate(`/article/${a.id}`, { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Set title/subtitle on first load
  useEffect(() => {
    if (!article) return
    if (titleRef.current    && !titleRef.current.innerHTML)    titleRef.current.innerHTML    = article.title
    if (subtitleRef.current && !subtitleRef.current.innerHTML) subtitleRef.current.innerHTML = article.subtitle
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [articleId])

  // ── Auto-save ──────────────────────────────────────────────────────────────

  const scheduleAutoSave = useCallback(() => {
    clearTimeout(saveTimer.current)
    setSaving(true)
    saveTimer.current = setTimeout(() => {
      if (!articleId) return
      const title    = titleRef.current?.innerHTML    ?? ''
      const subtitle = subtitleRef.current?.innerHTML ?? ''
      const current  = blocks.map(b => ({ ...b, content: blockConts.current.get(b.id) ?? b.content }))
      save(articleId, { title, subtitle, coverImage: '', blocks: current, tags })
      setSaving(false)
      const now = new Date()
      setSavedAt(`${now.getHours().toString().padStart(2,'0')}:${now.getMinutes().toString().padStart(2,'0')}`)
    }, 1200)
  }, [articleId, blocks, tags, save])

  // ── Block CRUD ─────────────────────────────────────────────────────────────

  const insertBlockAfter = useCallback((afterId: string, type: BlockType = 'p') => {
    const nb: ArticleBlock = { id: genBlockId(), type, content: '' }
    blockConts.current.set(nb.id, '')
    setBlocks(prev => {
      const idx  = prev.findIndex(b => b.id === afterId)
      const next = [...prev]
      next.splice(idx + 1, 0, nb)
      return next
    })
    setTimeout(() => {
      const el = blockElems.current.get(nb.id)
      if (el) { el.focus(); placeCursorAtStart(el) }
    }, 40)
    scheduleAutoSave()
  }, [scheduleAutoSave])

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => {
      if (prev.length <= 1) {
        // Clear instead of delete
        const el = blockElems.current.get(id)
        if (el) { el.innerHTML = ''; el.focus() }
        blockConts.current.set(id, '')
        return prev
      }
      const idx  = prev.findIndex(b => b.id === id)
      const next = prev.filter(b => b.id !== id)
      blockConts.current.delete(id)
      blockElems.current.delete(id)
      const focusIdx = Math.max(0, idx - 1)
      setTimeout(() => {
        const el = blockElems.current.get(next[focusIdx]?.id)
        if (el) { el.focus(); placeCursorAtEnd(el) }
      }, 40)
      return next
    })
    scheduleAutoSave()
  }, [scheduleAutoSave])

  const changeBlockType = useCallback((id: string, type: BlockType) => {
    const content = blockConts.current.get(id) ?? ''
    blockConts.current.set(id, type === 'divider' ? '' : content)
    setBlocks(prev => prev.map(b =>
      b.id !== id ? b : { ...b, type, content: blockConts.current.get(id) ?? '' }
    ))
    setTimeout(() => {
      const el = blockElems.current.get(id)
      if (el && type !== 'divider') { el.focus(); placeCursorAtStart(el) }
    }, 40)
    scheduleAutoSave()
  }, [scheduleAutoSave])

  // ── Handlers ───────────────────────────────────────────────────────────────

  const setRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) blockElems.current.set(id, el)
    else    blockElems.current.delete(id)
  }, [])

  const handleBlockInput = useCallback((id: string, html: string) => {
    blockConts.current.set(id, html)
    scheduleAutoSave()
  }, [scheduleAutoSave])

  const handleBlockKeyDown = useCallback((id: string, e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      const block = blocks.find(b => b.id === id)
      if (block?.type === 'code') return
      e.preventDefault()
      insertBlockAfter(id)
    } else if (e.key === 'Backspace') {
      const html = blockConts.current.get(id) ?? ''
      const text = html.replace(/<[^>]+>/g, '').trim()
      if (!text) { e.preventDefault(); deleteBlock(id) }
    }
  }, [blocks, insertBlockAfter, deleteBlock])

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.toString().trim()) { setShowFmtBar(false); return }
    const range = sel.getRangeAt(0)
    const rect  = range.getBoundingClientRect()
    setFmtBarPos({ top: rect.top - 52, left: rect.left + rect.width / 2 })
    setShowFmtBar(true)
  }, [])

  const execFmt = useCallback((cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    scheduleAutoSave()
  }, [scheduleAutoSave])

  const handlePublishToggle = () => {
    if (!article) return
    publish(article.id, !article.published)
  }

  const addTag = () => {
    const tag = tagInput.trim().replace(/^#/, '').toLowerCase()
    if (tag && !tags.includes(tag)) setTags(t => [...t, tag])
    setTagInput('')
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!article && articleId) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0d1117]">
        <div className="w-6 h-6 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const published = article?.published ?? false

  return (
    <div className="min-h-screen bg-[#0d1117] text-white" onMouseUp={handleMouseUp}>

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-40 h-13 border-b border-[#2a3347] bg-[#0d1117]/95 backdrop-blur-md flex items-center px-4 gap-3">
        <button
          onClick={() => navigate('/articles')}
          className="p-1.5 rounded-lg hover:bg-[#1e2535] text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="flex-1 flex items-center gap-2 min-w-0">
          <span className="text-sm text-gray-500 truncate">
            {article?.title
              ? article.title.replace(/<[^>]+>/g, '').slice(0, 50) || 'Yeni Makale'
              : 'Yeni Makale'}
          </span>
          {saving ? (
            <span className="text-xs text-gray-600 flex items-center gap-1 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Kaydediliyor...
            </span>
          ) : savedAt && (
            <span className="text-xs text-gray-600 shrink-0">· {savedAt}</span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {article && (
            <span className="text-xs text-gray-500 flex items-center gap-1 hidden sm:flex">
              <Clock className="w-3 h-3" /> {article.readingTime} dk okuma
            </span>
          )}
          <button
            onClick={() => setShowTags(s => !s)}
            className={`p-1.5 rounded-lg transition-colors ${showTags ? 'bg-brand-900/40 text-brand-400' : 'hover:bg-[#1e2535] text-gray-400 hover:text-white'}`}
            title="Etiketler"
          >
            <Tag className="w-4 h-4" />
          </button>
          {articleId && (
            <Link
              to={`/article/${articleId}/view`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:text-white hover:bg-[#1e2535] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Görüntüle</span>
            </Link>
          )}
          <button
            onClick={handlePublishToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              published
                ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30'
                : 'bg-brand-600 hover:bg-brand-500 text-white'
            }`}
          >
            {published ? <><Check className="w-3.5 h-3.5" /> Yayında</> : 'Yayınla'}
          </button>
        </div>
      </header>

      {/* ── Block insert toolbar ── */}
      {blockToolbarOpen && (
        <BlockInsertToolbar
          onSelect={type => {
            if (toolbarInsertId) insertBlockAfter(toolbarInsertId, type)
            setBlockToolbarOpen(false)
          }}
          onClose={() => setBlockToolbarOpen(false)}
        />
      )}

      {/* ── Tags bar ── */}
      {showTags && (
        <div className="border-b border-[#2a3347] px-6 py-2.5 flex items-center gap-2 flex-wrap bg-[#0d1117]">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 bg-brand-900/30 text-brand-300 text-xs px-2.5 py-1 rounded-full border border-brand-800/40">
              #{tag}
              <button onClick={() => { setTags(t => t.filter(x => x !== tag)); scheduleAutoSave() }} className="ml-0.5 hover:text-white leading-none">×</button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            onBlur={addTag}
            placeholder="Etiket yazıp Enter..."
            className="bg-transparent text-sm text-gray-300 outline-none placeholder-gray-600 min-w-[140px]"
          />
        </div>
      )}

      {/* ── Main content ── */}
      <main className="max-w-[680px] mx-auto px-6 py-14">

        {/* Title */}
        <div
          ref={titleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleAutoSave}
          data-placeholder="Başlık..."
          className="text-[2.6rem] font-bold text-white outline-none mb-3 leading-tight empty:before:content-[attr(data-placeholder)] empty:before:text-gray-700 empty:before:pointer-events-none"
        />

        {/* Subtitle */}
        <div
          ref={subtitleRef}
          contentEditable
          suppressContentEditableWarning
          onInput={scheduleAutoSave}
          data-placeholder="Alt başlık veya giriş cümlesi (isteğe bağlı)..."
          className="text-xl text-gray-400 outline-none mb-10 leading-relaxed empty:before:content-[attr(data-placeholder)] empty:before:text-gray-700 empty:before:pointer-events-none"
        />

        <div className="border-t border-[#2a3347] mb-10" />

        {/* Blocks */}
        <div className="space-y-1">
          {blocks.map((block) => (
            <div
              key={`${block.id}-${block.type}`}
              className="relative group/block"
              onMouseEnter={() => setHoverAdd(block.id)}
              onMouseLeave={() => setHoverAdd(null)}
            >
              {/* + button — desktop: hover only, mobile: always visible */}
              <button
                onClick={() => {
                  setToolbarInsertId(block.id)
                  setBlockToolbarOpen(true)
                }}
                className={`absolute -left-9 top-1 p-1 rounded-lg hover:bg-[#1e2535] text-gray-600 hover:text-gray-300 transition-all
                  lg:opacity-0 lg:group-hover/block:opacity-100 opacity-100`}
                title="Blok ekle"
              >
                <Plus className="w-4 h-4" />
              </button>

              <Block
                block={block}
                focused={focusedId === block.id}
                onInput={handleBlockInput}
                onKeyDown={handleBlockKeyDown}
                onFocus={() => setFocusedId(block.id)}
                onDelete={() => deleteBlock(block.id)}
                setRef={setRef}
              />
            </div>
          ))}
        </div>

        {/* Add block at end */}
        <button
          onClick={() => {
            setToolbarInsertId(blocks[blocks.length - 1]?.id ?? null)
            setBlockToolbarOpen(true)
          }}
          className="flex items-center gap-2 mt-6 text-gray-600 hover:text-gray-400 text-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Blok ekle
        </button>
      </main>

      {/* ── Floating format toolbar ── */}
      {showFmtBar && (
        <div
          className="fixed z-50 flex items-center gap-0.5 bg-[#131c2e] border border-[#2a3347] rounded-xl px-2 py-1.5 shadow-2xl pointer-events-auto"
          style={{ top: fmtBarPos.top, left: fmtBarPos.left, transform: 'translateX(-50%)' }}
          onMouseDown={e => e.preventDefault()}
        >
          {/* Arrow tip */}
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#131c2e] border-r border-b border-[#2a3347] rotate-45" />
          <FmtBtn onClick={() => execFmt('bold')}   title="Kalın (Ctrl+B)"><Bold className="w-3.5 h-3.5" /></FmtBtn>
          <FmtBtn onClick={() => execFmt('italic')} title="İtalik (Ctrl+I)"><Italic className="w-3.5 h-3.5" /></FmtBtn>
          <div className="w-px h-4 bg-[#2a3347] mx-1" />
          <FmtBtn onClick={() => execFmt('formatBlock', 'h2')} title="Başlık 2"><Heading2 className="w-3.5 h-3.5" /></FmtBtn>
          <FmtBtn onClick={() => execFmt('formatBlock', 'h3')} title="Başlık 3"><Heading3 className="w-3.5 h-3.5" /></FmtBtn>
          <FmtBtn onClick={() => execFmt('formatBlock', 'blockquote')} title="Alıntı"><QuoteIcon className="w-3.5 h-3.5" /></FmtBtn>
          <div className="w-px h-4 bg-[#2a3347] mx-1" />
          <FmtBtn
            onClick={() => {
              const url = prompt('Bağlantı URL:')
              if (url) execFmt('createLink', url)
            }}
            title="Bağlantı"
          >
            <Link2 className="w-3.5 h-3.5" />
          </FmtBtn>
          <FmtBtn
            onClick={() => {
              const sel = window.getSelection()?.toString()
              if (sel) execFmt('insertHTML', `<code style="background:#0d1117;padding:2px 6px;border-radius:4px;font-family:monospace;color:#86efac;font-size:0.875em">${sel}</code>`)
            }}
            title="Satır içi kod"
          >
            <Code className="w-3.5 h-3.5" />
          </FmtBtn>
        </div>
      )}

    </div>
  )
}

function FmtBtn({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className="p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#1e2a3d] transition-colors"
    >
      {children}
    </button>
  )
}
