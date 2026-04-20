import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Smile, ExternalLink } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import BlockView from '@modules/post/BlockView'
import { timeAgo } from '@utils/formatters'
import { cn } from '@utils/cn'
import { useMessageStore } from '@store/messageStore'
import { useAuthStore, mapProfile } from '@store/authStore'
import { supabase } from '@/lib/supabase'
import { POST_SHARE_PREFIX, type PostShareData } from '@modules/social/ShareModal'
import type { Message } from '@/types'
import toast from 'react-hot-toast'

interface ChatWindowProps {
  conversationId: string
  onBack: () => void
}

function parsePostShare(content: string): PostShareData | null {
  if (!content.startsWith(POST_SHARE_PREFIX)) return null
  try { return JSON.parse(content.slice(POST_SHARE_PREFIX.length)) } catch { return null }
}

function PostShareCard({ data }: { data: PostShareData }) {
  return (
    <Link to={`/post/${data.id}`} className="block group">
      <div className="card p-3 w-72 hover:border-brand-500/40 transition-colors">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2 text-[11px] text-gray-500">
          <ExternalLink className="w-3 h-3" />
          <span>Gönderi paylaşıldı</span>
        </div>

        {/* Author */}
        <div className="flex items-center gap-2 mb-2">
          <Avatar src={data.author.avatarUrl} alt={data.author.displayName} size="xs" />
          <div className="min-w-0">
            <span className="text-xs font-medium text-gray-200 truncate">{data.author.displayName}</span>
            <span className="text-xs text-gray-500 ml-1">@{data.author.username}</span>
          </div>
        </div>

        {/* Title */}
        <p className="text-sm font-semibold text-white leading-snug mb-1">{data.title}</p>

        {/* Description */}
        {data.description && (
          <p className="text-xs text-gray-400 line-clamp-2 mb-1.5">{data.description}</p>
        )}

        {/* Tags */}
        {data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {data.tags.slice(0, 4).map((t) => (
              <span key={t} className="tag text-[11px]">#{t}</span>
            ))}
          </div>
        )}

        {/* Blocks */}
        {data.blocks.length > 0 && (
          <div className="mt-2 pt-2 border-t border-surface-border">
            <BlockView blocks={data.blocks} compact postTitle={data.title} />
          </div>
        )}

        {/* View link */}
        <p className="mt-2 text-[11px] text-brand-400 font-medium group-hover:text-brand-300 transition-colors">
          Gönderiyi görüntüle →
        </p>
      </div>
    </Link>
  )
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
          const postShare = parsePostShare(msg.content)

          if (postShare) {
            return (
              <div key={msg.id} className={cn('flex flex-col gap-1', isMine ? 'items-end' : 'items-start')}>
                {!isMine && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <Avatar src={msg.sender.avatarUrl} alt={msg.sender.displayName} size="xs" />
                    <span className="text-[11px] text-gray-500">{msg.sender.displayName}</span>
                  </div>
                )}
                <PostShareCard data={postShare} />
                <p className={cn('text-[10px] text-gray-600 px-1', isMine ? 'text-right' : '')}>
                  {timeAgo(msg.createdAt)}
                </p>
              </div>
            )
          }

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
