import { useState } from 'react'
import { Link } from 'react-router-dom'
import { IconX } from '@tabler/icons-react'
import SyntaxHighlight from '@components/shared/SyntaxHighlight'

const LANGUAGES = [
  'javascript', 'typescript', 'python', 'css', 'html',
  'bash', 'json', 'sql', 'rust', 'go',
]

/** Snippet'i textarea'nın imleç pozisyonuna ekler; imleç snippet'ten sonraya taşınır. */
export function insertAtCursor(
  textarea: HTMLTextAreaElement | null,
  currentValue: string,
  snippet: string,
  setValue: (v: string) => void,
) {
  const start = textarea?.selectionStart ?? currentValue.length
  const end   = textarea?.selectionEnd   ?? currentValue.length
  const before = currentValue.slice(0, start)
  const after  = currentValue.slice(end)
  const needsBefore = before.length > 0 && !before.endsWith('\n')
  const needsAfter  = after.length  > 0 && !after.startsWith('\n')
  const newValue = `${before}${needsBefore ? '\n' : ''}${snippet}${needsAfter ? '\n' : ''}${after}`
  setValue(newValue)
  requestAnimationFrame(() => {
    if (!textarea) return
    const pos = start + (needsBefore ? 1 : 0) + snippet.length + (needsAfter ? 1 : 0)
    textarea.setSelectionRange(pos, pos)
    textarea.focus()
  })
}

type Segment =
  | { type: 'text'; content: string }
  | { type: 'code'; lang: string; code: string }

function parse(text: string): Segment[] {
  const segments: Segment[] = []
  const re = /```(\w*)\n([\s\S]*?)```/g
  let last = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) segments.push({ type: 'text', content: text.slice(last, m.index) })
    segments.push({ type: 'code', lang: m[1] || 'plain', code: m[2] })
    last = re.lastIndex
  }
  if (last < text.length) segments.push({ type: 'text', content: text.slice(last) })
  return segments
}

function TextSegment({ content }: { content: string }) {
  const parts = content.split(/(@\w+|#\w+)/g)
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        if (part.startsWith('@'))
          return <Link key={i} to={`/profile/${part.slice(1)}`} className="text-brand-400 hover:underline">{part}</Link>
        if (part.startsWith('#'))
          return <Link key={i} to={`/explore?tag=${part.slice(1)}`} className="text-brand-400 hover:underline">{part}</Link>
        return part
      })}
    </span>
  )
}

export function CommentContent({ content }: { content: string }) {
  const segments = parse(content)
  return (
    <div className="text-sm text-gray-300 leading-relaxed break-words">
      {segments.map((seg, i) =>
        seg.type === 'text' ? (
          <TextSegment key={i} content={seg.content} />
        ) : (
          <div key={i} className="my-2 rounded-lg overflow-hidden border border-surface-border">
            {seg.lang && seg.lang !== 'plain' && (
              <div className="px-3 py-1 bg-[#1a2236] text-xs text-gray-500 font-mono border-b border-surface-border">
                {seg.lang}
              </div>
            )}
            <pre className="p-3 bg-[#0d1117] overflow-x-auto text-xs leading-relaxed font-mono">
              <SyntaxHighlight code={seg.code} lang={seg.lang} />
            </pre>
          </div>
        )
      )}
    </div>
  )
}

interface SnippetPanelProps {
  onInsert: (snippet: string) => void
  onClose: () => void
}

export function SnippetPanel({ onInsert, onClose }: SnippetPanelProps) {
  const [lang, setLang] = useState('javascript')
  const [code, setCode] = useState('')

  const handleInsert = () => {
    if (!code.trim()) return
    onInsert(`\`\`\`${lang}\n${code}\n\`\`\``)
    onClose()
  }

  return (
    <div className="mt-2 rounded-xl border border-surface-border bg-[#0d1117] p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="bg-surface-raised border border-surface-border rounded-md px-2 py-1 text-xs text-gray-300 outline-none cursor-pointer"
        >
          {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
        </select>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-gray-600 hover:text-gray-300 transition-colors"
        >
          <IconX className="w-3.5 h-3.5" />
        </button>
      </div>
      <textarea
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="Kodunu buraya yaz..."
        rows={4}
        className="w-full bg-surface-raised border border-surface-border rounded-lg px-3 py-2 text-xs text-gray-200 font-mono resize-y outline-none placeholder:text-gray-600 focus:border-brand-500 transition-colors"
        onKeyDown={(e) => { if (e.key === 'Escape') onClose() }}
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
        >
          İptal
        </button>
        <button
          type="button"
          onClick={handleInsert}
          disabled={!code.trim()}
          className="px-3 py-1.5 rounded-md bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
        >
          Ekle
        </button>
      </div>
    </div>
  )
}
