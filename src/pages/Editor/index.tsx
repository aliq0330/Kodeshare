import { useState } from 'react'
import { GripVertical } from 'lucide-react'
import FileTree from '@editor/components/FileTree'
import FileTabs from '@editor/components/FileTabs'
import EditorPane from '@editor/components/EditorPane'
import Preview from '@editor/components/Preview'
import Toolbar from '@editor/components/Toolbar'
import { useEditor } from '@editor/hooks/useEditor'
import { useAutoSave } from '@editor/hooks/useAutoSave'
import { languageFromFilename, defaultContentForLanguage } from '@editor/utils/languageUtils'
import '@/styles/editor.css'

export default function EditorPage() {
  const {
    files, activeFile, activeFileId,
    theme, fontSize, wordWrap, minimap, isFullscreen,
    setActiveFile, addFile, removeFile,
    updateActiveFile, toggleWordWrap, toggleMinimap,
    toggleFullscreen, setTheme,
  } = useEditor()

  const [showPreview, setShowPreview] = useState(true)

  useAutoSave(async () => {
    // persist to API
  })

  const handleAddFile = () => {
    const name = prompt('Dosya adı (örn. script.js):')
    if (!name) return
    const lang = languageFromFilename(name)
    addFile({ name, language: lang, content: defaultContentForLanguage(lang), isModified: false })
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* File tree */}
      <FileTree
        files={files}
        activeFileId={activeFileId}
        onSelect={setActiveFile}
        onAddFile={handleAddFile}
        onDeleteFile={removeFile}
      />

      {/* Editor side */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <FileTabs files={files} activeFileId={activeFileId} onSelect={setActiveFile} onClose={removeFile} />
        <Toolbar
          wordWrap={wordWrap}
          minimap={minimap}
          isFullscreen={isFullscreen}
          theme={theme}
          onToggleWordWrap={toggleWordWrap}
          onToggleMinimap={toggleMinimap}
          onToggleFullscreen={toggleFullscreen}
          onThemeChange={setTheme}
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
