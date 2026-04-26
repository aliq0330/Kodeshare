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
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-white">Ana Sayfa</h1>
      <Tabs
        tabs={FEED_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />
      <TagFilter tags={TAGS} activeTag={activeTag} onChange={setActiveTag} />
      <Feed tab={activeTab} tag={activeTag} />
    </div>
  )
}
