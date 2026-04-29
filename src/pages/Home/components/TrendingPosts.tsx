import { Link } from 'react-router-dom'
import { IconTrendingUp, IconHeart } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import { compactNumber } from '@utils/formatters'
import type { PostPreview } from '@/types'

interface TrendingPostsProps {
  posts: PostPreview[]
}

export default function TrendingPosts({ posts }: TrendingPostsProps) {
  if (posts.length === 0) return null

  return (
    <div className="card p-4">
      <h3 className="flex items-center gap-2 text-sm font-semibold mb-4">
        <IconTrendingUp className="w-4 h-4 text-brand-400" />
        Bu Hafta Trend
      </h3>
      <div className="flex flex-col gap-3">
        {posts.map((post, i) => (
          <Link key={post.id} to={`/post/${post.id}`} className="flex items-center gap-3 group">
            <span className="text-xl font-bold text-gray-700 w-6 text-center">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                {post.title}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <Avatar src={post.author.avatarUrl} alt={post.author.displayName} size="xs" />
                <span className="text-xs text-gray-500">{post.author.username}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 shrink-0">
              <IconHeart className="w-3 h-3" />
              {compactNumber(post.likesCount)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
