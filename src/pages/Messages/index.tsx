import { useState } from 'react'
import { useParams } from 'react-router-dom'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import { cn } from '@utils/cn'

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const [activeId, setActiveId] = useState(conversationId ?? null)

  return (
    <div className="card overflow-hidden flex h-[calc(100dvh-12rem)] lg:h-[calc(100vh-8rem)] -mx-4 lg:mx-0">
      {/* Chat list */}
      <div
        className={cn(
          'w-full lg:w-80 border-r border-surface-border flex flex-col shrink-0',
          activeId ? 'hidden lg:flex' : 'flex',
        )}
      >
        <div className="p-4 border-b border-surface-border">
          <h2 className="font-semibold text-white">Mesajlar</h2>
        </div>
        <ChatList activeId={activeId} onSelect={setActiveId} />
      </div>

      {/* Chat window */}
      <div className={cn('flex-1 flex flex-col', !activeId && 'hidden lg:flex')}>
        {activeId ? (
          <ChatWindow conversationId={activeId} onBack={() => setActiveId(null)} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <p className="font-medium mb-1">Mesaj seç</p>
              <p className="text-sm">Bir konuşma seçerek başla</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
