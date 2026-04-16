import { Link } from 'react-router-dom'
import { Lock, Folder } from 'lucide-react'
import Badge from '@components/ui/Badge'
import type { Collection } from '@/types'

interface CollectionsTabProps { username: string }

export default function CollectionsTab({ username: _ }: CollectionsTabProps) {
  const collections: Collection[] = []

  if (collections.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <Folder className="w-8 h-8 mx-auto mb-2 text-gray-600" />
        <p className="font-medium">Henüz koleksiyon yok</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {collections.map((col) => (
        <Link
          key={col.id}
          to={`/collection/${col.id}`}
          className="card p-4 hover:border-brand-500/50 transition-colors group"
        >
          <div className="flex items-center gap-2 mb-2">
            <Folder className="w-5 h-5 text-brand-400" />
            <span className="font-medium text-white group-hover:text-brand-300 transition-colors">{col.name}</span>
            {col.visibility === 'private' && (
              <Lock className="w-3.5 h-3.5 text-gray-500 ml-auto" />
            )}
          </div>
          {col.description && (
            <p className="text-sm text-gray-500 line-clamp-2 mb-2">{col.description}</p>
          )}
          <Badge variant="default">{col.postsCount} gönderi</Badge>
        </Link>
      ))}
    </div>
  )
}
