import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { githubLight } from '@uiw/codemirror-theme-github'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import { useIsLightMode } from '@hooks/useIsLightMode'
import type { ArticleBlock } from '@store/articleStore'

const LANGUAGES = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'typescript', label: 'TypeScript' },
  { id: 'html', label: 'HTML' },
  { id: 'css', label: 'CSS' },
  { id: 'text', label: 'Düz Metin' },
]

function getLangExt(lang: string) {
  if (lang === 'html') return html()
  if (lang === 'css') return css()
  if (lang === 'typescript') return javascript({ typescript: true })
  if (lang === 'javascript') return javascript()
  return []
}

interface Props {
  block: ArticleBlock
}

export default function CodeBlock({ block }: Props) {
  const { updateBlock } = useArticleStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const themeCompartment = useRef(new Compartment())
  const [langOpen, setLangOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const isLight = useIsLightMode()
  const lang = block.language ?? 'javascript'

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: block.code ?? '',
        extensions: [
          basicSetup,
          getLangExt(lang),
          themeCompartment.current.of(isLight ? githubLight : oneDark),
          EditorView.theme({
            '&': { borderRadius: '0', background: 'transparent' },
            '.cm-scroller': {
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13.5px',
              lineHeight: '1.65',
            },
            '.cm-gutters': {
              background: 'transparent',
              borderRight: '1px solid rgba(128,128,128,0.2)',
            },
            '.cm-content': { padding: '12px 0' },
          }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) updateBlock(block.id, { code: u.state.doc.toString() })
          }),
        ],
      }),
      parent: containerRef.current,
    })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [block.id, lang])

  // Swap theme dynamically without destroying the editor
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(isLight ? githubLight : oneDark),
    })
  }, [isLight])

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code ?? '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const currentLang = LANGUAGES.find((l) => l.id === lang)?.label ?? lang

  const containerBg     = isLight ? '#ffffff' : '#282c34'
  const containerBorder = isLight ? '#d0d7de' : '#30363d'
  const headerBg        = isLight ? '#f6f8fa' : '#1e2228'
  const headerBorder    = isLight ? '#d0d7de' : '#21262d'
  const labelColor      = isLight ? '#57606a' : '#8b9ab5'
  const dropdownBg      = isLight ? '#ffffff' : '#1e2228'
  const dropdownBorder  = isLight ? '#d0d7de' : 'rgba(255,255,255,0.1)'
  const copyIdle        = isLight ? 'text-gray-500 hover:text-gray-800' : 'text-gray-500 hover:text-gray-300'

  return (
    <div
      className="my-2 rounded-xl overflow-hidden border"
      style={{ background: containerBg, borderColor: containerBorder }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: labelColor }}
            >
              <span className="font-mono">{currentLang}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {langOpen && (
              <div
                className="absolute left-0 top-full mt-1 z-50 rounded-lg shadow-xl overflow-hidden min-w-[140px] border"
                style={{ background: dropdownBg, borderColor: dropdownBorder }}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { updateBlock(block.id, { language: l.id }); setLangOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs transition-colors',
                      isLight
                        ? (l.id === lang ? 'text-brand-600 bg-brand-50' : 'text-gray-700 hover:bg-black/5')
                        : (l.id === lang ? 'text-brand-400' : 'text-gray-300 hover:bg-white/5'),
                    )}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <input
            type="text"
            value={block.filename ?? ''}
            onChange={(e) => updateBlock(block.id, { filename: e.target.value })}
            placeholder="dosya adı (isteğe bağlı)"
            className="text-xs bg-transparent border-none outline-none w-40"
            style={{ color: labelColor, opacity: 0.7 }}
          />
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs transition-colors ${copyIdle}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>

      {/* Editor */}
      <div ref={containerRef} className="min-h-[80px] overflow-x-auto" />
    </div>
  )
}
