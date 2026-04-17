import { useEffect, useState } from 'react'
import PostCard from '@components/shared/PostCard'
import Badge from '@components/ui/Badge'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import type { PostPreview } from '@/types'

export default function EditorsPick() {
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    postService.getFeed({ tab: 'trending' })
      .then((res) => setPosts(res.data.slice(0, 4)))
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 border-brand-500/30 bg-gradient-to-br from-brand-900/20 to-transparent">
        <Badge variant="brand" className="mb-3">Editör Seçimi</Badge>
        <p className="text-gray-400 text-sm">
          Editörlerimiz bu haftanın en yaratıcı ve öğretici kodlarını seçiyor.
          Buraya çıkmak için harika projeler paylaşmaya devam edin!
        </p>
      </div>
      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
