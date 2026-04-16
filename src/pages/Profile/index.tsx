import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Tabs from '@components/ui/Tabs'
import ProfileHeader from './components/ProfileHeader'
import PostsTab from './components/PostsTab'
import CollectionsTab from './components/CollectionsTab'
import LikesTab from './components/LikesTab'
import FollowersTab from './components/FollowersTab'

const PROFILE_TABS = [
  { id: 'posts',       label: 'Gönderiler' },
  { id: 'collections', label: 'Koleksiyonlar' },
  { id: 'likes',       label: 'Beğenilenler' },
  { id: 'followers',   label: 'Takipçiler' },
  { id: 'following',   label: 'Takip' },
]

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [activeTab, setActiveTab] = useState('posts')

  if (!username) return null

  return (
    <div className="flex flex-col gap-4 max-w-3xl mx-auto">
      <ProfileHeader username={username} />

      <Tabs
        tabs={PROFILE_TABS}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'posts'       && <PostsTab username={username} />}
      {activeTab === 'collections' && <CollectionsTab username={username} />}
      {activeTab === 'likes'       && <LikesTab username={username} />}
      {activeTab === 'followers'   && <FollowersTab username={username} type="followers" />}
      {activeTab === 'following'   && <FollowersTab username={username} type="following" />}
    </div>
  )
}
