import { Link } from 'react-router-dom'
import { IconFolder, IconLock, IconWorld } from '@tabler/icons-react'
import Badge from '@components/ui/Badge'
import { timeAgo } from '@utils/formatters'
import type { Collection } from '@/types'

interface CollectionCardProps {
  collection: Collection
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  return (
    <Link
      to={`/collection/${collection.id}`}
      className="card p-4 flex flex-col gap-3 hover:border-brand-500/50 transition-colors group"
    >
      {/* Cover or icon */}
      {collection.coverUrl ? (
        <div className="aspect-video rounded-lg overflow-hidden bg-surface-raised">
          <img src={collection.coverUrl} alt={collection.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="aspect-video rounded-lg bg-gradient-to-br from-brand-900/40 to-surface-raised flex items-center justify-center">
          <IconFolder className="w-10 h-10 text-brand-700" />
        </div>
      )}

      <div>
        <div className="flex items-center justify-between gap-2 mb-1">
          <h3 className="font-semibold text-white group-hover:text-brand-300 transition-colors truncate">
            {collection.name}
          </h3>
          {collection.visibility === 'private' ? (
            <IconLock className="w-3.5 h-3.5 text-gray-500 shrink-0" />
          ) : (
            <IconWorld className="w-3.5 h-3.5 text-gray-600 shrink-0" />
          )}
        </div>

        {collection.description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{collection.description}</p>
        )}

        <div className="flex items-center justify-between">
          <Badge variant="default">{collection.postsCount} gönderi</Badge>
          <span className="text-xs text-gray-600">{timeAgo(collection.updatedAt)}</span>
        </div>
      </div>
    </Link>
  )
}
