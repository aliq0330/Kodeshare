import { useState } from 'react'
import Tabs from '@components/ui/Tabs'
import { FEED_TABS } from '@utils/constants'
import Feed from './components/Feed'
import TrendingPosts from './components/TrendingPosts'
import PostComposer from '@modules/post/PostComposer'
import TagFilter from '@components/shared/TagFilter'
import { useAuthStore } from '@store/authStore'

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
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)

  return (
    <div className="flex flex-col gap-4 max-w-2xl mx-auto">
      {/* Post composer */}
      {isAuthenticated && <PostComposer />}

      {/* Feed tabs */}
      <Tabs
        tabs={FEED_TABS.map((t) => ({ id: t.id, label: t.label }))}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tag filter */}
      <TagFilter tags={TAGS} activeTag={activeTag} onChange={setActiveTag} />

      {/* Feed */}
      <Feed tab={activeTab} tag={activeTag} />
    </div>
  )
}
