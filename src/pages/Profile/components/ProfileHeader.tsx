import { MapPin, Link as LinkIcon, Github, Twitter, BadgeCheck } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import { compactNumber } from '@utils/formatters'
import { useAuthStore } from '@store/authStore'

interface ProfileHeaderProps {
  username: string
}

export default function ProfileHeader({ username }: ProfileHeaderProps) {
  const { user: currentUser } = useAuthStore()
  const isOwn = currentUser?.username === username

  // Replace with real data fetched from API
  const profile = {
    id: '1',
    username,
    displayName: username,
    avatarUrl: null as string | null,
    coverUrl: null as string | null,
    bio: 'Frontend developer & UI enthusiast. React, TypeScript, CSS.',
    location: 'İstanbul, Türkiye',
    website: 'https://example.com',
    githubUrl: 'https://github.com/example',
    twitterUrl: null as string | null,
    followersCount: 1240,
    followingCount: 340,
    postsCount: 87,
    isVerified: false,
    isOnline: true,
  }

  return (
    <div className="card overflow-hidden">
      {/* Cover */}
      <div className="h-36 bg-gradient-to-br from-brand-900 to-surface-raised relative">
        {profile.coverUrl && (
          <img src={profile.coverUrl} alt="Kapak" className="w-full h-full object-cover" />
        )}
      </div>

      <div className="px-5 pb-5">
        {/* Avatar row */}
        <div className="flex items-end justify-between -mt-10 mb-4">
          <div className="ring-4 ring-surface-card rounded-full">
            <Avatar src={profile.avatarUrl} alt={profile.displayName} size="xl" online={profile.isOnline} />
          </div>
          {isOwn ? (
            <Button variant="outline" size="sm">Profili Düzenle</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Mesaj</Button>
              <Button variant="primary" size="sm">Takip Et</Button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
            {profile.isVerified && <BadgeCheck className="w-5 h-5 text-brand-400" />}
          </div>
          <p className="text-gray-500 text-sm">@{profile.username}</p>
        </div>

        {profile.bio && <p className="text-sm text-gray-300 mb-4">{profile.bio}</p>}

        {/* Meta */}
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

        {/* Stats */}
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
