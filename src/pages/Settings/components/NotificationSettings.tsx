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

export default function NotificationSettings() {
  return (
    <div className="card p-6 flex flex-col gap-1">
      <h2 className="font-semibold text-white mb-4">Bildirim Tercihleri</h2>
      <ToggleRow label="Beğeniler" description="Birisi gönderini beğendiğinde" />
      <ToggleRow label="Yorumlar" description="Birisigönderine yorum yaptığında" />
      <ToggleRow label="Yanıtlar" description="Birisi yorumuna yanıt verdiğinde" />
      <ToggleRow label="Takipçiler" description="Biri seni takip ettiğinde" />
      <ToggleRow label="Bahsetmeler (@mention)" description="Birisi seni bir gönderide etiketlediğinde" />
      <ToggleRow label="Mesajlar" description="Yeni mesaj aldığında" />
      <ToggleRow label="Yeniden Paylaşım" description="Birisi gönderini yeniden paylaştığında" />
      <ToggleRow label="E-posta Bildirimleri" description="Önemli aktiviteler için e-posta al" defaultChecked={false} />
    </div>
  )
}
