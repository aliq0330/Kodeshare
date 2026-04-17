import { useState, useRef } from 'react'
import { RefreshCw, ExternalLink, Smartphone, Monitor, Tablet } from 'lucide-react'
import { cn } from '@utils/cn'
import type { EditorFile } from '@/types'

interface PreviewProps {
  files: EditorFile[]
}

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORTS: { id: Viewport; icon: typeof Monitor; width: string }[] = [
  { id: 'desktop', icon: Monitor,    width: '100%' },
  { id: 'tablet',  icon: Tablet,     width: '768px' },
  { id: 'mobile',  icon: Smartphone, width: '375px' },
]

function buildSrcdoc(files: EditorFile[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? ''
  const css  = files.filter((f) => f.language === 'css').map((f) => f.content).join('\n')
  const js   = files.filter((f) => ['javascript', 'typescript'].includes(f.language)).map((f) => f.content).join('\n')
  return `<!doctype html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}body{margin:0}${css}</style></head><body>${html}<script>${js}<\/script></body></html>`
}

export default function Preview({ files }: PreviewProps) {
  const [key, setKey] = useState(0)
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const iframeRef = useRef<HTMLIFrameElement>(null)

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* Toolbar */}
      <div className="editor-toolbar shrink-0">
        <div className="flex items-center gap-1 bg-[#1e2535] rounded-lg p-0.5">
          {VIEWPORTS.map(({ id, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setViewport(id)}
              className={cn(
                'p-1.5 rounded transition-colors',
                viewport === id ? 'bg-[#2a3347] text-white' : 'text-gray-500 hover:text-gray-300',
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
        <span className="text-xs text-gray-600 ml-2">
          {viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px'}
        </span>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setKey((k) => k + 1)}
            className="p-1.5 rounded hover:bg-[#1e2535] text-gray-500 hover:text-gray-300 transition-colors"
            title="Yenile"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <button
            className="p-1.5 rounded hover:bg-[#1e2535] text-gray-500 hover:text-gray-300 transition-colors"
            title="Yeni sekmede aç"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div className="flex-1 overflow-auto flex items-start justify-center bg-[#1a1a2e] p-4">
        <div
          className="bg-white h-full transition-all duration-300 shadow-2xl rounded"
          style={{ width: VIEWPORTS.find((v) => v.id === viewport)?.width ?? '100%', minHeight: '100%' }}
        >
          <iframe
            key={key}
            ref={iframeRef}
            srcDoc={buildSrcdoc(files)}
            sandbox="allow-scripts allow-same-origin"
            className="preview-frame w-full h-full"
            title="Live Preview"
          />
        </div>
      </div>
    </div>
  )
}
