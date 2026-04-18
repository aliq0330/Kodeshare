import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Link as LinkIcon, Github, Twitter, BadgeCheck } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import Spinner from '@components/ui/Spinner'
import { compactNumber } from '@utils/formatters'
import { useAuthStore } from '@store/authStore'
import { userService } from '@services/userService'
import { messageService } from '@services/messageService'
import toast from 'react-hot-toast'
import type { User } from '@/types'

interface ProfileHeaderProps {
  username: string
  onProfileLoad?: (profile: User) => void
  onFollowStateLoad?: (isFollowing: boolean) => void
}

export default function ProfileHeader({ username, onProfileLoad, onFollowStateLoad }: ProfileHeaderProps) {
  const navigate = useNavigate()
  const { user: currentUser, isAuthenticated } = useAuthStore()
  const isOwn = currentUser?.username === username
  const [profile, setProfile] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [followLoading, setFollowLoading] = useState(false)
  const [messageLoading, setMessageLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    userService.getProfile(username)
      .then(async (p) => {
        setProfile(p)
        onProfileLoad?.(p)
        if (isAuthenticated && !isOwn) {
          const following = await userService.isFollowing(p.id)
          setIsFollowing(following)
          onFollowStateLoad?.(following)
        }
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false))
  }, [username, isAuthenticated, isOwn])

  const handleMessage = async () => {
    if (!profile || !isAuthenticated) { toast.error('Önce giriş yapmalısın'); return }
    setMessageLoading(true)
    try {
      const conv = await messageService.startConversation(profile.id)
      navigate(`/messages/${conv.id}`)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setMessageLoading(false)
    }
  }

  const handleFollow = async () => {
    if (!profile || !isAuthenticated) return
    setFollowLoading(true)
    try {
      if (isFollowing) {
        await userService.unfollow(profile.id)
        setIsFollowing(false)
        setProfile((p) => p ? { ...p, followersCount: p.followersCount - 1 } : p)
      } else {
        await userService.follow(profile.id)
        setIsFollowing(true)
        setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p)
      }
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setFollowLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="card flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="card p-10 text-center text-gray-500">
        Kullanıcı bulunamadı
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-36 bg-gradient-to-br from-brand-900 to-surface-raised relative">
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="Kapak" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="px-5 pb-5">
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="ring-4 ring-surface-card rounded-full">
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="xl" online={isOwn ? profile.isOnline : (profile.showOnline ? profile.isOnline : false)} />
          </div>
          {isOwn ? (
            <Button variant="outline" size="sm">Profili Düzenle</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={handleMessage} loading={messageLoading}>Mesaj</Button>
              <Button
                variant={isFollowing ? 'outline' : 'primary'}
                size="sm"
                onClick={handleFollow}
                loading={followLoading}
              >
                {isFollowing ? 'Takipten Çık' : 'Takip Et'}
              </Button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
            {profile.isVerified && <BadgeCheck className="w-5 h-5 text-brand-400" />}
          </div>
          <p className="text-gray-500 text-sm">@{profile.username}</p>
        </div>

        {profile.bio && <p className="text-sm text-gray-300 mb-4">{profile.bio}</p>}

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mb-4">
          {profile.location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {profile.location}
            </span>
          )}
          {profile.website && (
            <a href={profile.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 link">
              <LinkIcon className="w-3.5 h-3.5" />
              {profile.website.replace(/^https?:\/\//, '')}
            </a>
          )}
          {profile.githubUrl && (
            <a href={profile.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 link">
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          )}
          {profile.twitterUrl && (
            <a href={profile.twitterUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 link">
              <Twitter className="w-3.5 h-3.5" />
              Twitter
            </a>
          )}
        </div>

        <div className="flex items-center gap-5 text-sm">
          <div>
            <span className="font-semibold text-white">{compactNumber(profile.postsCount)}</span>
            <span className="text-gray-500 ml-1">gönderi</span>
          </div>
          <div>
            <span className="font-semibold text-white">{compactNumber(profile.followersCount)}</span>
            <span className="text-gray-500 ml-1">takipçi</span>
          </div>
          <div>
            <span className="font-semibold text-white">{compactNumber(profile.followingCount)}</span>
            <span className="text-gray-500 ml-1">takip</span>
          </div>
        </div>
      </div>
    </div>
  )
}
