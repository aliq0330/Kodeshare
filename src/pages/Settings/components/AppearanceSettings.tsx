import { Moon, Sun, Monitor } from 'lucide-react'
import { cn } from '@utils/cn'

const themes = [
  { id: 'dark',   label: 'Koyu',   icon: Moon },
  { id: 'light',  label: 'Açık',   icon: Sun },
  { id: 'system', label: 'Sistem', icon: Monitor },
]

const editorThemes = [
  { id: 'vs-dark',  label: 'VS Dark' },
  { id: 'vs-light', label: 'VS Light' },
  { id: 'hc-black', label: 'High Contrast' },
]

export default function AppearanceSettings() {
  return (
    <div className="card p-6 flex flex-col gap-6">
      <h2 className="font-semibold text-white">Görünüm</h2>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Tema</p>
        <div className="flex gap-3">
          {themes.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              className={cn(
                'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-colors',
                id === 'dark'
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
              <input type="radio" name="editorTheme" defaultChecked={t.id === 'vs-dark'} className="accent-brand-500" />
              <span className="text-sm text-gray-300">{t.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <p className="text-sm font-medium text-gray-300 mb-3">Yazı Boyutu</p>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">12px</span>
          <input type="range" min={12} max={20} defaultValue={14} className="flex-1 accent-brand-500" />
          <span className="text-xs text-gray-500">20px</span>
        </div>
      </div>
    </div>
  )
}
