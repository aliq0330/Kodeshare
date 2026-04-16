import { Search } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import type { Conversation } from '@/types'

interface ChatListProps {
  activeId: string | null
  onSelect: (id: string) => void
}

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: '1',
    participants: [{ id: '2', username: 'ayse_dev', displayName: 'Ayşe Kaya', avatarUrl: null, isVerified: false, isOnline: true }],
    lastMessage: { id: 'm1', conversationId: '1', content: 'Merhaba! Projen harika görünüyor 🔥', sender: { id: '2', username: 'ayse_dev', displayName: 'Ayşe', avatarUrl: null, isVerified: false, isOnline: true }, status: 'read', createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
    unreadCount: 0,
    updatedAt: new Date(Date.now() - 5 * 60_000).toISOString(),
  },
  {
    id: '2',
    participants: [{ id: '3', username: 'mehmet_css', displayName: 'Mehmet Demir', avatarUrl: null, isVerified: true, isOnline: false }],
    lastMessage: { id: 'm2', conversationId: '2', content: 'CSS animasyonunu nasıl yaptın?', sender: { id: '3', username: 'mehmet_css', displayName: 'Mehmet', avatarUrl: null, isVerified: true, isOnline: false }, status: 'delivered', createdAt: new Date(Date.now() - 2 * 3600_000).toISOString() },
    unreadCount: 2,
    updatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  },
]

export default function ChatList({ activeId, onSelect }: ChatListProps) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Ara..."
            className="w-full bg-surface-raised border border-surface-border rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {MOCK_CONVERSATIONS.map((conv) => {
          const other = conv.participants[0]
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
                <p className="text-xs text-gray-500 truncate">{conv.lastMessage?.content}</p>
              </div>
              {conv.unreadCount > 0 && (
                <span className="w-5 h-5 bg-brand-500 rounded-full text-xs font-bold flex items-center justify-center text-white shrink-0">
                  {conv.unreadCount}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
