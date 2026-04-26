import { cn } from '@utils/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, onChange, className }: TabsProps) {
  return (
    <div className={cn('overflow-x-auto overflow-y-hidden scrollbar-none border-b border-surface-border', className)}>
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors whitespace-nowrap',
              activeTab === tab.id
                ? 'border-gray-900 text-white font-semibold'
                : 'border-transparent text-gray-400 hover:text-gray-300',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-xs px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-surface-raised text-gray-900' : 'bg-surface-raised text-gray-500',
              )}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
