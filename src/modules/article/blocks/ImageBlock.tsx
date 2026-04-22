import { useRef } from 'react'
import { Image, Upload, X } from 'lucide-react'
import { cn } from '@utils/cn'
import { useArticleStore } from '@store/articleStore'
import type { ArticleBlock } from '@store/articleStore'

interface Props {
  block: ArticleBlock
}

export default function ImageBlock({ block }: Props) {
  const { updateBlock } = useArticleStore()
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = (e) => updateBlock(block.id, { src: e.target?.result as string })
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (block.src) {
    return (
      <figure className="my-2 group relative">
        <div className="relative rounded-xl overflow-hidden">
          <img
            src={block.src}
            alt={block.caption ?? ''}
            className="w-full max-h-[520px] object-cover"
          />
          <button
            onClick={() => updateBlock(block.id, { src: undefined })}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <figcaption className="mt-2 text-center">
          <input
            type="text"
            value={block.caption ?? ''}
            onChange={(e) => updateBlock(block.id, { caption: e.target.value })}
            placeholder="Görsel açıklaması (isteğe bağlı)"
            className="w-full text-sm text-center text-gray-500 bg-transparent border-none outline-none placeholder:text-gray-600"
          />
        </figcaption>
      </figure>
    )
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed',
        'border-surface-border hover:border-brand-500 transition-colors cursor-pointer',
        'py-12 px-6 my-2 group',
      )}
    >
      <div className="p-4 rounded-full bg-surface-raised group-hover:bg-brand-500/10 transition-colors">
        <Image className="w-8 h-8 text-gray-500 group-hover:text-brand-400 transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-gray-300">Görsel ekle</p>
        <p className="text-xs text-gray-600 mt-1">Sürükle bırak veya tıkla · JPG, PNG, GIF, WebP</p>
      </div>
      <div className="flex items-center gap-2 mt-1 px-4 py-2 rounded-lg bg-surface-raised border border-surface-border text-xs text-gray-400 hover:bg-surface-raised/80">
        <Upload className="w-3.5 h-3.5" />
        Dosya Seç
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}
