import { useEffect, useState } from 'react'
import PostCard from '@components/shared/PostCard'
import ArticleCard from '@components/shared/ArticleCard'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import { articleService } from '@services/articleService'
import { usePostStore } from '@store/postStore'
import type { PostPreview } from '@/types'
import type { ArticleRecord } from '@services/articleService'

interface LikesTabProps { username: string }

export default function LikesTab({ username }: LikesTabProps) {
  const { likePost, savePost } = usePostStore()
  const [posts, setPosts]       = useState<PostPreview[]>([])
  const [articles, setArticles] = useState<ArticleRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    Promise.all([
      postService.getLikedPosts(username),
      articleService.getLikedArticles(username),
    ])
      .then(([p, a]) => { setPosts(p); setArticles(a) })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [username])

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  if (posts.length === 0 && articles.length === 0) {
    return (
      <div className="card p-10 text-center text-gray-500">
        <p className="font-medium">Henüz beğenilen içerik yok</p>
        <p className="text-sm mt-1">Beğenilen gönderiler ve makaleler burada görünür.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {posts.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Gönderiler</h3>
          <div className="-mx-4 lg:mx-0 flex flex-col">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={likePost} onSave={savePost} />
            ))}
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">Makaleler</h3>
          <div className="-mx-4 lg:mx-0 flex flex-col">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
