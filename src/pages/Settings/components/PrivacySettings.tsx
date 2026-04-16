import Button from '@components/ui/Button'

interface ToggleRowProps {
  label: string
  description?: string
  defaultChecked?: boolean
}

function ToggleRow({ label, description, defaultChecked = true }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-surface-border last:border-0 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <input type="checkbox" defaultChecked={defaultChecked} className="w-4 h-4 accent-brand-500" />
    </label>
  )
}

export default function PrivacySettings() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 flex flex-col gap-1">
        <h2 className="font-semibold text-white mb-4">Gizlilik</h2>
        <ToggleRow label="Profili Herkese Açık" description="Hesabın herkese görünür olsun" />
        <ToggleRow label="Beğeniler Görünsün" description="Beğendiğin gönderiler profilinde gösterilsin" />
        <ToggleRow label="Çevrimiçi Durumunu Göster" description="Takipçilerin ne zaman aktif olduğunu görsün" />
        <ToggleRow label="Arama Motorlarına İzin Ver" description="Profilin arama sonuçlarında gösterilsin" defaultChecked={false} />
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
