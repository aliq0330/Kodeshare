import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Tabs from '@components/ui/Tabs'
import ProfileHeader from './components/ProfileHeader'
import PostsTab from './components/PostsTab'
import CollectionsTab from './components/CollectionsTab'
import LikesTab from './components/LikesTab'
import SavedTab from './components/SavedTab'
import FollowersTab from './components/FollowersTab'
import { useAuthStore } from '@store/authStore'
import type { User } from '@/types'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState('posts')
  const [profileUser, setProfileUser] = useState<User | null>(null)

  if (!username) return null

  const isOwn = user?.username === username
  const showLikesTab = isOwn || (profileUser?.showLikes !== false)

  const tabs = [
    { id: 'posts',       label: 'Gönderiler' },
    { id: 'collections', label: 'Koleksiyonlar' },
    ...(showLikesTab ? [{ id: 'likes', label: 'Beğenilenler' }] : []),
    ...(isOwn ? [{ id: 'saved', label: 'Kaydedilenler' }] : []),
    { id: 'followers',   label: 'Takipçiler' },
    { id: 'following',   label: 'Takip' },
  ]

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <ProfileHeader username={username} onProfileLoad={setProfileUser} />

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        className="sticky top-16 z-10 bg-surface"
      />

      {activeTab === 'posts'       && <PostsTab username={username} />}
      {activeTab === 'collections' && <CollectionsTab username={username} isOwn={isOwn} />}
      {activeTab === 'likes'       && <LikesTab username={username} />}
      {activeTab === 'saved'       && isOwn && <SavedTab />}
      {activeTab === 'followers'   && <FollowersTab username={username} type="followers" />}
      {activeTab === 'following'   && <FollowersTab username={username} type="following" />}
    </div>
  )
}
