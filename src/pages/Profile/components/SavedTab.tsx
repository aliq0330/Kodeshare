import { useEffect, useState } from 'react'
import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import { usePostStore } from '@store/postStore'
import type { PostPreview } from '@/types'

export default function SavedTab() {
  const { likePost, savePost } = usePostStore()
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    postService.getSavedPosts()
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (posts.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <p className="font-medium">Henüz kaydedilen gönderi yok</p>
        <p className="text-sm mt-1">Gönderilerdeki yer imi ikonuna tıklayarak kaydedebilirsin.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={likePost} onSave={savePost} />
      ))}
    </div>
  )
}
