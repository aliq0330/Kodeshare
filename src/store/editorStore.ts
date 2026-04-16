import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EditorFile, EditorTheme } from '@/types'

let nextId = 1
const uid = () => String(nextId++)

interface EditorStoreState {
  files: EditorFile[]
  activeFileId: string | null
  theme: EditorTheme
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
  isFullscreen: boolean
  projectTitle: string
  isSaving: boolean
  setActiveFile:    (id: string) => void
  addFile:          (file: Omit<EditorFile, 'id'>) => void
  removeFile:       (id: string) => void
  updateFile:       (id: string, patch: Partial<EditorFile>) => void
  setTheme:         (theme: EditorTheme) => void
  setFontSize:      (size: number) => void
  toggleWordWrap:   () => void
  toggleMinimap:    () => void
  toggleAutoSave:   () => void
  toggleFullscreen: () => void
  setProjectTitle:  (title: string) => void
  loadProject:      (title: string, projectFiles: EditorFile[]) => void
  save:             () => void
  markAllSaved:     () => void
}

const DEFAULT_FILES: EditorFile[] = [
  { id: '1', name: 'index.html',  language: 'html',       content: '<!doctype html>\n<html lang="tr">\n<head>\n  <meta charset="UTF-8" />\n  <title>Yeni Proje</title>\n  <link rel="stylesheet" href="style.css" />\n</head>\n<body>\n  <h1>Merhaba Dünya!</h1>\n  <script src="script.js"><\/script>\n</body>\n</html>', isModified: false },
  { id: '2', name: 'style.css',   language: 'css',        content: '/* Stiller */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n  display: grid;\n  place-items: center;\n  min-height: 100vh;\n  background: #0f1117;\n  color: white;\n}\n', isModified: false },
  { id: '3', name: 'script.js',   language: 'javascript', content: '// JavaScript\nconsole.log("Hazır!");\n', isModified: false },
]

export const useEditorStore = create<EditorStoreState>()(
  persist(
    (set, get) => ({
      files: DEFAULT_FILES,
      activeFileId: '1',
      theme: 'vs-dark',
      fontSize: 14,
      wordWrap: false,
      minimap: false,
      autoSave: true,
      isFullscreen: false,
      projectTitle: 'Yeni Proje',
      isSaving: false,

      setActiveFile: (id) => set({ activeFileId: id }),

      addFile: (file) => {
        const id = uid()
        set((s) => ({ files: [...s.files, { ...file, id }], activeFileId: id }))
      },

      removeFile: (id) => {
        set((s) => {
          const files = s.files.filter((f) => f.id !== id)
          const activeFileId =
            s.activeFileId === id ? (files[files.length - 1]?.id ?? null) : s.activeFileId
          return { files, activeFileId }
        })
      },

      updateFile: (id, patch) =>
        set((s) => ({ files: s.files.map((f) => (f.id === id ? { ...f, ...patch } : f)) })),

      setTheme:         (theme)   => set({ theme }),
      setFontSize:      (fontSize) => set({ fontSize }),
      toggleWordWrap:   ()        => set((s) => ({ wordWrap: !s.wordWrap })),
      toggleMinimap:    ()        => set((s) => ({ minimap: !s.minimap })),
      toggleAutoSave:   ()        => set((s) => ({ autoSave: !s.autoSave })),
      toggleFullscreen: ()        => set((s) => ({ isFullscreen: !s.isFullscreen })),
      setProjectTitle:  (title)   => set({ projectTitle: title }),

      loadProject: (title, projectFiles) =>
        set({ projectTitle: title, files: projectFiles, activeFileId: projectFiles[0]?.id ?? null }),

      save: () => {
        set({ isSaving: true })
        setTimeout(() => {
          get().markAllSaved()
          set({ isSaving: false })
        }, 600)
      },

      markAllSaved: () =>
        set((s) => ({ files: s.files.map((f) => ({ ...f, isModified: false })) })),
    }),
    {
      name: 'editor',
      partialize: (s) => ({ files: s.files, activeFileId: s.activeFileId, theme: s.theme, fontSize: s.fontSize, wordWrap: s.wordWrap, minimap: s.minimap, autoSave: s.autoSave, projectTitle: s.projectTitle }),
    },
  ),
)
