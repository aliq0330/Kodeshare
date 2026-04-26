import { cn } from '@utils/cn'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps {
  src: string | null | undefined
  alt: string
  size?: AvatarSize
  className?: string
  online?: boolean
}

const sizes: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-lg',
  xl: 'w-20 h-20 text-2xl',
}

const dotSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

export default function Avatar({ src, alt, size = 'md', className, online }: AvatarProps) {
  const initials = alt
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className={cn('relative inline-flex shrink-0', sizes[size], className)}>
      {src ? (
        <img
          src={src}
          alt={alt}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div className="w-full h-full rounded-full bg-surface-raised border border-surface-border flex items-center justify-center text-gray-500 font-semibold">
          {initials}
        </div>
      )}
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-surface',
            dotSizes[size],
            online ? 'bg-green-400' : 'bg-gray-500',
          )}
        />
      )}
    </div>
  )
}
