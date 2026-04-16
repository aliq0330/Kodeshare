import { useRef } from 'react'
import MonacoEditor, { type OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import type { EditorFile, EditorTheme } from '@/types'

interface EditorPaneProps {
  file: EditorFile | null
  theme: EditorTheme
  fontSize: number
  wordWrap: boolean
  minimap: boolean
  onChange: (content: string) => void
}

export default function EditorPane({ file, theme, fontSize, wordWrap, minimap, onChange }: EditorPaneProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)

  const handleMount: OnMount = (ed) => {
    editorRef.current = ed
    ed.addCommand(0x200C /* Ctrl+S */, () => {
      // trigger save from parent via store
    })
  }

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-600 text-sm bg-[#0d1117]">
        Açmak için sol panelden bir dosya seç
      </div>
    )
  }

  return (
    <MonacoEditor
      height="100%"
      language={monacoLanguage(file.language)}
      value={file.content}
      theme={theme}
      onChange={(val) => onChange(val ?? '')}
      onMount={handleMount}
      options={{
        fontSize,
        wordWrap: wordWrap ? 'on' : 'off',
        minimap: { enabled: minimap },
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        tabSize: 2,
        automaticLayout: true,
        formatOnPaste: true,
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
        folding: true,
        bracketPairColorization: { enabled: true },
        padding: { top: 8 },
      }}
    />
  )
}

function monacoLanguage(lang: string): string {
  const map: Record<string, string> = {
    javascript: 'javascript',
    typescript: 'typescript',
    html:       'html',
    css:        'css',
    react:      'typescriptreact',
    vue:        'html',
  }
  return map[lang] ?? 'plaintext'
}
