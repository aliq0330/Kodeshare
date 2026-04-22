import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { ChevronDown, Copy, Check } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
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
  const [langOpen, setLangOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const lang = block.language ?? 'javascript'

  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: block.code ?? '',
        extensions: [
          basicSetup,
          getLangExt(lang),
          oneDark,
          EditorView.theme({
            '&': { borderRadius: '0', background: 'transparent' },
            '.cm-scroller': {
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13.5px',
              lineHeight: '1.65',
            },
            '.cm-gutters': { background: 'rgba(0,0,0,0.15)', borderRight: '1px solid rgba(255,255,255,0.05)' },
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

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code ?? '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const currentLang = LANGUAGES.find((l) => l.id === lang)?.label ?? lang

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10 bg-[#282c34]">
      {/* Code block header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
        {/* Language input / filename */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition-colors"
            >
              <span className="font-mono">{currentLang}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {langOpen && (
              <div className="absolute left-0 top-full mt-1 z-50 bg-[#1e2228] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => { updateBlock(block.id, { language: l.id }); setLangOpen(false) }}
                    className={cn(
                      'w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors',
                      l.id === lang ? 'text-brand-400' : 'text-gray-300',
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
            className="text-xs text-gray-500 bg-transparent border-none outline-none placeholder:text-gray-700 w-40"
          />
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>

      {/* CodeMirror editor */}
      <div ref={containerRef} className="min-h-[80px] overflow-x-auto" />
    </div>
  )
}
