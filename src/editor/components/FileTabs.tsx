import { IconX } from '@tabler/icons-react'
import { cn } from '@utils/cn'
import { LANGUAGE_COLORS } from '@utils/constants'
import type { EditorFile } from '@/types'

interface FileTabsProps {
  files: EditorFile[]
  activeFileId: string | null
  onSelect: (id: string) => void
  onClose: (id: string) => void
}

export default function FileTabs({ files, activeFileId, onSelect, onClose }: FileTabsProps) {
  return (
    <div className="file-tabs">
      {files.map((file) => {
        const ext = file.name.split('.').pop() ?? ''
        const color = LANGUAGE_COLORS[file.language] ?? '#8b9ab5'
        return (
          <div
            key={file.id}
            className={cn('file-tab', file.id === activeFileId && 'active')}
            onClick={() => onSelect(file.id)}
          >
            <span style={{ color }} className="text-[10px] font-bold uppercase">
              {ext}
            </span>
            <span>{file.name}</span>
            {file.isModified && (
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 ml-0.5" />
            )}
            <button
              className="close-btn ml-1 p-0.5 rounded hover:bg-[#2a3347] text-gray-500 hover:text-gray-300"
              onClick={(e) => { e.stopPropagation(); onClose(file.id) }}
            >
              <IconX className="w-3 h-3" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
