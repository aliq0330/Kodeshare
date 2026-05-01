import { useState } from 'react'
import { FEED_TABS } from '@utils/constants'
import { cn } from '@utils/cn'
import Feed from './components/Feed'
import TagFilter from '@components/shared/TagFilter'

const TAGS = [
  { id: 'all',  label: 'Tümü' },
  { id: 'react', label: 'React' },
  { id: 'css',   label: 'CSS' },
  { id: 'js',    label: 'JavaScript' },
  { id: 'ui',    label: 'UI' },
  { id: 'animation', label: 'Animasyon' },
]

export default function HomePage() {
  const [activeTab, setActiveTab] = useState('trending')
  const [activeTag, setActiveTag] = useState('all')

  return (
    <div className="flex flex-col max-w-2xl mx-auto">
      <div className="sticky top-14 lg:top-0 z-10 bg-surface -mx-4 lg:mx-0">
        <div className="mx-4 lg:mx-0 mt-3 rounded-xl border border-surface-border overflow-hidden">
          <div className="flex">
            {FEED_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  'flex-1 flex justify-center items-center py-3 text-base border-b-2 transition-colors',
                  activeTab === t.id
                    ? 'border-black dark:border-white text-white font-black'
                    : 'border-transparent text-gray-400 font-medium hover:text-gray-300',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mx-4 lg:mx-0 mt-2 mb-2 rounded-xl border border-surface-border overflow-hidden">
          <TagFilter tags={TAGS} activeTag={activeTag} onChange={setActiveTag} className="border-b-0" />
        </div>
      </div>

      <Feed tab={activeTab} tag={activeTag} />
    </div>
  )
}
