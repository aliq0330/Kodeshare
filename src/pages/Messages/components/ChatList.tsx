import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useMessageStore } from '@store/messageStore'
import { useAuthStore } from '@store/authStore'
import { POST_SHARE_PREFIX, type PostShareData } from '@modules/social/ShareModal'

function formatLastMessage(content: string, senderId: string, myId?: string): string {
  if (content.startsWith(POST_SHARE_PREFIX)) {
    try {
      const data = JSON.parse(content.slice(POST_SHARE_PREFIX.length)) as PostShareData
      const who = senderId === myId ? 'Bir' : `${data.author.displayName} adlı kişinin`
      return `📎 ${who} gönderisini paylaştı`
    } catch {
      return '📎 Bir gönderi paylaştı'
    }
  }
  return content
}

interface ChatListProps {
  activeId: string | null
  onSelect: (id: string) => void
}

export default function ChatList({ activeId, onSelect }: ChatListProps) {
  const { user } = useAuthStore()
  const { conversations, isLoading, fetchConversations } = useMessageStore()
  const [query, setQuery] = useState('')

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  const filtered = query
    ? conversations.filter((c) =>
        c.participants.some((p) => p.displayName.toLowerCase().includes(query.toLowerCase()))
      )
    : conversations

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ara..."
            className="w-full bg-surface-raised border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8"><Spinner /></div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            {query ? 'Sonuç bulunamadı' : 'Henüz mesaj yok'}
          </div>
        ) : (
          filtered.map((conv) => {
            const other = conv.participants.find((p) => p.id !== user?.id) ?? conv.participants[0]
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-raised transition-colors text-left',
                  activeId === conv.id && 'bg-surface-raised',
                )}
              >
                <Avatar src={other.avatarUrl} alt={other.displayName} size="md" online={other.isOnline} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-medium text-white text-sm truncate">{other.displayName}</span>
                    <span className="text-xs text-gray-600 shrink-0">
                      {conv.lastMessage ? timeAgo(conv.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">
                    {conv.lastMessage ? formatLastMessage(conv.lastMessage.content, conv.lastMessage.sender.id, user?.id) : ''}
                  </p>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="w-5 h-5 bg-brand-500 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0">
                    {conv.unreadCount}
                  </span>
                )}
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}
