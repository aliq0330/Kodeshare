import { useState } from 'react'
import { Search } from 'lucide-react'
import Input from '@components/ui/Input'
import TagFilter from '@components/shared/TagFilter'
import ProjectGrid from './components/ProjectGrid'
import SuggestedUsers from './components/SuggestedUsers'
import { EXPLORE_CATEGORIES } from '@utils/constants'

export default function ExplorePage() {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Keşfet</h1>
        <p className="text-gray-500 text-sm">Binlerce proje ve geliştiriciyi keşfet</p>
      </div>

      {/* Search */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Proje, kullanıcı veya etiket ara..."
        leftIcon={<Search className="w-4 h-4" />}
      />

      {/* Category filter */}
      <TagFilter
        tags={EXPLORE_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))}
        activeTag={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Suggested users */}
      <SuggestedUsers />

      {/* Project grid */}
      <ProjectGrid query={query} category={activeCategory} />
    </div>
  )
}
