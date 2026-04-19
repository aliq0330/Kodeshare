import { useState, useEffect } from 'react'
import { X, Clock, ArrowRight } from 'lucide-react'
import Spinner from '@components/ui/Spinner'
import { postService } from '@services/postService'
import { timeAgo } from '@utils/formatters'
import type { Post, PostPreview } from '@/types'

interface PostEditHistoryModalProps {
  open: boolean
  onClose: () => void
  post: Post | PostPreview
}

export default function PostEditHistoryModal({ open, onClose, post }: PostEditHistoryModalProps) {
  const [edit, setEdit]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    postService.getPostEdit(post.id)
      .then(setEdit)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open, post.id])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl card shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <h2 className="font-semibold text-white">Düzenleme Geçmişi</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-500 hover:text-white hover:bg-surface-raised transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner /></div>
          ) : !edit ? (
            <p className="text-center text-gray-500 py-8">Düzenleme geçmişi bulunamadı</p>
          ) : (
            <>
              {edit.edited_at && (
                <p className="text-xs text-gray-500 mb-4 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {timeAgo(edit.edited_at)} düzenlendi
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-start">
                {/* Orijinal */}
                <div className="card-raised p-4 flex flex-col gap-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Orijinal</p>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1">Başlık</p>
                    <p className="text-sm text-white font-medium">{edit.original_title}</p>
                  </div>
                  {edit.original_description && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1">Açıklama</p>
                      <p className="text-sm text-gray-300 line-clamp-4">{edit.original_description}</p>
                    </div>
                  )}
                  {edit.original_tags?.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1">Etiketler</p>
                      <div className="flex flex-wrap gap-1">
                        {edit.original_tags.map((t: string) => (
                          <span key={t} className="tag">#{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className="flex items-center justify-center py-4 sm:py-0 sm:mt-10">
                  <ArrowRight className="w-5 h-5 text-gray-500 rotate-90 sm:rotate-0" />
                </div>

                {/* Güncel */}
                <div className="card-raised p-4 flex flex-col gap-3 border-brand-700/40">
                  <p className="text-xs font-semibold text-brand-400 uppercase tracking-wider">Güncel</p>
                  <div>
                    <p className="text-[10px] text-gray-600 mb-1">Başlık</p>
                    <p className="text-sm text-white font-medium">{post.title}</p>
                  </div>
                  {post.description && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1">Açıklama</p>
                      <p className="text-sm text-gray-300 line-clamp-4">{post.description}</p>
                    </div>
                  )}
                  {post.tags.length > 0 && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-1">Etiketler</p>
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((t) => (
                          <span key={t} className="tag">#{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
