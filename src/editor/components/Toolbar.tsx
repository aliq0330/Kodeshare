import { WrapText, Map, Maximize2, Minimize2, Save, Cloud, Loader2 } from 'lucide-react'
import { cn } from '@utils/cn'
import type { EditorTheme } from '@/types'

interface ToolbarProps {
  wordWrap: boolean
  minimap: boolean
  isFullscreen: boolean
  theme: EditorTheme
  isSaving?: boolean
  hasUnsaved?: boolean
  isAuthenticated?: boolean
  onToggleWordWrap: () => void
  onToggleMinimap: () => void
  onToggleFullscreen: () => void
  onThemeChange: (theme: EditorTheme) => void
  onSave?: () => void
}

const THEMES: { id: EditorTheme; label: string }[] = [
  { id: 'one-dark',     label: 'Dark'  },
  { id: 'github-light', label: 'Light' },
]

function ToolbarBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors text-xs',
        active ? 'bg-brand-700 text-brand-200' : 'text-gray-500 hover:bg-[#1e2535] hover:text-gray-300',
      )}
    >
      {children}
    </button>
  )
}

export default function Toolbar({
  wordWrap, minimap, isFullscreen, theme,
  isSaving, hasUnsaved, isAuthenticated,
  onToggleWordWrap, onToggleMinimap, onToggleFullscreen, onThemeChange, onSave,
}: ToolbarProps) {
  return (
    <div className="editor-toolbar shrink-0 flex items-center gap-2">
      <ToolbarBtn active={wordWrap} onClick={onToggleWordWrap} title="Kelime Kaydır">
        <WrapText className="w-3.5 h-3.5" />
      </ToolbarBtn>
      <ToolbarBtn active={minimap} onClick={onToggleMinimap} title="Mini Harita">
        <Map className="w-3.5 h-3.5" />
      </ToolbarBtn>

      <div className="w-px h-4 bg-[#2a3347] mx-1" />

      <div className="flex items-center gap-1 bg-[#1e2535] rounded-lg p-0.5">
        {THEMES.map((t) => (
          <button
            key={t.id}
            onClick={() => onThemeChange(t.id)}
            className={cn(
              'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
              theme === t.id ? 'bg-[#2a3347] text-white' : 'text-gray-500 hover:text-gray-300',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="ml-auto flex items-center gap-1">
        {isAuthenticated && onSave && (
          <button
            onClick={onSave}
            disabled={isSaving}
            title="Kaydet (Ctrl+S)"
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium transition-colors',
              hasUnsaved ? 'text-brand-400 hover:bg-[#1e2535]' : 'text-gray-600 hover:bg-[#1e2535]',
            )}
          >
            {isSaving
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : hasUnsaved ? <Save className="w-3.5 h-3.5" /> : <Cloud className="w-3.5 h-3.5" />}
            <span>{isSaving ? 'Kaydediliyor...' : hasUnsaved ? 'Kaydet' : 'Kaydedildi'}</span>
          </button>
        )}
        <ToolbarBtn active={isFullscreen} onClick={onToggleFullscreen} title={isFullscreen ? 'Çıkış' : 'Tam Ekran'}>
          {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
        </ToolbarBtn>
      </div>
    </div>
  )
}
