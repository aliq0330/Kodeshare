import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'

export default function WeeklyTop() {
  // Replace with real data from store/service
  const isLoading = false
  const posts: never[] = []

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (posts.length === 0) {
    return (
      <div className="card p-8 text-center text-gray-500">
        Haftanın gönderileri yükleniyor...
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {posts.map((post: any) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}
