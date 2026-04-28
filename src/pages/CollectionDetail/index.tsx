import { useEffect, useState, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Folder, Lock, Search } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Badge from '@components/ui/Badge'
import PostCard from '@components/shared/PostCard'
import ArticleCard from '@components/shared/ArticleCard'
import Input from '@components/ui/Input'
import Spinner from '@components/ui/Spinner'
import { collectionService } from '@services/collectionService'
import { articleService } from '@services/articleService'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import type { Collection, PostPreview } from '@/types'
import type { ArticleRecord } from '@services/articleService'

export default function CollectionDetailPage() {
  const { collectionId } = useParams<{ collectionId: string }>()
  const { user } = useAuthStore()
  const [collection, setCollection] = useState<Collection | null>(null)
  const [posts, setPosts]           = useState<PostPreview[]>([])
  const [articles, setArticles]     = useState<ArticleRecord[]>([])
  const [isLoading, setIsLoading]   = useState(true)
  const [query, setQuery]           = useState('')
  const [removing, setRemoving]     = useState<string | null>(null)

  useEffect(() => {
    if (!collectionId) return
    setIsLoading(true)
    Promise.all([
      collectionService.getCollection(collectionId),
      collectionService.getCollectionPosts(collectionId),
      articleService.getCollectionArticles(collectionId),
    ])
      .then(([col, colPosts, colArticles]) => {
        setCollection(col)
        setPosts(colPosts)
        setArticles(colArticles)
      })
      .catch(() => {})
      .finally(() => setIsLoading(false))
  }, [collectionId])

  const isOwner = !!user && !!collection && user.id === collection.owner.id

  const removePost = async (postId: string) => {
    if (!collectionId) return
    setRemoving(postId)
    try {
      await collectionService.removePost(collectionId, postId)
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      toast.success('Koleksiyondan çıkarıldı')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setRemoving(null)
    }
  }

  const removeArticle = async (articleId: string) => {
    if (!collectionId) return
    setRemoving(articleId)
    try {
      await collectionService.removeArticle(collectionId, articleId)
      setArticles((prev) => prev.filter((a) => a.id !== articleId))
      toast.success('Koleksiyondan çıkarıldı')
    } catch {
      toast.error('Bir hata oluştu')
    } finally {
      setRemoving(null)
    }
  }

  const filteredPosts = useMemo(() => {
    if (!query.trim()) return posts
    const q = query.toLowerCase()
    return posts.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
  }, [posts, query])

  const filteredArticles = useMemo(() => {
    if (!query.trim()) return articles
    const q = query.toLowerCase()
    return articles.filter((a) =>
      a.title.toLowerCase().includes(q) || a.subtitle?.toLowerCase().includes(q),
    )
  }, [articles, query])

  if (isLoading) return <div className="flex justify-center py-20"><Spinner /></div>

  if (!collection) {
    return (
      <div className="card p-12 text-center text-gray-500">
        <p className="font-medium">Koleksiyon bulunamadı</p>
      </div>
    )
  }

  const totalCount = filteredPosts.length + filteredArticles.length
  const isEmpty    = posts.length === 0 && articles.length === 0

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-6">
      <Link to="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors w-fit">
        <ArrowLeft className="w-4 h-4" />
        Geri Dön
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-900/40 flex items-center justify-center shrink-0">
            <Folder className="w-6 h-6 text-brand-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">{collection.name}</h1>
              {collection.visibility === 'private' && <Lock className="w-4 h-4 text-gray-500" />}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <Link to={`/profile/${collection.owner.username}`} className="flex items-center gap-1.5">
                <Avatar src={collection.owner.avatarUrl} alt={collection.owner.displayName} size="xs" />
                <span className="text-xs text-gray-500">{collection.owner.displayName}</span>
              </Link>
              <span className="text-gray-700">·</span>
              <Badge variant="default">{posts.length + articles.length} öğe</Badge>
            </div>
          </div>
        </div>
        {collection.description && (
          <p className="text-sm text-gray-400 mt-4">{collection.description}</p>
        )}
      </div>

      {/* Search */}
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Koleksiyon içinde ara..."
        leftIcon={<Search className="w-4 h-4" />}
      />

      {/* Empty state */}
      {isEmpty ? (
        <div className="card p-12 text-center text-gray-500">
          <Folder className="w-10 h-10 mx-auto mb-3 text-gray-700" />
          <p className="font-medium">Koleksiyon boş</p>
          <p className="text-sm mt-1">Gönderi veya makaleleri buraya ekleyebilirsin</p>
        </div>
      ) : totalCount === 0 ? (
        <div className="card p-12 text-center text-gray-500">
          <p className="font-medium">Arama sonucu bulunamadı</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredPosts.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Gönderiler ({filteredPosts.length})
              </h3>
              <div className="-mx-4 lg:mx-0 flex flex-col">
                {filteredPosts.map((post) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onRemoveFromCollection={isOwner ? () => removePost(post.id) : undefined}
                  />
                ))}
              </div>
            </section>
          )}

          {filteredArticles.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Makaleler ({filteredArticles.length})
              </h3>
              <div className="-mx-4 lg:mx-0 flex flex-col">
                {filteredArticles.map((article) => (
                  <ArticleCard
                    key={article.id}
                    article={article}
                    onRemoveFromCollection={isOwner ? () => removeArticle(article.id) : undefined}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
