import { useEffect, useRef } from 'react'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { Copy, Check } from 'lucide-react'
import { useState } from 'react'
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
  const lang = block.language ?? 'javascript'

  useEffect(() => {
    if (!containerRef.current) return
    const view = new EditorView({
      state: EditorState.create({
        doc: block.code ?? '',
        extensions: [
          getLangExt(lang),
          oneDark,
          EditorView.editable.of(false),
          EditorState.readOnly.of(true),
          EditorView.theme({
            '&': { borderRadius: '0', background: 'transparent' },
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
  }, [block.id, lang, block.code])

  const handleCopy = () => {
    navigator.clipboard.writeText(block.code ?? '').then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="my-2 rounded-xl overflow-hidden border border-white/10 bg-[#282c34]">
      <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/5">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400 font-mono">{lang}</span>
          {block.filename && <span className="text-xs text-gray-500">{block.filename}</span>}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
        </button>
      </div>
      <div ref={containerRef} className="min-h-[60px] overflow-x-auto" />
    </div>
  )
}
