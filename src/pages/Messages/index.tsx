import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ChatList from './components/ChatList'
import ChatWindow from './components/ChatWindow'
import { cn } from '@utils/cn'

export default function MessagesPage() {
  const { conversationId } = useParams<{ conversationId?: string }>()
  const [activeId, setActiveId] = useState(conversationId ?? null)

  useEffect(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  return (
    <div className="fixed inset-x-0 top-14 bottom-16 bg-surface-card border-t border-surface-border/40 overflow-hidden flex lg:static lg:inset-auto lg:-mx-4 lg:-my-4 lg:h-[calc(100vh-3.5rem)] lg:border-0 lg:border-t lg:border-surface-border/40">
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
