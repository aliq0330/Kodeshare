import { useState, useRef } from 'react'
import { Maximize2, RefreshCw } from 'lucide-react'
import Button from '@components/ui/Button'
import type { PostFile } from '@/types'

interface CodePreviewProps {
  files: PostFile[]
  className?: string
}

function buildSrcdoc(files: PostFile[]): string {
  const html = files.find((f) => f.language === 'html')?.content ?? ''
  const css  = files.filter((f) => f.language === 'css').map((f) => f.content).join('\n')
  const js   = files.filter((f) => f.language === 'javascript' || f.language === 'typescript').map((f) => f.content).join('\n')

  return `<!doctype html>
<html>
<head><meta charset="utf-8" /><style>${css}</style></head>
<body>${html}<script>${js}<\/script></body>
</html>`
}

export default function CodePreview({ files, className }: CodePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [key, setKey] = useState(0)

  const refresh = () => setKey((k) => k + 1)

  return (
    <div className={`relative bg-white rounded-lg overflow-hidden ${className ?? ''}`}>
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <Button variant="ghost" size="xs" className="bg-black/20 backdrop-blur-sm" onClick={refresh}>
          <RefreshCw className="w-3 h-3" />
        </Button>
        <Button variant="ghost" size="xs" className="bg-black/20 backdrop-blur-sm">
          <Maximize2 className="w-3 h-3" />
        </Button>
      </div>
      <iframe
        key={key}
        ref={iframeRef}
        srcDoc={buildSrcdoc(files)}
        sandbox="allow-scripts allow-same-origin"
        className="w-full h-full border-0"
        title="Live Preview"
      />
    </div>
  )
}
