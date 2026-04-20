import { useState, useEffect, useRef } from 'react'
import { Search, X, Check, Copy, Share2, RotateCcw } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Spinner from '@components/ui/Spinner'
import Modal from '@components/ui/Modal'
import { messageService } from '@services/messageService'
import { userService } from '@services/userService'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'
import type { UserPreview, User } from '@/types'

interface ShareModalProps {
  open: boolean
  onClose: () => void
  postId: string
  postTitle: string
  onRepost?: () => void
}

/* ─── Platform icons ─── */
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  )
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
    </svg>
  )
}

/* ─── Round action button ─── */
function RoundBtn({
  icon, label, onClick, active = false,
}: { icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }) {
  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-1.5 group outline-none">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-surface-raised border border-surface-border transition-colors group-hover:border-brand-500/50 group-hover:bg-surface-border ${active ? 'border-green-500/40 bg-green-500/10' : ''}`}>
        {icon}
      </div>
      <span className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors text-center leading-tight">{label}</span>
    </button>
  )
}

/* ─── User row ─── */
function UserRow({
  user, sending, sent, onSend,
}: { user: UserPreview; sending: boolean; sent: boolean; onSend: (id: string) => void }) {
  return (
    <div className="flex items-center gap-3 py-2 px-1">
      <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate leading-tight">{user.displayName}</p>
        <p className="text-xs text-gray-500 truncate">@{user.username}</p>
      </div>
      <button
        type="button"
        disabled={sent || sending}
        onClick={() => onSend(user.id)}
        className={`shrink-0 min-w-[68px] px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-1 ${
          sent
            ? 'bg-green-500/15 text-green-400 cursor-default'
            : sending
            ? 'bg-brand-600/20 text-brand-400 cursor-default'
            : 'bg-brand-600 hover:bg-brand-500 text-white'
        }`}
      >
        {sent ? (
          <><Check className="w-3 h-3" /> Gönderildi</>
        ) : sending ? (
          <Spinner />
        ) : (
          'Gönder'
        )}
      </button>
    </div>
  )
}

