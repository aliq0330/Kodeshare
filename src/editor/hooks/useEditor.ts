import { useEditorStore } from '@store/editorStore'

export function useEditor() {
  const store = useEditorStore()

  const activeFile = store.files.find((f) => f.id === store.activeFileId) ?? null

  const updateActiveFile = (content: string) => {
    if (!store.activeFileId) return
    store.updateFile(store.activeFileId, { content, isModified: true })
  }

  return {
    files: store.files,
    activeFile,
    activeFileId: store.activeFileId,
    theme: store.theme,
    fontSize: store.fontSize,
    wordWrap: store.wordWrap,
    minimap: store.minimap,
    autoSave: store.autoSave,
    isFullscreen: store.isFullscreen,
    setActiveFile: store.setActiveFile,
    addFile: store.addFile,
    removeFile: store.removeFile,
    updateActiveFile,
    toggleWordWrap: store.toggleWordWrap,
    toggleMinimap: store.toggleMinimap,
    toggleFullscreen: store.toggleFullscreen,
    setTheme: store.setTheme,
  }
}
