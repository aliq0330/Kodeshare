export type EditorLanguage = 'html' | 'css' | 'javascript' | 'typescript'

export type EditorTheme =
  | 'one-dark'
  | 'dracula'
  | 'github-dark'
  | 'github-light'
  | 'nord'
  | 'tokyo-night'
  | 'solarized-dark'
  | 'solarized-light'
  | 'material-dark'
  | 'monokai'

export interface EditorFile {
  id: string
  name: string
  language: EditorLanguage
  content: string
  isModified: boolean
}

export interface EditorFolder {
  id: string
  name: string
  isOpen: boolean
  children: (EditorFile | EditorFolder)[]
}

export type FileTreeNode = EditorFile | EditorFolder

export interface EditorState {
  files: EditorFile[]
  activeFileId: string | null
  theme: EditorTheme
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  autoSave: boolean
  isFullscreen: boolean
}
