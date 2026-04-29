import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState, Compartment } from '@codemirror/state'
import { keymap } from '@codemirror/view'
import { indentWithTab } from '@codemirror/commands'
import { javascript } from '@codemirror/lang-javascript'
import { css } from '@codemirror/lang-css'
import { html } from '@codemirror/lang-html'
import { oneDark } from '@codemirror/theme-one-dark'
import { githubLight } from '@uiw/codemirror-theme-github'
import { IconCheck, IconChevronDown, IconCopy, IconMaximize, IconMinimize } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { LANGUAGE_COLORS } from '@utils/constants'
import { useIsLightMode } from '@hooks/useIsLightMode'

export type SnippetLang = 'javascript' | 'css' | 'html'

const LANG_OPTIONS: { id: SnippetLang; label: string }[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'css',        label: 'CSS' },
  { id: 'html',       label: 'HTML' },
]

function langExtension(lang: SnippetLang) {
  if (lang === 'css') return css()
  if (lang === 'html') return html()
  return javascript()
}

const baseEditorTheme = EditorView.theme({
  '&': { height: '100%', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
    fontSize: '13px',
    lineHeight: '1.65',
    overflow: 'auto',
  },
  '.cm-content': { paddingTop: '10px', paddingBottom: '10px' },
  '.cm-gutters': {
    backgroundColor: 'transparent',
    borderRight: '1px solid rgba(128,128,128,0.2)',
    color: '#5b6478',
  },
  '.cm-activeLineGutter, .cm-activeLine': { backgroundColor: 'rgba(128,128,128,0.07)' },
})

interface SnippetCodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: SnippetLang
  onLanguageChange: (lang: SnippetLang) => void
  expanded: boolean
  onToggleExpand: () => void
}

export default function SnippetCodeEditor({
  value,
  onChange,
  language,
  onLanguageChange,
  expanded,
  onToggleExpand,
}: SnippetCodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef      = useRef<EditorView | null>(null)
  const langCompartment   = useRef(new Compartment())
  const themeCompartment  = useRef(new Compartment())
  const onChangeRef  = useRef(onChange)
  onChangeRef.current = onChange

  const isLight = useIsLightMode()

  const [copied, setCopied]     = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const langRef = useRef<HTMLDivElement>(null)

  // Boot CodeMirror once
  useEffect(() => {
    if (!containerRef.current) return

    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          themeCompartment.current.of(isLight ? githubLight : oneDark),
          baseEditorTheme,
          langCompartment.current.of(langExtension(language)),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current(u.state.doc.toString())
          }),
        ],
      }),
      parent: containerRef.current,
    })
    viewRef.current = view
    return () => { view.destroy(); viewRef.current = null }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Swap language dynamically
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: langCompartment.current.reconfigure(langExtension(language)),
    })
  }, [language])

  // Swap theme dynamically
  useEffect(() => {
    viewRef.current?.dispatch({
      effects: themeCompartment.current.reconfigure(isLight ? githubLight : oneDark),
    })
  }, [isLight])

  // Sync external content
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
    }
  }, [value])

  // Close language dropdown on outside click
  useEffect(() => {
    if (!langOpen) return
    const h = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [langOpen])

  const handleCopy = async () => {
    if (!value.trim()) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard API yoksa sessiz geç */ }
  }

  const currentLabel = LANG_OPTIONS.find((l) => l.id === language)?.label ?? 'JavaScript'
  const dotColor = LANGUAGE_COLORS[language] ?? '#8b9ab5'

  const containerBg     = isLight ? '#ffffff' : '#0d1117'
  const containerBorder = isLight ? '#d0d7de' : '#30363d'
  const headerBg        = isLight ? '#f6f8fa' : '#161b22'
  const headerBorder    = isLight ? '#d0d7de' : '#21262d'
  const langBtnText     = isLight ? 'text-gray-700 hover:bg-black/5' : 'text-gray-300 hover:bg-surface-raised'
  const actionBtnBase   = isLight ? 'text-gray-500 hover:bg-black/5 hover:text-gray-800' : 'text-gray-400 hover:bg-white/10 hover:text-white'
  const dropdownItemActive = isLight ? 'text-brand-600 bg-brand-50' : 'text-brand-300 bg-brand-900/20'
  const dropdownItemIdle   = isLight ? 'text-gray-700 hover:bg-black/5 hover:text-gray-900' : 'text-gray-300 hover:bg-surface-raised hover:text-white'

  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden',
        expanded
          ? 'fixed inset-3 sm:inset-6 z-[60] rounded-2xl shadow-2xl'
          : 'relative rounded-xl border',
      )}
      style={{
        background: containerBg,
        ...(expanded ? { borderColor: containerBorder, border: `1px solid ${containerBorder}` } : { borderColor: containerBorder }),
      }}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-2 border-b"
        style={{ background: headerBg, borderColor: headerBorder }}
      >
        <div ref={langRef} className="relative">
          <button
            type="button"
            onClick={() => setLangOpen((o) => !o)}
            className={cn('flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-md transition-colors', langBtnText)}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: dotColor }} />
            {currentLabel}
            <IconChevronDown className="w-3.5 h-3.5 opacity-60" />
          </button>
          {langOpen && (
            <div className="absolute left-0 top-full mt-1 w-36 card shadow-xl py-1 z-10 animate-slide-down">
              {LANG_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => { onLanguageChange(opt.id); setLangOpen(false) }}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs text-left transition-colors',
                    opt.id === language ? dropdownItemActive : dropdownItemIdle,
                  )}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LANGUAGE_COLORS[opt.id] ?? '#8b9ab5' }}
                  />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'flex items-center gap-1.5 px-2 py-1 text-xs rounded-md transition-colors',
              copied
                ? (isLight ? 'text-emerald-600 bg-emerald-50' : 'text-emerald-400 bg-emerald-900/20')
                : actionBtnBase,
            )}
            title="Kodu kopyala"
          >
            {copied ? <IconCheck className="w-3.5 h-3.5" /> : <IconCopy className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Kopyalandı!' : 'Kopyala'}</span>
          </button>
          <button
            type="button"
            onClick={onToggleExpand}
            className={cn('p-1.5 rounded-md transition-colors', actionBtnBase)}
            title={expanded ? 'Küçült' : 'Genişlet'}
          >
            {expanded ? <IconMinimize className="w-3.5 h-3.5" /> : <IconMaximize className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div
        ref={containerRef}
        className={cn(
          'font-mono text-[13px]',
          expanded ? 'flex-1 min-h-0' : 'min-h-[14rem] max-h-[60vh]',
          'overflow-hidden',
        )}
      />
    </div>
  )
}
