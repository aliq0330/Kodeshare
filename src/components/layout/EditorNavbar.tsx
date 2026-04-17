import { Link } from 'react-router-dom'
import { Code2, Save, Share2, Play, ArrowLeft } from 'lucide-react'
import Button from '@components/ui/Button'
import Avatar from '@components/ui/Avatar'
import { useAuthStore } from '@store/authStore'
import { useEditorStore } from '@store/editorStore'

export default function EditorNavbar() {
  const { user } = useAuthStore()
  const { projectTitle, isSaving, save } = useEditorStore()

  return (
    <header className="h-12 border-b border-[#2a3347] bg-[#0d1117] flex items-center justify-between px-3 shrink-0">
      {/* Left */}
      <div className="flex items-center gap-2">
        <Link to="/" className="p-1.5 rounded hover:bg-[#1e2535] text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="w-px h-4 bg-[#2a3347]" />
        <Code2 className="w-4 h-4 text-brand-400" />
        <input
          type="text"
          defaultValue={projectTitle}
          className="bg-transparent text-sm font-medium text-white focus:outline-none focus:bg-[#1e2535] rounded px-2 py-1 w-48"
          placeholder="Proje adı..."
        />
        {isSaving && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Kaydediliyor...
          </span>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={save}>
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Kaydet</span>
        </Button>
        <Button variant="secondary" size="sm">
          <Play className="w-4 h-4" />
          <span className="hidden sm:inline">Çalıştır</span>
        </Button>
        <Button variant="primary" size="sm">
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Paylaş</span>
        </Button>
        {user && (
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" className="ml-1" />
        )}
      </div>
    </header>
  )
}
