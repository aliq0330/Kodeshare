import { useEffect, useRef, useState } from 'react'
import { IconBold, IconItalic, IconUnderline, IconStrikethrough, IconH1, IconH2, IconH3, IconPhoto, IconCode, IconQuote, IconMinus, IconBulb, IconPlus, IconAlignLeft, IconChevronDown, IconAt, IconHash, IconLoader2 } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { BlockType } from '@store/articleStore'
import { userService } from '@services/userService'
import type { User } from '@/types'

export const ADD_BLOCKS: { type: BlockType; label: string; icon: React.ReactNode; desc: string }[] = [
  { type: 'paragraph',  label: 'Paragraf',      icon: <IconAlignLeft className="w-4 h-4" />,   desc: 'Düz metin paragrafı' },
  { type: 'heading1',   label: 'Büyük Başlık',  icon: <IconH1 className="w-4 h-4" />,    desc: 'H1 — Ana başlık' },
  { type: 'heading2',   label: 'Orta Başlık',   icon: <IconH2 className="w-4 h-4" />,    desc: 'H2 — Alt başlık' },
  { type: 'heading3',   label: 'Küçük Başlık',  icon: <IconH3 className="w-4 h-4" />,    desc: 'H3 — Bölüm başlığı' },
  { type: 'image',      label: 'Görsel',         icon: <IconPhoto    className="w-4 h-4" />,    desc: 'Fotoğraf veya görsel ekle' },
  { type: 'code',       label: 'Kod Bloğu',      icon: <IconCode    className="w-4 h-4" />,    desc: 'Syntax highlighted kod' },
  { type: 'quote',      label: 'Alıntı',         icon: <IconQuote    className="w-4 h-4" />,    desc: 'Blok alıntı' },
  { type: 'callout',    label: 'Çağrı Kutusu',   icon: <IconBulb className="w-4 h-4" />,  desc: 'Renkli bildirim kutusu' },
  { type: 'divider',    label: 'Ayırıcı',        icon: <IconMinus    className="w-4 h-4" />,    desc: 'Bölüm ayırıcı' },
]

interface FormatBtnProps {
  label: string
  active?: boolean
  onClick: (e: React.MouseEvent) => void
  children: React.ReactNode
  className?: string
}

function FormatBtn({ label, active, onClick, children, className }: FormatBtnProps) {
  return (
    <button
      title={label}
      onMouseDown={(e) => { e.preventDefault(); onClick(e) }}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md text-sm font-medium transition-colors shrink-0',
        active
          ? 'bg-brand-500/20 text-brand-400'
          : 'text-gray-400 hover:text-white hover:bg-white/8',
        className,
      )}
    >
      {children}
    </button>
  )
}

