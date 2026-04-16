import { useEffect, useRef, useCallback } from 'react'
import { useInView } from 'react-intersection-observer'
import PostCard from '@components/shared/PostCard'
import Spinner from '@components/ui/Spinner'
import { usePostStore } from '@store/postStore'

interface FeedProps {
  tab: string
  tag: string
}

export default function Feed({ tab, tag }: FeedProps) {
  const { posts, isLoading, hasNextPage, fetchPosts, likePost, savePost } = usePostStore()
  const { ref, inView } = useInView({ threshold: 0.1 })

  useEffect(() => {
    fetchPosts({ tab, tag, page: 1 })
  }, [tab, tag, fetchPosts])

  useEffect(() => {
    if (inView && hasNextPage && !isLoading) {
      fetchPosts({ tab, tag })
    }
  }, [inView, hasNextPage, isLoading, tab, tag, fetchPosts])

  if (isLoading && posts.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!isLoading && posts.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium mb-2">Gönderi bulunamadı</p>
        <p className="text-sm">Henüz bu filtreye göre gönderi yok.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onLike={likePost}
          onSave={savePost}
        />
      ))}

      {/* Infinite scroll trigger */}
      <div ref={ref} className="flex justify-center py-4">
        {isLoading && <Spinner />}
      </div>
    </div>
  )
}
