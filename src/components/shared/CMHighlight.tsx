import { useEffect, useRef } from 'react'
import { EditorView } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'

function langExtension(lang: string) {
  if (lang === 'css') return css()
  if (lang === 'html') return html()
  if (lang === 'typescript') return javascript({ typescript: true })
  return javascript()
}

interface Props {
  code: string
  lang: string
  /** Allow vertical scrolling (PostDetail). Default false = overflow hidden (PostCard). */
  scroll?: boolean
  className?: string
}

export default function CMHighlight({ code, lang, scroll = false, className }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const theme = EditorView.theme({
      '&': { background: '#0d1117 !important' },
      '&.cm-focused': { outline: 'none' },
      '.cm-scroller': {
        fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
        fontSize: '13px',
        lineHeight: '1.65',
        overflow: 'hidden',
      },
      '.cm-content': { padding: '12px 16px', caretColor: 'transparent' },
      '.cm-line': { padding: '0 !important' },
      '.cm-cursor': { display: 'none !important' },
      '.cm-selectionBackground': { display: 'none !important' },
    })

    const view = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: [
          EditorState.readOnly.of(true),
          EditorView.editable.of(false),
          langExtension(lang),
          oneDark,
          theme,
          EditorView.lineWrapping,
        ],
      }),
      parent: containerRef.current,
    })

    return () => view.destroy()
  }, [code, lang, scroll])

  return (
    <div
      ref={containerRef}
      className={`bg-[#0d1117] ${className ?? ''}`}
      style={{ overflowY: scroll ? 'auto' : 'hidden' }}
    />
  )
}
