import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import { usePostStore } from '@store/postStore'
import { useEffect } from 'react'

interface ProjectGridProps {
  query: string
  category: string
}

export default function ProjectGrid({ query, category }: ProjectGridProps) {
  const { posts, isLoading, fetchPosts, likePost, savePost } = usePostStore()

  useEffect(() => {
    fetchPosts({ tab: 'latest', tag: category !== 'all' ? category : undefined, query })
  }, [query, category, fetchPosts])

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" /></div>
  }

  if (posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="font-medium">Sonuç bulunamadı</p>
        <p className="text-sm mt-1">Farklı bir arama deneyin.</p>
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
