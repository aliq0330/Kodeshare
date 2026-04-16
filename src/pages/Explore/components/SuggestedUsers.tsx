import { Link } from 'react-router-dom'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import { BadgeCheck } from 'lucide-react'

const MOCK_USERS = [
  { id: '1', username: 'ayse_dev',   displayName: 'Ayşe Kaya',    avatarUrl: null, isVerified: false, followersCount: 1240 },
  { id: '2', username: 'mehmet_css', displayName: 'Mehmet Demir', avatarUrl: null, isVerified: true,  followersCount: 8900 },
  { id: '3', username: 'zeynep_ui',  displayName: 'Zeynep Çelik', avatarUrl: null, isVerified: false, followersCount: 340  },
  { id: '4', username: 'ali_js',     displayName: 'Ali Yılmaz',   avatarUrl: null, isVerified: false, followersCount: 5600 },
]

export default function SuggestedUsers() {
  return (
    <div>
      <h2 className="text-base font-semibold text-white mb-3">Öne Çıkan Geliştiriciler</h2>
      <div className="flex gap-3 overflow-x-auto scrollbar-none pb-2">
        {MOCK_USERS.map((user) => (
          <div key={user.id} className="card p-4 flex flex-col items-center gap-2 min-w-[140px] shrink-0">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="md" />
            <div className="text-center">
              <Link
                to={`/profile/${user.username}`}
                className="flex items-center gap-1 justify-center text-sm font-medium text-white hover:text-brand-300 transition-colors"
              >
                {user.displayName}
                {user.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-brand-400" />}
              </Link>
              <p className="text-xs text-gray-500">{user.followersCount.toLocaleString()} takipçi</p>
            </div>
            <Button variant="outline" size="xs" fullWidth>Takip Et</Button>
          </div>
        ))}
      </div>
    </div>
  )
}