/* ─── Section label ─── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 pt-1 pb-0.5 px-1">{children}</p>
  )
}

/* ─── Main component ─── */
export default function ShareModal({ open, onClose, postId, postTitle, onRepost }: ShareModalProps) {
  const { user: me } = useAuthStore()
  const url = `${window.location.origin}/post/${postId}`

  const [query, setQuery]                   = useState('')
  const [recentUsers, setRecentUsers]       = useState<UserPreview[]>([])
  const [followingUsers, setFollowingUsers] = useState<UserPreview[]>([])
  const [searchResults, setSearchResults]   = useState<UserPreview[] | null>(null)
  const [loadingList, setLoadingList]       = useState(false)
  const [searching, setSearching]           = useState(false)
  const [sendingTo, setSendingTo]           = useState<string | null>(null)
  const [sentTo, setSentTo]                 = useState<Set<string>>(new Set())
  const [copied, setCopied]                 = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  /* Load recent + following on open */
  useEffect(() => {
    if (!open || !me) return
    setLoadingList(true)

    Promise.all([
      messageService.getConversations(),
      userService.getFollowing(me.username),
    ]).then(([convs, following]) => {
      const recentIds = new Set<string>()
      const recent: UserPreview[] = []

      for (const conv of convs) {
        for (const p of conv.participants) {
          if (!recentIds.has(p.id) && recent.length < 3) {
            recentIds.add(p.id)
            recent.push(p)
          }
        }
        if (recent.length >= 3) break
      }

      const remaining = (following as User[])
        .filter((u) => !recentIds.has(u.id))
        .slice(0, 10 - recent.length)

      setRecentUsers(recent)
      setFollowingUsers(remaining)
    }).catch(() => {}).finally(() => setLoadingList(false))
  }, [open, me])

  /* Reset on close */
  useEffect(() => {
    if (open) return
    setQuery('')
    setSearchResults(null)
    setSentTo(new Set())
    setSendingTo(null)
    setCopied(false)
  }, [open])

  /* Debounced search */
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)

    if (!query.trim()) { setSearchResults(null); setSearching(false); return }

    setSearching(true)
    timerRef.current = setTimeout(async () => {
      try {
        setSearchResults(await userService.search(query.trim()) as UserPreview[])
      } catch {
        setSearchResults([])
      } finally {
        setSearching(false)
      }
    }, 300)

    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query])

  /* Send post as message */
  const handleSend = async (userId: string) => {
    if (!me) { toast.error('Giriş yapmalısın'); return }
    setSendingTo(userId)
    try {
      const conv = await messageService.startConversation(userId)
      await messageService.send(conv.id, `📎 ${postTitle}\n${url}`)
      setSentTo((prev) => new Set([...prev, userId]))
      toast.success('Gönderi iletildi!')
    } catch (e: any) {
      toast.error(e?.message ?? 'Gönderilemedi')
    } finally {
      setSendingTo(null)
    }
  }

  /* Share actions */
  const copyLink = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    toast.success('Bağlantı kopyalandı!')
    setTimeout(() => setCopied(false), 2000)
  }

  const deviceShare = async () => {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: postTitle, url }) } catch { /* cancelled */ }
    } else {
      copyLink()
    }
  }

  const handleRepost = () => {
    onRepost?.()
    onClose()
  }

  const listToShow = query.trim() ? searchResults : null
  const showSuggested = !query.trim()

  const renderRow = (u: UserPreview) => (
    <UserRow
      key={u.id}
      user={u}
      sending={sendingTo === u.id}
      sent={sentTo.has(u.id)}
      onSend={handleSend}
    />
  )

  return (
    <Modal open={open} onClose={onClose} title="Paylaş" size="sm">
      <div className="flex flex-col gap-4">

        {/* ── Kişiye gönder ── */}
        {me && (
          <div className="flex flex-col gap-2">
            {/* Search input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Kişi ara..."
                className="w-full bg-surface-raised border border-surface-border rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* User list */}
            <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
              {(loadingList && !query) || searching ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : listToShow !== null ? (
                listToShow.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">Kullanıcı bulunamadı</p>
                ) : (
                  listToShow.map(renderRow)
                )
              ) : showSuggested ? (
                recentUsers.length === 0 && followingUsers.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">Henüz kimseyi takip etmiyorsun</p>
                ) : (
                  <>
                    {recentUsers.length > 0 && (
                      <>
                        <SectionLabel>Son mesajlaştıkların</SectionLabel>
                        {recentUsers.map(renderRow)}
                      </>
                    )}
                    {followingUsers.length > 0 && (
                      <>
                        <SectionLabel>Takip ettiklerin</SectionLabel>
                        {followingUsers.map(renderRow)}
                      </>
                    )}
                  </>
                )
              ) : null}
            </div>
          </div>
        )}

        <div className="border-t border-surface-border" />

        {/* ── Paylaşım butonları ── */}
        <div className="flex items-start justify-around px-1">
          <RoundBtn
            icon={<Share2 className="w-5 h-5 text-gray-300" />}
            label="Paylaş"
            onClick={deviceShare}
          />
          <RoundBtn
            icon={<RotateCcw className="w-5 h-5 text-green-400" />}
            label="Repost"
            onClick={handleRepost}
          />
          <RoundBtn
            icon={<WhatsAppIcon className="w-5 h-5 text-[#25D366]" />}
            label="WhatsApp"
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`${postTitle} ${url}`)}`, '_blank')}
          />
          <RoundBtn
            icon={<TelegramIcon className="w-5 h-5 text-[#2AABEE]" />}
            label="Telegram"
            onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(postTitle)}`, '_blank')}
          />
          <RoundBtn
            icon={copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5 text-gray-300" />}
            label="Kopyala"
            onClick={copyLink}
            active={copied}
          />
        </div>

      </div>
    </Modal>
  )
}
