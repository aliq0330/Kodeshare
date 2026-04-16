import { Link } from 'react-router-dom'
import { BadgeCheck, Heart } from 'lucide-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'
import { compactNumber } from '@utils/formatters'

const MOCK_TOP_USERS = [
  { id: '1', username: 'mehmet_css', displayName: 'Mehmet Demir', avatarUrl: null, isVerified: true,  totalLikes: 28400, isOnline: true },
  { id: '2', username: 'ayse_dev',   displayName: 'Ayşe Kaya',    avatarUrl: null, isVerified: false, totalLikes: 14200, isOnline: false },
  { id: '3', username: 'zeynep_ui',  displayName: 'Zeynep Çelik', avatarUrl: null, isVerified: false, totalLikes: 9800,  isOnline: true },
]

export default function TopUsers() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {MOCK_TOP_USERS.map((user, i) => (
        <div key={user.id} className="card p-5 flex flex-col items-center gap-3 text-center">
          <div className="relative">
            <Avatar src={user.avatarUrl} alt={user.displayName} size="lg" online={user.isOnline} />
            <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-surface-border flex items-center justify-center text-xs font-bold text-gray-300">
              {i + 1}
            </span>
          </div>
          <div>
            <Link
              to={`/profile/${user.username}`}
              className="flex items-center justify-center gap-1 font-semibold text-white hover:text-brand-300 transition-colors"
            >
              {user.displayName}
              {user.isVerified && <BadgeCheck className="w-4 h-4 text-brand-400" />}
            </Link>
            <p className="text-xs text-gray-500">@{user.username}</p>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-red-400">
            <Heart className="w-4 h-4 fill-current" />
            {compactNumber(user.totalLikes)} beğeni
          </div>
          <Button variant="outline" size="sm" fullWidth>Takip Et</Button>
        </div>
      ))}
    </div>
  )
}
