import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { IconLock } from '@tabler/icons-react'
import Tabs from '@components/ui/Tabs'
import ProfileHeader from './components/ProfileHeader'
import PostsTab from './components/PostsTab'
import CollectionsTab from './components/CollectionsTab'
import SeriesTab from './components/SeriesTab'
import LikesTab from './components/LikesTab'
import SavedTab from './components/SavedTab'
import { useAuthStore } from '@store/authStore'
import type { User } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('posts')
  const [profileUser, setProfileUser] = useState<User | null>(null)
  const [isFollowing, setIsFollowing] = useState(false)

  if (!username) return null

  const isOwn = user?.username === username
  const isPrivate = !isOwn && profileUser !== null && profileUser.isPublic === false && !isFollowing
  const showLikesTab = isOwn || (profileUser?.showLikes !== false)

  const tabs = [
    { id: 'posts',       label: 'Gönderiler' },
    { id: 'collections', label: 'Koleksiyonlar' },
    { id: 'series',      label: 'Seriler' },
    ...(showLikesTab ? [{ id: 'likes', label: 'Beğenilenler' }] : []),
    ...(isOwn ? [{ id: 'saved', label: 'Kaydedilenler' }] : []),
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-3xl mx-auto w-full">
        <ProfileHeader
          username={username}
          onProfileLoad={setProfileUser}
          onFollowStateLoad={setIsFollowing}
        />
      </div>

      {isPrivate ? (
        <div className="max-w-3xl mx-auto w-full card p-10 flex flex-col items-center gap-3 text-center">
          <div className="w-14 h-14 rounded-full bg-surface-raised flex items-center justify-center">
            <IconLock className="w-6 h-6 text-gray-400" />
          </div>
          <p className="font-semibold text-white">Bu hesap gizlidir</p>
          <p className="text-sm text-gray-500">İçerikleri görmek için takip etmelisin.</p>
        </div>
      ) : (
        <>
          <Tabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={setActiveTab}
            className="sticky top-14 z-10 bg-surface"
          />
          {activeTab === 'posts'       && <PostsTab username={username} />}
          {activeTab === 'collections' && <CollectionsTab username={username} isOwn={isOwn} />}
          {activeTab === 'series'      && <SeriesTab username={username} isOwn={isOwn} />}
          {activeTab === 'likes'       && <LikesTab username={username} />}
          {activeTab === 'saved'       && isOwn && <SavedTab />}
        </>
      )}
    </div>
  )
}
