import { Link } from 'react-router-dom'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'

const suggestedUsers = [
  { id: '1', username: 'ayse_dev',   displayName: 'Ayşe Kaya',   avatarUrl: null, isVerified: false },
  { id: '2', username: 'mehmet_css', displayName: 'Mehmet Demir', avatarUrl: null, isVerified: true },
  { id: '3', username: 'zeynep_ui',  displayName: 'Zeynep Çelik', avatarUrl: null, isVerified: false },
]

export default function RightPanel() {
  return (
    <div className="flex flex-col gap-6">
      {/* Suggested users */}
      <div className="card p-4">
        <h3 className="text-sm font-semibold text-white mb-4">Önerilen Kullanıcılar</h3>
        <div className="flex flex-col gap-3">
          {suggestedUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3">
              <Link to={`/profile/${u.username}`} className="flex items-center gap-2.5 min-w-0">
                <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white truncate">{u.displayName}</p>
                  <p className="text-xs text-gray-500 truncate">@{u.username}</p>
                </div>
              </Link>
              <Button variant="outline" size="xs">Takip</Button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-600 px-1 leading-relaxed">
        © 2025 Kodeshare · Gizlilik · Kullanım Şartları
      </p>
    </div>
  )
}
