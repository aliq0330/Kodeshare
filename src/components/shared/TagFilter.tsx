import { cn } from '@utils/cn'

interface Tag {
  id: string
  label: string
}

interface TagFilterProps {
  tags: Tag[]
  activeTag: string
  onChange: (id: string) => void
  className?: string
}

export default function TagFilter({ tags, activeTag, onChange, className }: TagFilterProps) {
  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto scrollbar-none pb-1', className)}>
      {tags.map((tag) => (
        <button
          key={tag.id}
          onClick={() => onChange(tag.id)}
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
            activeTag === tag.id
              ? 'bg-brand-500 text-white'
              : 'bg-surface-raised text-gray-400 hover:text-white hover:bg-surface-border',
          )}
        >
          {tag.label}
        </button>
      ))}
    </div>
  )
}
