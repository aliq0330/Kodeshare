import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Smile } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import TypingIndicator from '@messages/TypingIndicator'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import type { Message } from '@/types'

interface ChatWindowProps {
  conversationId: string
  onBack: () => void
}

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', conversationId: '1', content: 'Merhaba! Projen harika görünüyor 🔥', sender: { id: '2', username: 'ayse_dev', displayName: 'Ayşe Kaya', avatarUrl: null, isVerified: false, isOnline: true }, status: 'read', createdAt: new Date(Date.now() - 10 * 60_000).toISOString() },
  { id: 'm2', conversationId: '1', content: 'Teşekkürler! Monaco editor entegrasyonu biraz uğraştırdı ama oldu 😄', sender: { id: '1', username: 'ben', displayName: 'Ben', avatarUrl: null, isVerified: false, isOnline: true }, status: 'read', createdAt: new Date(Date.now() - 8 * 60_000).toISOString() },
  { id: 'm3', conversationId: '1', content: 'Canlı preview özelliğini nasıl yaptın?', sender: { id: '2', username: 'ayse_dev', displayName: 'Ayşe Kaya', avatarUrl: null, isVerified: false, isOnline: true }, status: 'read', createdAt: new Date(Date.now() - 5 * 60_000).toISOString() },
]

const CURRENT_USER_ID = '1'

export default function ChatWindow({ conversationId: _, onBack }: ChatWindowProps) {
  const [messages] = useState<Message[]>(MOCK_MESSAGES)
  const [text, setText] = useState('')
  const [isTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const other = messages[0]?.sender.id !== CURRENT_USER_ID ? messages[0]?.sender : messages[1]?.sender

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!text.trim()) return
    // dispatch to store / socket
    setText('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-border shrink-0">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded-lg hover:bg-surface-raised text-gray-400">
          <ArrowLeft className="w-4 h-4" />
        </button>
        {other && (
          <>
            <Avatar src={other.avatarUrl} alt={other.displayName} size="sm" online={other.isOnline} />
            <div>
              <p className="font-medium text-white text-sm">{other.displayName}</p>
              <p className="text-xs text-gray-500">{other.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
            </div>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map((msg) => {
          const isMine = msg.sender.id === CURRENT_USER_ID
          return (
            <div key={msg.id} className={cn('flex gap-2 max-w-[70%]', isMine ? 'ml-auto flex-row-reverse' : '')}>
              {!isMine && <Avatar src={msg.sender.avatarUrl} alt={msg.sender.displayName} size="xs" className="mt-1 shrink-0" />}
              <div>
                <div className={cn('px-3 py-2 rounded-2xl text-sm', isMine ? 'bg-brand-600 text-white rounded-tr-sm' : 'bg-surface-raised text-gray-200 rounded-tl-sm')}>
                  {msg.content}
                </div>
                <p className={cn('text-[10px] text-gray-600 mt-0.5', isMine ? 'text-right' : '')}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            </div>
          )
        })}
        {isTyping && (
          <div className="flex gap-2 items-center">
            {other && <Avatar src={other.avatarUrl} alt={other.displayName} size="xs" />}
            <TypingIndicator />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-surface-border shrink-0">
        <div className="flex items-center gap-2 bg-surface-raised border border-surface-border rounded-xl px-3 py-2">
          <button className="text-gray-500 hover:text-gray-300 transition-colors">
            <Smile className="w-5 h-5" />
          </button>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Mesaj yaz..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
