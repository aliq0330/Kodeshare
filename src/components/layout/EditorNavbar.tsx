import { Link } from 'react-router-dom'
import { Code2, Share2, ArrowLeft } from 'lucide-react'
import Button from '@components/ui/Button'
import Avatar from '@components/ui/Avatar'
import { useAuthStore } from '@store/authStore'
import { useEditorStore } from '@store/editorStore'
import { useProjectStore } from '@store/projectStore'
import { useComposerStore } from '@store/composerStore'

export default function EditorNavbar() {
  const { user } = useAuthStore()
  const { projectTitle, isSaving, setProjectTitle } = useEditorStore()
  const { projects, activeProjectId } = useProjectStore()
  const { openWithProject, openComposer } = useComposerStore()

  const handlePublish = () => {
    const activeProject = projects.find((p) => p.id === activeProjectId)
    if (activeProject) {
      openWithProject({ ...activeProject, title: projectTitle })
    } else {
      openComposer()
    }
  }

  return (
    <header className="h-12 border-b border-[#2a3347] bg-[#0d1117] flex items-center gap-2 px-3 shrink-0 min-w-0 overflow-hidden">
      {/* Left — proje adı */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Link
          to="/"
          className="p-1.5 rounded hover:bg-[#1e2535] text-gray-400 hover:text-white transition-colors shrink-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="hidden sm:block w-px h-4 bg-[#2a3347] shrink-0" />
        <Code2 className="hidden sm:block w-4 h-4 text-brand-400 shrink-0" />
        <input
          type="text"
          value={projectTitle}
          onChange={(e) => setProjectTitle(e.target.value)}
          className="bg-transparent text-sm font-medium text-white focus:outline-none focus:bg-[#1e2535] rounded px-2 py-1 min-w-0 w-0 flex-1 max-w-[180px]"
          placeholder="Proje adı..."
        />
        {isSaving && (
          <span className="hidden md:flex text-xs text-gray-500 items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Kaydediliyor...
          </span>
        )}
      </div>

      {/* Right — eylemler */}
      <div className="flex items-center gap-1 shrink-0">
        <Button variant="primary" size="sm" onClick={handlePublish}>
          <Share2 className="w-4 h-4" />
          <span className="hidden md:inline ml-1">Paylaş</span>
        </Button>
        {user && (
          <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" className="ml-1" />
        )}
      </div>
    </header>
  )
}