export default function ArticleToolbar() {
  const { activeBlockId, blocks, addBlock, updateBlock } = useArticleStore()
  const [addOpen, setAddOpen]           = useState(false)
  const [mentionOpen, setMentionOpen]   = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [mentionResults, setMentionResults] = useState<User[]>([])
  const [mentionLoading, setMentionLoading] = useState(false)
  const [tagOpen, setTagOpen]           = useState(false)
  const [tagInput, setTagInput]         = useState('')
  const [fmt, setFmt] = useState({ bold: false, italic: false, underline: false, strikeThrough: false })

  const dropdownRef    = useRef<HTMLDivElement>(null)
  const mentionRef     = useRef<HTMLDivElement>(null)
  const tagRef         = useRef<HTMLDivElement>(null)
  const savedRangeRef  = useRef<Range | null>(null)

  const activeBlock = blocks.find((b) => b.id === activeBlockId)

  // ── Active inline formatting state ──────────────────────────────────────────
  useEffect(() => {
    const update = () => {
      try {
        setFmt({
          bold:         document.queryCommandState('bold'),
          italic:       document.queryCommandState('italic'),
          underline:    document.queryCommandState('underline'),
          strikeThrough:document.queryCommandState('strikeThrough'),
        })
      } catch { /* some browsers throw */ }
    }
    document.addEventListener('selectionchange', update)
    return () => document.removeEventListener('selectionchange', update)
  }, [])

  // ── Close dropdowns on outside click ────────────────────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setAddOpen(false)
      if (mentionRef.current  && !mentionRef.current.contains(e.target as Node))  setMentionOpen(false)
      if (tagRef.current      && !tagRef.current.contains(e.target as Node))      setTagOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // ── Load suggestions when mention opens; search on query change ─────────────
  useEffect(() => {
    if (!mentionOpen) { setMentionQuery(''); setMentionResults([]); return }
    userService.getSuggested().then(setMentionResults).catch(() => {})
  }, [mentionOpen])

  useEffect(() => {
    if (!mentionOpen) return
    const q = mentionQuery.trim()
    if (!q) return
    const t = setTimeout(() => {
      setMentionLoading(true)
      userService.search(q)
        .then(setMentionResults)
        .catch(() => {})
        .finally(() => setMentionLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [mentionQuery, mentionOpen])

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const saveRange = () => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRangeRef.current = sel.getRangeAt(0).cloneRange()
  }

  const restoreAndInsert = (html: string) => {
    // Re-focus the active block before inserting
    const blockEl = activeBlockId
      ? document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      : null
    blockEl?.focus()

    const sel = window.getSelection()
    if (sel && savedRangeRef.current) {
      sel.removeAllRanges()
      sel.addRange(savedRangeRef.current)
    }
    document.execCommand('insertHTML', false, html)

    requestAnimationFrame(() => {
      if (!activeBlockId) return
      const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      if (el) updateBlock(activeBlockId, { content: el.innerHTML })
    })
  }

  const insertMention = (user: User) => {
    setMentionOpen(false)
    restoreAndInsert(
      `<a href="/profile/${user.username}" data-mention="${user.username}" class="article-mention">@${user.username}</a>&nbsp;`
    )
  }

  const insertTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').replace(/\s+/g, '')
    if (!tag) return
    setTagOpen(false)
    setTagInput('')
    restoreAndInsert(
      `<a href="/explore?tag=${tag}" data-tag="${tag}" class="article-tag">#${tag}</a>&nbsp;`
    )
  }

  const execFormat = (cmd: string, value?: string) => {
    document.execCommand(cmd, false, value)
    requestAnimationFrame(() => {
      if (!activeBlockId) return
      const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
      if (el) updateBlock(activeBlockId, { content: el.innerHTML })
    })
  }

  const setBlockType = (type: BlockType) => {
    if (!activeBlockId) return
    if (['paragraph', 'heading1', 'heading2', 'heading3'].includes(type) && activeBlock)
      updateBlock(activeBlockId, { type })
  }

  const handleAddBlock = (type: BlockType) => {
    setAddOpen(false)
    const afterId = activeBlockId ?? (blocks.length > 0 ? blocks[blocks.length - 1].id : null)
    const newId = addBlock(afterId, type)
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>(`[data-block-id="${newId}"]`)?.focus()
    })
  }

  const isTextActive = activeBlock && ['paragraph', 'heading1', 'heading2', 'heading3'].includes(activeBlock.type)

  return (
    <>
      <div className="sticky top-14 z-30 bg-surface/95 backdrop-blur-md border-b border-surface-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="flex items-center h-12 gap-1">

            {/* ── Scrollable format buttons ─────────────────────────────── */}
            <div className="flex items-center gap-0.5 flex-1 overflow-x-auto scrollbar-hide min-w-0">
              <FormatBtn label="Kalın (⌘B)" active={fmt.bold} onClick={() => execFormat('bold')}>
                <IconBold className="w-4 h-4" />
              </FormatBtn>
              <FormatBtn label="İtalik (⌘I)" active={fmt.italic} onClick={() => execFormat('italic')}>
                <IconItalic className="w-4 h-4" />
              </FormatBtn>
              <FormatBtn label="Altı Çizili (⌘U)" active={fmt.underline} onClick={() => execFormat('underline')}>
                <IconUnderline className="w-4 h-4" />
              </FormatBtn>
              <FormatBtn label="Üstü Çizili" active={fmt.strikeThrough} onClick={() => execFormat('strikeThrough')}>
                <IconStrikethrough className="w-4 h-4" />
              </FormatBtn>

              <div className="w-px h-5 bg-surface-border mx-1 shrink-0" />

              <FormatBtn label="H1" active={activeBlock?.type === 'heading1'} onClick={() => setBlockType('heading1')} className="text-[11px] font-bold w-9">H1</FormatBtn>
              <FormatBtn label="H2" active={activeBlock?.type === 'heading2'} onClick={() => setBlockType('heading2')} className="text-[11px] font-bold w-9">H2</FormatBtn>
              <FormatBtn label="H3" active={activeBlock?.type === 'heading3'} onClick={() => setBlockType('heading3')} className="text-[11px] font-bold w-9">H3</FormatBtn>
              {isTextActive && (
                <FormatBtn label="Paragraf" active={activeBlock?.type === 'paragraph'} onClick={() => setBlockType('paragraph')} className="text-[11px] font-medium w-9">P</FormatBtn>
              )}

              <div className="w-px h-5 bg-surface-border mx-1 shrink-0" />

              <FormatBtn label="Link ekle" onClick={() => { const url = window.prompt('URL girin:'); if (url) execFormat('createLink', url) }}>
                <span className="text-[11px] font-medium">URL</span>
              </FormatBtn>
              <FormatBtn label="Satır içi kod" onClick={() => {
                const sel = window.getSelection()
                if (!sel || sel.isCollapsed) return
                const text = sel.toString()
                document.execCommand('insertHTML', false, `<code style="font-family:monospace;background:rgba(255,255,255,0.1);padding:1px 5px;border-radius:4px">${text}</code>`)
                if (activeBlockId) {
                  const el = document.querySelector<HTMLElement>(`[data-block-id="${activeBlockId}"]`)
                  if (el) updateBlock(activeBlockId, { content: el.innerHTML })
                }
              }}>
                <IconCode className="w-4 h-4" />
              </FormatBtn>
            </div>

            {/* ── @mention picker ──────────────────────────────────────── */}
            <div ref={mentionRef} className="relative shrink-0">
              <FormatBtn
                label="@mention ekle"
                active={mentionOpen}
                onClick={() => { saveRange(); setMentionOpen((v) => !v); setTagOpen(false) }}
                className="w-8"
              >
                <IconAt className="w-4 h-4" />
              </FormatBtn>

              {mentionOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-72 bg-surface-card border border-surface-border rounded-xl shadow-2xl">
                  <div className="p-2 border-b border-surface-border">
                    <input
                      autoFocus
                      value={mentionQuery}
                      onChange={(e) => setMentionQuery(e.target.value)}
                      placeholder="Kullanıcı ara..."
                      className="w-full bg-surface-raised rounded-lg px-3 py-1.5 text-sm text-white outline-none placeholder:text-gray-500"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto p-1.5">
                    {mentionLoading && (
                      <div className="flex items-center justify-center py-4">
                        <IconLoader2 className="w-4 h-4 animate-spin text-gray-500" />
                      </div>
                    )}
                    {!mentionLoading && mentionResults.length === 0 && (
                      <p className="text-xs text-gray-500 px-3 py-2 text-center">
                        {mentionQuery ? 'Sonuç bulunamadı' : 'Kullanıcı bulunamadı'}
                      </p>
                    )}
                    {mentionResults.map((user) => (
                      <button
                        key={user.id}
                        onMouseDown={(e) => { e.preventDefault(); insertMention(user) }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-raised transition-colors text-left"
                      >
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-surface-raised flex items-center justify-center shrink-0 text-xs font-medium text-gray-400">
                            {user.username[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-white truncate">{user.displayName}</span>
                          <span className="block text-xs text-gray-500">@{user.username}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── #tag picker ──────────────────────────────────────────── */}
            <div ref={tagRef} className="relative shrink-0">
              <FormatBtn
                label="#tag ekle"
                active={tagOpen}
                onClick={() => { saveRange(); setTagOpen((v) => !v); setMentionOpen(false) }}
                className="w-8"
              >
                <IconHash className="w-4 h-4" />
              </FormatBtn>

              {tagOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-52 bg-surface-card border border-surface-border rounded-xl shadow-2xl p-2">
                  <input
                    autoFocus
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); insertTag(tagInput) } }}
                    placeholder="etiket adı..."
                    className="w-full bg-surface-raised rounded-lg px-3 py-1.5 text-sm text-white outline-none placeholder:text-gray-500"
                  />
                  <button
                    onMouseDown={(e) => { e.preventDefault(); insertTag(tagInput) }}
                    className="mt-2 w-full py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors"
                  >
                    Ekle
                  </button>
                </div>
              )}
            </div>

            {/* ── Add block button ─────────────────────────────────────── */}
            <div ref={dropdownRef} className="relative shrink-0">
              <button
                onMouseDown={(e) => { e.preventDefault(); setAddOpen((v) => !v) }}
                className={cn(
                  'flex items-center gap-1.5 h-8 px-3 rounded-lg text-sm font-medium transition-colors',
                  'bg-brand-500 hover:bg-brand-600 text-white',
                )}
              >
                <IconPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Blok Ekle</span>
                <IconChevronDown className={cn('w-3 h-3 transition-transform', addOpen && 'rotate-180')} />
              </button>

              {addOpen && (
                <div className="absolute right-0 top-full mt-1 z-50 w-64 bg-surface-card border border-surface-border rounded-xl shadow-2xl overflow-y-auto max-h-[70vh]">
                  <div className="p-1.5">
                    {ADD_BLOCKS.map((b) => (
                      <button
                        key={b.type}
                        onMouseDown={(e) => { e.preventDefault(); handleAddBlock(b.type) }}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-raised transition-colors text-left"
                      >
                        <span className="shrink-0 mt-0.5 p-1.5 rounded-md bg-surface-raised text-gray-400">{b.icon}</span>
                        <span>
                          <span className="block text-sm font-medium text-gray-200">{b.label}</span>
                          <span className="block text-xs text-gray-500 mt-0.5">{b.desc}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
