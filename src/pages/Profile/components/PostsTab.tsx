import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'

interface PostsTabProps { username: string }

export default function PostsTab({ username: _ }: PostsTabProps) {
  const isLoading = false
  const posts: never[] = []

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
    <div className="flex flex-col gap-4">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
