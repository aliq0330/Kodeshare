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
    <div className={cn('border-b border-surface-border', className)}>
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-1 pt-2 pb-2.5">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => onChange(tag.id)}
            className={cn(
              'shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors',
              activeTag === tag.id
                ? 'bg-black text-[#fff] dark:bg-white dark:text-[#000]'
                : 'bg-surface-raised border border-surface-border text-gray-900 dark:text-[#fff] hover:bg-surface-border',
            )}
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  )
}
