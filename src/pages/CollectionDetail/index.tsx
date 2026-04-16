import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Folder, Lock, Search } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import PostCard from '@components/shared/PostCard'
import Input from '@components/ui/Input'
import Spinner from '@components/ui/Spinner'
import { collectionService } from '@services/collectionService'
import type { Collection, PostPreview } from '@/types'

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (!collectionId) return
    setIsLoading(true)
    Promise.all([
      collectionService.getCollection(collectionId),
      collectionService.getCollectionPosts(collectionId),
    ])
      .then(([col, colPosts]) => {
        setCollection(col)
        setPosts(colPosts)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [collectionId])

  const filtered = useMemo(() => {
    if (!query.trim()) return posts
    const q = query.toLowerCase()
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
  }, [posts, query])

  if (isLoading) {
    return <div className="flex justify-center py-20"><Spinner /></div>
  }

  if (!collection) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <p className="font-medium">Koleksiyon bulunamadı</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-900/40 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{collection.name}</h1>
              {collection.visibility === 'private' && (
                <Lock className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Link to={`/profile/${collection.owner.username}`} className="flex items-center gap-1.5">
                <Avatar src={collection.owner.avatarUrl} alt={collection.owner.displayName} size="xs" />
                <span className="text-xs text-gray-500">{collection.owner.displayName}</span>
              </Link>
              <span className="text-gray-700">·</span>
              <Badge variant="default">{collection.postsCount} gönderi</Badge>
            </div>
          </div>
        </div>

        {collection.description && (
          <p className="text-sm text-gray-400 mt-4">{collection.description}</p>
        )}
      </div>

      {/* Search within collection */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Koleksiyon içinde ara..."
        leftIcon={<Search className="w-4 h-4" />}
      />

      {/* Posts */}
      {filtered.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Folder className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="font-medium">{query ? 'Arama sonucu bulunamadı' : 'Koleksiyon boş'}</p>
          {!query && <p className="text-sm mt-1">Gönderileri kaydet butonuna basarak buraya ekleyebilirsin</p>}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
