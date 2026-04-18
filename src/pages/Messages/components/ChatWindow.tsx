import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Smile } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useMessageStore } from '@store/messageStore'
import { useAuthStore, mapProfile } from '@store/authStore'
import { supabase } from '@/lib/supabase'
import type { Message } from '@/types'
import toast from 'react-hot-toast'

interface ChatWindowProps {
  conversationId: string
  onBack: () => void
}

export default function ChatWindow({ conversationId, onBack }: ChatWindowProps) {
  const { user } = useAuthStore()
  const { messages, conversations, fetchMessages, sendMessage, markConversationRead, pushMessage } = useMessageStore()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const msgs = messages[conversationId] ?? []
  const conv = conversations.find((c) => c.id === conversationId)
  const other = conv?.participants.find((p) => p.id !== user?.id) ?? conv?.participants[0]

  useEffect(() => {
    fetchMessages(conversationId)
    markConversationRead(conversationId)
  }, [conversationId, fetchMessages, markConversationRead])

  // Conversation-specific realtime subscription — global subscription lacks a filter
  // so Supabase can't apply the RLS join; a direct conversation_id filter fixes this.
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        async (payload) => {
          const m = payload.new as Record<string, unknown>
          if (m.sender_id === user?.id) return
          try {
            const { data: sender } = await supabase.from('profiles').select('*').eq('id', m.sender_id).single()
            if (!sender) return
            const message: Message = {
              id:             m.id as string,
              conversationId: m.conversation_id as string,
              content:        m.content as string,
              sender:         mapProfile(sender as Record<string, unknown>),
              status:         m.status as Message['status'],
              createdAt:      m.created_at as string,
            }
            pushMessage(message)
            markConversationRead(conversationId)
          } catch { /* ignore */ }
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel).catch(() => {}) }
  }, [conversationId, user?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const handleSend = async () => {
    if (!text.trim() || sending) return
    const content = text.trim()
    setText('')
    setSending(true)
    try {
      await sendMessage(conversationId, content)
    } catch (err) {
      toast.error((err as Error).message || 'Mesaj gönderilemedi')
      setText(content)
    } finally {
      setSending(false)
    }
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
            <Link to={`/profile/${other.username}`}>
              <Avatar src={other.avatarUrl} alt={other.displayName} size="sm" online={other.isOnline} />
            </Link>
            <Link to={`/profile/${other.username}`} className="hover:opacity-80 transition-opacity">
              <p className="font-medium text-white text-sm">{other.displayName}</p>
              <p className="text-xs text-gray-500">{other.isOnline ? 'Çevrimiçi' : 'Çevrimdışı'}</p>
            </Link>
          </>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {msgs.length === 0 && (
          <div className="flex justify-center py-8 text-gray-500 text-sm">
            Henüz mesaj yok — ilk mesajı sen gönder!
          </div>
        )}
        {msgs.map((msg) => {
          const isMine = msg.sender.id === user?.id
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
            disabled={!text.trim() || sending}
            className="p-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? <Spinner className="w-3.5 h-3.5" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  )
}
