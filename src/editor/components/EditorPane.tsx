import { useEffect, useRef } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { html } from '@codemirror/lang-html'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { getThemeConfig } from '@editor/themes'
import type { EditorFile, EditorTheme } from '@/types'

export interface SelectionCoords {
  top: number
  left: number
  bottom: number
}

interface EditorPaneProps {
  file: EditorFile | null
  theme: EditorTheme
  wordWrap: boolean
  onChange: (content: string) => void
  onSelectionChange?: (text: string, coords: SelectionCoords | null) => void
}

function langExtension(lang: string) {
  if (lang === 'html') return html()
  if (lang === 'css') return css()
  if (lang === 'javascript') return javascript()
  if (lang === 'typescript') return javascript({ typescript: true })
  return []
}

const baseTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: '13px', lineHeight: '1.6' },
  '.cm-content': { paddingTop: '8px', paddingBottom: '8px' },
  '.cm-gutters': { borderRight: 'none' },
})

export default function EditorPane({ file, theme, wordWrap, onChange, onSelectionChange }: EditorPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const onChangeRef = useRef(onChange)
  const onSelectionChangeRef = useRef(onSelectionChange)
  onChangeRef.current = onChange
  onSelectionChangeRef.current = onSelectionChange

  const themeConfig = getThemeConfig(theme)

  useEffect(() => {
    if (!containerRef.current || !file) return

    const extensions = [
      basicSetup,
      langExtension(file.language),
      baseTheme,
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChangeRef.current(update.state.doc.toString())
          onSelectionChangeRef.current?.('', null)
        }
        if (update.selectionSet && !update.docChanged) {
          const sel = update.state.selection.main
          if (sel.from !== sel.to) {
            const text = update.state.sliceDoc(sel.from, sel.to)
            const coords = update.view.coordsAtPos(sel.from)
            onSelectionChangeRef.current?.(text, coords ? { top: coords.top, left: coords.left, bottom: coords.bottom } : null)
          } else {
            onSelectionChangeRef.current?.('', null)
          }
        }
      }),
    ]

    if (themeConfig.extension) extensions.push(themeConfig.extension)
    if (wordWrap) extensions.push(EditorView.lineWrapping)

    const view = new EditorView({
      state: EditorState.create({ doc: file.content, extensions }),
      parent: containerRef.current,
    })
    viewRef.current = view

    return () => { view.destroy(); viewRef.current = null }
  }, [file?.id, theme, wordWrap]) // eslint-disable-line

  useEffect(() => {
    const view = viewRef.current
    if (!view || !file) return
    const current = view.state.doc.toString()
    if (current !== file.content) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: file.content } })
    }
  }, [file?.content]) // eslint-disable-line

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center h-full" style={{ background: '#0d1117' }}>
        <p className="text-gray-600 text-sm">Bir dosya seç</p>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="h-full overflow-hidden"
      style={{ background: themeConfig.bg }}
    />
  )
}
