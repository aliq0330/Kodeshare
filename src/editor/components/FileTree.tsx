import { useState } from 'react'
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react'
import { cn } from '@utils/cn'
import { LANGUAGE_COLORS } from '@utils/constants'
import type { EditorFile } from '@/types'

interface FileTreeProps {
  files: EditorFile[]
  activeFileId: string | null
  onSelect: (id: string) => void
  onAddFile: () => void
  onDeleteFile: (id: string) => void
}

function FileIcon({ language, name }: { language: string; name: string }) {
  const color = LANGUAGE_COLORS[language] ?? '#8b9ab5'
  const ext = name.split('.').pop() ?? ''
  return (
    <span className="text-[9px] font-bold px-0.5 rounded" style={{ color, border: `1px solid ${color}33` }}>
      {ext.toUpperCase().slice(0, 3)}
    </span>
  )
}

export default function FileTree({ files, activeFileId, onSelect, onAddFile, onDeleteFile }: FileTreeProps) {
  const [hovered, setHovered] = useState<string | null>(null)

  return (
    <div className="file-tree py-2">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1 mb-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600">Explorer</span>
        <button
          onClick={onAddFile}
          title="Yeni Dosya"
          className="p-1 rounded hover:bg-[#1e2535] text-gray-500 hover:text-gray-300 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {files.map((file) => (
        <div
          key={file.id}
          onMouseEnter={() => setHovered(file.id)}
          onMouseLeave={() => setHovered(null)}
          className={cn('file-tree-item justify-between group', file.id === activeFileId && 'active')}
          onClick={() => onSelect(file.id)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <FileIcon language={file.language} name={file.name} />
            <span className="truncate text-[13px]">{file.name}</span>
            {file.isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 shrink-0" />
            )}
          </div>
          {hovered === file.id && (
            <button
              onClick={(e) => { e.stopPropagation(); onDeleteFile(file.id) }}
              className="p-0.5 rounded hover:bg-red-900/40 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      ))}

      {files.length === 0 && (
        <p className="px-3 py-4 text-[12px] text-gray-600 text-center">
          Dosya yok — + ile ekle
        </p>
      )}
    </div>
  )
}
