import { useState, useMemo } from 'react'
import { X, GitCompare } from 'lucide-react'
import { diffLines } from '@utils/diffUtils'
import type { ProjectVersion, ProjectVersionFile } from '@services/projectVersionService'
import type { UiColors } from '@editor/themes'

const CONTEXT = 3

interface Props {
  open: boolean
  onClose: () => void
  versionA: ProjectVersion
  currentFiles: ProjectVersionFile[]
  ui: UiColors
  rightLabel?: string
  leftLabel?: string
}

export default function ProjectVersionDiffModal({ open, onClose, versionA, currentFiles, ui, rightLabel, leftLabel }: Props) {
  const allNames = useMemo(() => {
    const names = new Set([
      ...versionA.files.map((f) => f.name),
      ...currentFiles.map((f) => f.name),
    ])
    return Array.from(names)
  }, [versionA.files, currentFiles])

  const [selected, setSelected] = useState(() => allNames[0] ?? '')

  if (!open) return null

  const fileA = versionA.files.find((f) => f.name === selected)
  const fileB = currentFiles.find((f) => f.name === selected)

  const oldContent = fileA?.content ?? ''
  const newContent = fileB?.content ?? ''

  const diff = diffLines(oldContent, newContent)
  const addedCount   = diff.filter((l) => l.type === 'add').length
  const removedCount = diff.filter((l) => l.type === 'del').length
  const isIdentical  = addedCount === 0 && removedCount === 0

  // Build visible line segments: changed ± CONTEXT lines, collapsed otherwise
  type Segment = { lines: typeof diff; collapsed: boolean; collapsedCount: number }
  const segments: Segment[] = []
  if (!isIdentical) {
    const changed = new Set<number>()
    diff.forEach((l, idx) => { if (l.type !== 'same') changed.add(idx) })
    const visible = new Set<number>()
    changed.forEach((idx) => {
      for (let k = Math.max(0, idx - CONTEXT); k <= Math.min(diff.length - 1, idx + CONTEXT); k++) {
        visible.add(k)
      }
    })

    let i = 0
    while (i < diff.length) {
      if (visible.has(i)) {
        const seg: typeof diff = []
        while (i < diff.length && visible.has(i)) { seg.push(diff[i]); i++ }
        segments.push({ lines: seg, collapsed: false, collapsedCount: 0 })
      } else {
        let count = 0
        while (i < diff.length && !visible.has(i)) { count++; i++ }
        segments.push({ lines: [], collapsed: true, collapsedCount: count })
      }
    }
  }

  // Assign line numbers
  let oldLineNo = 1
  let newLineNo = 1

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)' }}
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full sm:max-w-4xl sm:mx-4 rounded-t-2xl sm:rounded-xl border shadow-2xl overflow-hidden"
        style={{
          background: ui.panelBg,
          borderColor: ui.border,
          height: '90vh',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: `1px solid ${ui.border}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GitCompare className="w-4 h-4 shrink-0" style={{ color: '#8aa8ff' }} />
            <span className="text-sm font-semibold truncate" style={{ color: ui.text }}>
              v{versionA.versionNumber} karşılaştırması
            </span>
            {versionA.label && (
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{ background: ui.raisedBg, color: '#8aa8ff' }}
              >
                {versionA.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 shrink-0">
            {!isIdentical && (
              <span className="text-xs font-mono hidden sm:block" style={{ color: ui.textMuted }}>
                <span style={{ color: '#4ade80' }}>+{addedCount}</span>
                {' '}
                <span style={{ color: '#f87171' }}>-{removedCount}</span>
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded transition-colors"
              style={{ color: ui.textMuted }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* File tabs */}
        {allNames.length > 1 && (
          <div
            className="flex items-center gap-1 px-3 py-2 overflow-x-auto scrollbar-none shrink-0"
            style={{ borderBottom: `1px solid ${ui.border}` }}
          >
            {allNames.map((name) => {
              const inA = versionA.files.some((f) => f.name === name)
              const inB = currentFiles.some((f) => f.name === name)
              return (
                <button
                  key={name}
                  onClick={() => setSelected(name)}
                  className="px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-all"
                  style={selected === name
                    ? { background: ui.raisedBg, color: ui.text }
                    : { color: ui.textMuted }}
                >
                  {name}
                  {!inA && <span style={{ color: '#4ade80' }} className="ml-1">+</span>}
                  {!inB && <span style={{ color: '#f87171' }} className="ml-1">−</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Column headers */}
        <div
          className="grid grid-cols-2 shrink-0 text-xs"
          style={{ borderBottom: `1px solid ${ui.border}`, color: ui.textMuted }}
        >
          <div className="px-10 py-2" style={{ borderRight: `1px solid ${ui.border}` }}>
            {leftLabel ?? `v${versionA.versionNumber}${versionA.label ? ` · ${versionA.label}` : ''}`}
          </div>
          <div className="px-10 py-2">{rightLabel ?? 'Mevcut durum'}</div>
        </div>

        {/* Diff body */}
        <div className="flex-1 overflow-y-auto scrollbar-none">
          {isIdentical ? (
            <div className="flex items-center justify-center py-16 text-sm" style={{ color: ui.textMuted }}>
              Bu dosyada değişiklik yok
            </div>
          ) : (
            <div
              className="font-mono text-[12px] leading-5"
              style={{ color: ui.text }}
            >
              {segments.map((seg, si) => {
                if (seg.collapsed) {
                  const n = seg.collapsedCount
                  oldLineNo += n
                  newLineNo += n
                  return (
                    <div
                      key={`sep-${si}`}
                      className="flex items-center gap-2 px-4 py-1 select-none text-[11px]"
                      style={{ background: ui.raisedBg, color: ui.textMuted, borderTop: `1px solid ${ui.border}`, borderBottom: `1px solid ${ui.border}` }}
                    >
                      <span>···</span>
                      <span>{n} satır gizlendi</span>
                    </div>
                  )
                }

                return seg.lines.map((line, li) => {
                  let leftNo: number | null = null
                  let rightNo: number | null = null

                  if (line.type === 'same') {
                    leftNo = oldLineNo++
                    rightNo = newLineNo++
                  } else if (line.type === 'del') {
                    leftNo = oldLineNo++
                  } else {
                    rightNo = newLineNo++
                  }

                  const isAdd = line.type === 'add'
                  const isDel = line.type === 'del'

                  const leftBg  = isDel ? 'rgba(248,113,113,0.12)' : 'transparent'
                  const rightBg = isAdd ? 'rgba(74,222,128,0.10)'  : 'transparent'
                  const leftPrefix  = isDel ? '−' : ' '
                  const rightPrefix = isAdd ? '+' : ' '

                  return (
                    <div key={`${si}-${li}`} className="grid grid-cols-2" style={{ minHeight: 20 }}>
                      {/* Left: old */}
                      <div
                        className="flex items-start overflow-hidden"
                        style={{
                          background: leftBg,
                          borderRight: `1px solid ${ui.border}`,
                          borderBottom: `1px solid ${ui.border}22`,
                        }}
                      >
                        <span
                          className="select-none shrink-0 text-right pr-2 pl-2"
                          style={{ color: ui.textMuted, minWidth: 32, paddingTop: 1, fontSize: 11 }}
                        >
                          {leftNo ?? ''}
                        </span>
                        <span
                          className="shrink-0 pr-2"
                          style={{ color: isDel ? '#f87171' : ui.textMuted, paddingTop: 1 }}
                        >
                          {leftPrefix}
                        </span>
                        {(isDel || line.type === 'same') && (
                          <span
                            className="flex-1 overflow-hidden whitespace-pre-wrap break-all pr-2"
                            style={{ color: isDel ? '#fca5a5' : ui.text, paddingTop: 1 }}
                          >
                            {isDel ? line.content : (line.type === 'same' ? line.content : '')}
                          </span>
                        )}
                      </div>

                      {/* Right: new */}
                      <div
                        className="flex items-start overflow-hidden"
                        style={{
                          background: rightBg,
                          borderBottom: `1px solid ${ui.border}22`,
                        }}
                      >
                        <span
                          className="select-none shrink-0 text-right pr-2 pl-2"
                          style={{ color: ui.textMuted, minWidth: 32, paddingTop: 1, fontSize: 11 }}
                        >
                          {rightNo ?? ''}
                        </span>
                        <span
                          className="shrink-0 pr-2"
                          style={{ color: isAdd ? '#4ade80' : ui.textMuted, paddingTop: 1 }}
                        >
                          {rightPrefix}
                        </span>
                        {(isAdd || line.type === 'same') && (
                          <span
                            className="flex-1 overflow-hidden whitespace-pre-wrap break-all pr-2"
                            style={{ color: isAdd ? '#86efac' : ui.text, paddingTop: 1 }}
                          >
                            {isAdd ? line.content : (line.type === 'same' ? line.content : '')}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
