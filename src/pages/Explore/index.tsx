import { useState, useEffect, useRef } from 'react'
import { IconSearch } from '@tabler/icons-react'
import { useSearchParams, useLocation } from 'react-router-dom'
import Input from '@components/ui/Input'
import TagFilter from '@components/shared/TagFilter'
import ProjectGrid from './components/ProjectGrid'
import SuggestedUsers from './components/SuggestedUsers'
import { EXPLORE_CATEGORIES } from '@utils/constants'
import { useDebounce } from '@hooks/useDebounce'

export default function ExplorePage() {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(searchParams.get('tag') ?? 'all')
  const debouncedQuery = useDebounce(query, 400)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setActiveCategory(searchParams.get('tag') ?? 'all')
  }, [searchParams])

  useEffect(() => {
    if ((location.state as { focusSearch?: boolean } | null)?.focusSearch) {
      inputRef.current?.focus()
    }
  }, [location.state])

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1">Keşfet</h1>
        <p className="text-gray-500 text-sm">Binlerce proje ve geliştiriciyi keşfet</p>
      </div>

      {/* Search */}
      <Input
        ref={inputRef}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Proje, kullanıcı veya etiket ara..."
        leftIcon={<IconSearch className="w-4 h-4" />}
      />

      {/* Category filter */}
      <TagFilter
        tags={[
          ...EXPLORE_CATEGORIES.map((c) => ({ id: c.id, label: c.label })),
          ...(activeCategory !== 'all' && !EXPLORE_CATEGORIES.some((c) => c.id === activeCategory)
            ? [{ id: activeCategory, label: `#${activeCategory}` }]
            : []),
        ]}
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
