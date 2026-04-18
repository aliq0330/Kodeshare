import { useState } from 'react'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import { userService } from '@services/userService'
import toast from 'react-hot-toast'

interface ToggleRowProps {
  label: string
  description?: string
  checked: boolean
  onChange: (value: boolean) => void
}

function ToggleRow({ label, description, checked, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-surface-border last:border-0 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-brand-500"
      />
    </label>
  )
}

export default function PrivacySettings() {
  const { user, setUser } = useAuthStore()

  const [settings, setSettings] = useState({
    isPublic:   user?.isPublic   ?? true,
    showLikes:  user?.showLikes  ?? true,
    showOnline: user?.showOnline ?? true,
    searchable: user?.searchable ?? false,
  })
  const [saving, setSaving] = useState(false)

  const update = (key: keyof typeof settings) => (value: boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await userService.updatePrivacySettings(settings)
      if (user) setUser({ ...user, ...settings })
      toast.success('Gizlilik ayarları kaydedildi')
    } catch (err) {
      toast.error((err as Error).message || 'Kaydedilemedi')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 flex flex-col gap-1">
        <h2 className="font-semibold text-white mb-4">Gizlilik</h2>
        <ToggleRow
          label="Profili Herkese Açık"
          description="Hesabın herkese görünür olsun"
          checked={settings.isPublic}
          onChange={update('isPublic')}
        />
        <ToggleRow
          label="Beğeniler Görünsün"
          description="Beğendiğin gönderiler profilinde gösterilsin"
          checked={settings.showLikes}
          onChange={update('showLikes')}
        />
        <ToggleRow
          label="Çevrimiçi Durumunu Göster"
          description="Takipçilerin ne zaman aktif olduğunu görsün"
          checked={settings.showOnline}
          onChange={update('showOnline')}
        />
        <ToggleRow
          label="Arama Motorlarına İzin Ver"
          description="Profilin arama sonuçlarında gösterilsin"
          checked={settings.searchable}
          onChange={update('searchable')}
        />
        <div className="pt-3">
          <Button variant="primary" size="sm" onClick={handleSave} loading={saving}>
            Kaydet
          </Button>
        </div>
      </div>

      <div className="card p-6 border-red-900/40">
        <h2 className="font-semibold text-red-400 mb-2">Tehlikeli Alan</h2>
        <p className="text-sm text-gray-500 mb-4">Bu işlemler geri alınamaz. Dikkatli ol.</p>
        <div className="flex flex-col gap-2">
          <Button variant="outline" size="sm" className="border-red-900 text-red-400 hover:bg-red-900/20">
            Hesabı Devre Dışı Bırak
          </Button>
          <Button variant="danger" size="sm">
            Hesabı Kalıcı Sil
          </Button>
        </div>
      </div>
    </div>
  )
}
