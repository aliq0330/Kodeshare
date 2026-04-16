import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Folder, Lock, Plus, Search } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Badge from '@components/ui/Badge'
import PostCard from '@components/shared/PostCard'
import Input from '@components/ui/Input'
import { useState } from 'react'

export default function CollectionDetailPage() {
  const { collectionId: _ } = useParams<{ collectionId: string }>()
  const [query, setQuery] = useState('')

  const collection = {
    id: '1',
    name: 'UI Components',
    description: 'Beğendiğim ve kullandığım UI bileşenleri',
    visibility: 'public' as const,
    postsCount: 24,
    owner: { id: '1', username: 'ayse_dev', displayName: 'Ayşe Kaya', avatarUrl: null as null, isVerified: false, isOnline: true },
    posts: [] as any[],
  }

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-brand-900/40 flex items-center justify-center">
              <Folder className="w-6 h-6 text-brand-400" />
            </div>
            <div>
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
          <Button variant="primary" size="sm">
            <Plus className="w-4 h-4" />
            Düzenle
          </Button>
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
      {collection.posts.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <Folder className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="font-medium">Koleksiyon boş</p>
          <p className="text-sm mt-1">Gönderileri kaydet butonuna basarak buraya ekleyebilirsin</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {collection.posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
