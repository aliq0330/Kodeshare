import { useEffect, useRef, useState } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { githubLight } from '@uiw/codemirror-theme-github'
import { Copy, Check } from 'lucide-react'
import { useIsLightMode } from '@hooks/useIsLightMode'
import type { ArticleBlock } from '@store/articleStore'

function getLangExt(lang: string) {
  if (lang === 'html') return html()
  if (lang === 'css') return css()
  if (lang === 'typescript') return javascript({ typescript: true })
  if (lang === 'javascript') return javascript()
  return []
}

export default function CodeBlockPreview({ block }: { block: ArticleBlock }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [copied, setCopied] = useState(false)
  const isLight = useIsLightMode()
  const lang = block.language ?? 'javascript'

  useEffect(() => {
    if (!containerRef.current) return
    const bg = isLight ? '#ffffff' : '#282c34'
    const view = new EditorView({
      state: EditorState.create({
        doc: block.code ?? '',
        extensions: [
          getLangExt(lang),
          isLight ? githubLight : oneDark,
          EditorView.editable.of(false),
          EditorState.readOnly.of(true),
          EditorView.theme({
            '&': { borderRadius: '0', background: `${bg} !important` },
            '.cm-scroller': {
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              fontSize: '13.5px',
              lineHeight: '1.65',
            },
            '.cm-content': { padding: '12px 0' },
            '.cm-cursor': { display: 'none !important' },
          }),
        ],
      }),
      parent: containerRef.current,
    })
    return () => view.destroy()
  }, [block.id, lang, block.code, isLight])

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code ?? '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const containerBg     = isLight ? '#ffffff' : '#282c34'
  const containerBorder = isLight ? '#d0d7de' : '#30363d'
  const headerBg        = isLight ? '#f6f8fa' : '#1e2228'
  const headerBorder    = isLight ? '#d0d7de' : '#21262d'
  const labelColor      = isLight ? '#57606a' : '#8b9ab5'
  const copyIdle        = isLight ? 'text-gray-500 hover:text-gray-800' : 'text-gray-500 hover:text-gray-300'

  return (
    <div
      className="my-2 rounded-xl overflow-hidden border"
      style={{ background: containerBg, borderColor: containerBorder }}
    >
      <div
        className="flex items-center justify-between px-4 py-2 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono" style={{ color: labelColor }}>{lang}</span>
          {block.filename && <span className="text-xs" style={{ color: labelColor }}>{block.filename}</span>}
        </div>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 text-xs transition-colors ${copyIdle}`}
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>
      <div ref={containerRef} className="min-h-[60px] overflow-x-auto" />
    </div>
  )
}
