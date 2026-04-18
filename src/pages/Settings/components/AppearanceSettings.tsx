import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@utils/cn'
import { useEditorStore } from '@store/editorStore'
import type { EditorTheme } from '@/types'

const appThemes = [
  { id: 'dark',   label: 'Koyu',   icon: Moon },
  { id: 'light',  label: 'Açık',   icon: Sun },
  { id: 'system', label: 'Sistem', icon: Monitor },
] as const

const editorThemes: { id: EditorTheme; label: string }[] = [
  { id: 'vs-dark',  label: 'VS Dark' },
  { id: 'vs-light', label: 'VS Light' },
  { id: 'hc-black', label: 'High Contrast' },
]

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

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Editör Teması</p>
        <div className="flex flex-col gap-2">
          {editorThemes.map((t) => (
            <label key={t.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-raised cursor-pointer">
              <input
                type="radio"
                name="editorTheme"
                checked={theme === t.id}
                onChange={() => setTheme(t.id)}
                className="accent-brand-500"
              />
              <span className="text-sm text-gray-300">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Yazı Boyutu <span className="text-brand-400">{fontSize}px</span></p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">12px</span>
          <input
            type="range"
            min={12}
            max={20}
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="flex-1 accent-brand-500"
          />
          <span className="text-xs text-gray-500">20px</span>
        </div>
      </div>
    </div>
  )
}
