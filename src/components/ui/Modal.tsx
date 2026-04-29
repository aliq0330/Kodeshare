import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  titleAction?: ReactNode
  subheader?: ReactNode
  children: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full' | 'fullscreen'
  className?: string
}

const sizes: Record<string, string> = {
  sm:   'max-w-sm',
  md:   'max-w-md',
  lg:   'max-w-lg',
  xl:   'max-w-2xl',
  full: 'max-w-4xl',
  fullscreen: '',
}

export default function Modal({ open, onClose, title, titleAction, subheader, children, size = 'md', className }: ModalProps) {
  const isFullscreen = size === 'fullscreen'

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex',
        isFullscreen ? '' : 'items-center justify-center p-4',
      )}
    >
      {!isFullscreen && (
        <div
          className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />
      )}
      <div
        className={cn(
          'relative w-full bg-surface-card flex flex-col animate-slide-up z-10',
          isFullscreen
            ? 'h-full max-h-full rounded-none'
            : 'card shadow-2xl max-h-[calc(100dvh-2rem)]',
          sizes[size],
          className,
        )}
      >
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-surface-border shrink-0">
            <h2 className="text-base font-semibold">{title}</h2>
            <div className="flex items-center gap-2">
              {titleAction}
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
        {subheader && (
          <div className="shrink-0 border-b border-surface-border">
            {subheader}
          </div>
        )}
        <div className={cn('overflow-y-auto', isFullscreen ? 'flex-1 flex flex-col p-4' : 'p-5')}>
          {children}
        </div>
      </div>
    </div>
  )
}
