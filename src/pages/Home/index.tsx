import { useState } from 'react'
import Tabs from '@components/ui/Tabs'
import { FEED_TABS } from '@utils/constants'
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
      <h1 className="text-xl font-bold text-white px-1 pt-1 pb-2">Ana Sayfa</h1>

      <div className="sticky top-14 z-10 bg-surface -mx-4 lg:mx-0 px-4 lg:px-0">
        <Tabs
          tabs={FEED_TABS.map((t) => ({ id: t.id, label: t.label }))}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
        <TagFilter tags={TAGS} activeTag={activeTag} onChange={setActiveTag} />
      </div>

      <Feed tab={activeTab} tag={activeTag} />
    </div>
  )
}
