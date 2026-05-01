import { Link, useNavigate } from 'react-router-dom'
import { IconSearch } from '@tabler/icons-react'
import Avatar from '@components/ui/Avatar'
import Button from '@components/ui/Button'

const suggestedUsers = [
  { id: '1', username: 'ayse_dev',   displayName: 'Ayşe Kaya',   avatarUrl: null, isVerified: false },
  { id: '2', username: 'mehmet_css', displayName: 'Mehmet Demir', avatarUrl: null, isVerified: true },
  { id: '3', username: 'zeynep_ui',  displayName: 'Zeynep Çelik', avatarUrl: null, isVerified: false },
]

export default function RightPanel() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-6">
      {/* Search */}
      <button
        onClick={() => navigate('/explore', { state: { focusSearch: true } })}
        className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-gray-500 hover:border-brand-500 hover:text-gray-300 transition-colors text-base text-left"
      >
        <IconSearch className="w-5 h-5 shrink-0" />
        <span>Ara...</span>
      </button>

      {/* Suggested users */}
      <div className="p-4">
        <h3 className="text-base font-semibold text-white mb-4">Önerilen Kullanıcılar</h3>
        <div className="flex flex-col gap-3">
          {suggestedUsers.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-3">
              <Link to={`/profile/${u.username}`} className="flex items-center gap-2.5 min-w-0">
                <Avatar src={u.avatarUrl} alt={u.displayName} size="sm" />
                <div className="min-w-0">
                  <p className="text-base font-medium text-white truncate">{u.displayName}</p>
                  <p className="text-sm text-gray-500 truncate">@{u.username}</p>
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
