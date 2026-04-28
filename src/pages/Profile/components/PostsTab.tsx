import { useEffect, useState } from 'react'
import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import { usePostStore } from '@store/postStore'
import type { PostPreview } from '@/types'

interface PostsTabProps { username: string }

export default function PostsTab({ username }: PostsTabProps) {
  const { likePost, savePost } = usePostStore()
  const [posts, setPosts] = useState<PostPreview[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    postService.getUserPosts(username)
      .then((res) => setPosts(res.data))
      .catch(() => setPosts([]))
      .finally(() => setIsLoading(false))
  }, [username])

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (posts.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <p className="font-medium">Henüz gönderi yok</p>
        <p className="text-sm mt-1">İlk gönderiyi paylaş!</p>
      </div>
    )
  }

  return (
    <div className="-mx-4 lg:mx-0 flex flex-col">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} onLike={likePost} onSave={savePost} />
      ))}
    </div>
  )
}
