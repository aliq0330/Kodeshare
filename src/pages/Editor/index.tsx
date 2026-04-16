import { useState, useEffect, useCallback } from 'react'
import { GripVertical, Cloud, CloudOff } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import FileTree from '@editor/components/FileTree'
import FileTabs from '@editor/components/FileTabs'
import EditorPane from '@editor/components/EditorPane'
import Preview from '@editor/components/Preview'
import Toolbar from '@editor/components/Toolbar'
import { useEditor } from '@editor/hooks/useEditor'
import { useAutoSave } from '@editor/hooks/useAutoSave'
import { useEditorStore } from '@store/editorStore'
import { useAuthStore } from '@store/authStore'
import { postService } from '@services/postService'
import { languageFromFilename, defaultContentForLanguage } from '@editor/utils/languageUtils'
import '@/styles/editor.css'
import toast from 'react-hot-toast'

export default function EditorPage() {
  const { projectId } = useParams<{ projectId?: string }>()
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const { files, activeFile, activeFileId, theme, fontSize, wordWrap, minimap, isFullscreen,
    setActiveFile, addFile, removeFile, updateActiveFile,
    toggleWordWrap, toggleMinimap, toggleFullscreen, setTheme,
  } = useEditor()
  const { projectTitle, markAllSaved, loadProject } = useEditorStore()

  const [showPreview, setShowPreview] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(projectId ?? null)

  // Load project from URL param on mount
  useEffect(() => {
    if (!projectId) return
    postService.getPost(projectId).then((post) => {
      loadProject(post.title, post.files.map((f) => ({
        id: f.id,
        name: f.name,
        language: f.language,
        content: f.content,
        isModified: false,
      })))
      setSavedId(post.id)
    }).catch(() => toast.error('Proje yüklenemedi'))
  }, [projectId]) // eslint-disable-line

  const saveProject = useCallback(async () => {
    if (!isAuthenticated) return
    setIsSaving(true)
    try {
      const payload = {
        type: 'snippet' as const,
        title: projectTitle || 'İsimsiz Proje',
        description: null,
        tags: [],
        files: files.map((f) => ({ name: f.name, language: f.language, content: f.content })),
      }
      if (savedId) {
        await postService.update(savedId, payload)
      } else {
        const post = await postService.create(payload)
        setSavedId(post.id)
        navigate(`/editor/${post.id}`, { replace: true })
      }
      markAllSaved()
    } catch {
      toast.error('Kaydedilemedi')
    } finally {
      setIsSaving(false)
    }
  }, [savedId, projectTitle, files, isAuthenticated, navigate, markAllSaved])

  useAutoSave(saveProject)

  const handleAddFile = () => {
    const name = prompt('Dosya adı (örn. script.js):')
    if (!name) return
    const lang = languageFromFilename(name)
    addFile({ name, language: lang, content: defaultContentForLanguage(lang), isModified: false })
  }

  const hasUnsaved = files.some((f) => f.isModified)

  return (
    <div className="flex h-full overflow-hidden">
      <FileTree
        files={files}
        activeFileId={activeFileId}
        onSelect={setActiveFile}
        onAddFile={handleAddFile}
        onDeleteFile={removeFile}
      />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <FileTabs files={files} activeFileId={activeFileId} onSelect={setActiveFile} onClose={removeFile} />
        <Toolbar
          wordWrap={wordWrap}
          minimap={minimap}
          isFullscreen={isFullscreen}
          theme={theme}
          isSaving={isSaving}
          hasUnsaved={hasUnsaved}
          isAuthenticated={isAuthenticated}
          onToggleWordWrap={toggleWordWrap}
          onToggleMinimap={toggleMinimap}
          onToggleFullscreen={toggleFullscreen}
          onThemeChange={setTheme}
          onSave={saveProject}
        />
        <div className="flex flex-1 overflow-hidden">
          <div className={showPreview ? 'w-1/2' : 'flex-1'}>
            <EditorPane
              file={activeFile}
              theme={theme}
              fontSize={fontSize}
              wordWrap={wordWrap}
              minimap={minimap}
              onChange={updateActiveFile}
            />
          </div>

          {showPreview && (
            <>
              <div className="w-1 bg-[#2a3347] hover:bg-brand-600 cursor-col-resize flex items-center justify-center transition-colors">
                <GripVertical className="w-3 h-3 text-gray-600" />
              </div>
              <div className="w-1/2">
                <Preview files={files} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
