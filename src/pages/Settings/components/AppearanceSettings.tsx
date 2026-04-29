import { IconMoon, IconSun, IconDeviceDesktop, IconCheck } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { useEditorStore } from '@store/editorStore'
import { EDITOR_THEMES } from '@editor/themes'
import type { EditorTheme } from '@/types'
import type { PreviewColors } from '@editor/themes'

const appThemes = [
  { id: 'dark',   label: 'Koyu',   icon: IconMoon },
  { id: 'light',  label: 'Açık',   icon: IconSun },
  { id: 'system', label: 'Sistem', icon: IconDeviceDesktop },
] as const

// Static mini code preview rendered with the theme's color palette
function ThemePreview({ p, bg }: { p: PreviewColors; bg: string }) {
  const s: React.CSSProperties = {
    background: bg,
    borderRadius: 6,
    padding: '7px 10px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    fontSize: 10,
    lineHeight: 1.7,
    overflow: 'hidden',
  }

  const line = (num: number, content: React.ReactNode) => (
    <div style={{ display: 'flex', gap: 8 }}>
      <span style={{ color: p.gutter, minWidth: 10, userSelect: 'none' }}>{num}</span>
      <span>{content}</span>
    </div>
  )

  return (
    <div style={s}>
      {line(1, <span style={{ color: p.comment }}>{'// kodeshare'}</span>)}
      {line(2, <>
        <span style={{ color: p.keyword }}>function </span>
        <span style={{ color: p.fn }}>greet</span>
        <span style={{ color: p.text }}>{'(name) {'}</span>
      </>)}
      {line(3, <>
        <span style={{ color: p.keyword }}>{'  return '}</span>
        <span style={{ color: p.string }}>"Hi, " </span>
        <span style={{ color: p.text }}>+ name</span>
      </>)}
      {line(4, <span style={{ color: p.text }}>{'}'}</span>)}
    </div>
  )
}

export default function AppearanceSettings() {
  const theme      = useEditorStore((s) => s.theme)
  const fontSize   = useEditorStore((s) => s.fontSize)
  const appTheme   = useEditorStore((s) => s.appTheme)
  const setTheme   = useEditorStore((s) => s.setTheme)
  const setFontSize = useEditorStore((s) => s.setFontSize)
  const setAppTheme = useEditorStore((s) => s.setAppTheme)

  return (
    <div className="card p-6 flex flex-col gap-6">
      <h2 className="font-semibold text-white">Görünüm</h2>

      {/* App theme */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Tema</p>
        <div className="flex gap-3">
          {appThemes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setAppTheme(id)}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                appTheme === id
                  ? 'border-brand-500 bg-brand-900/20 text-brand-300'
                  : 'border-surface-border text-gray-500 hover:border-surface-raised hover:text-gray-300',
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="text-sm font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Editor theme grid */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Editör Teması</p>
        <div className="grid grid-cols-2 gap-3">
          {EDITOR_THEMES.map((t) => {
            const active = theme === (t.id as EditorTheme)
            return (
              <button
                key={t.id}
                onClick={() => setTheme(t.id as EditorTheme)}
                className={cn(
                  'relative flex flex-col rounded-xl border overflow-hidden transition-all text-left',
                  active
                    ? 'border-brand-500 ring-1 ring-brand-500/40'
                    : 'border-surface-border hover:border-surface-raised',
                )}
              >
                {/* Preview */}
                <div className="w-full pointer-events-none">
                  <ThemePreview p={t.preview} bg={t.bg} />
                </div>

                {/* Label row */}
                <div
                  className="flex items-center justify-between px-3 py-2"
                  style={{ background: t.dark ? '#0d0e14' : '#f0f0f0' }}
                >
                  <span className={cn('text-xs font-medium', t.dark ? 'text-gray-300' : 'text-gray-700')}>
                    {t.name}
                  </span>
                  {active && (
                    <IconCheck className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Font size */}
      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">
          Yazı Boyutu <span className="text-brand-400">{fontSize}px</span>
        </p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">16px</span>
          <input
            type="range"
            min={16}
            max={24}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="text-xs text-gray-500">24px</span>
        </div>
      </div>
    </div>
  )
}
