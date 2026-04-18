import { useState } from 'react'
import { Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import Input from '@components/ui/Input'
import TagFilter from '@components/shared/TagFilter'
import ProjectGrid from './components/ProjectGrid'
import SuggestedUsers from './components/SuggestedUsers'
import { EXPLORE_CATEGORIES } from '@utils/constants'
import { useDebounce } from '@hooks/useDebounce'

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('tag') ?? 'all')
  const debouncedQuery = useDebounce(query, 400)

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

      {/* Suggested users / user search results */}
      <SuggestedUsers query={debouncedQuery} />

      {/* Project grid */}
      <ProjectGrid query={debouncedQuery} category={activeCategory} />
    </div>
  )
}
