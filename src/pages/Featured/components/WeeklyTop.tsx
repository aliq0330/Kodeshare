import { useEffect, useState } from 'react'
import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import type { PostPreview } from '@/types'

export default function WeeklyTop() {
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    postService.getWeeklyTop(6)
      .then(setPosts)
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (posts.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        Bu hafta henüz gönderi yok.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
