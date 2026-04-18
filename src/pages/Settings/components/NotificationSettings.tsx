import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { notificationPrefsService } from '@services/notificationPrefsService'
import { DEFAULT_NOTIFICATION_PREFS, type NotificationPrefs } from '@/lib/database.types'

type PrefKey = keyof NotificationPrefs

interface ToggleRowProps {
  label:       string
  description?: string
  checked:     boolean
  disabled?:   boolean
  onChange:    (value: boolean) => void
}

function ToggleRow({ label, description, checked, disabled, onChange }: ToggleRowProps) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 border-b border-surface-border last:border-0 cursor-pointer">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="w-4 h-4 accent-brand-500"
      />
    </label>
  )
}

const ROWS: { key: PrefKey; label: string; description: string }[] = [
  { key: 'likes',    label: 'Beğeniler',             description: 'Birisi gönderini beğendiğinde' },
  { key: 'comments', label: 'Yorumlar',              description: 'Birisi gönderine yorum yaptığında' },
  { key: 'replies',  label: 'Yanıtlar',              description: 'Birisi yorumuna yanıt verdiğinde' },
  { key: 'follows',  label: 'Takipçiler',            description: 'Biri seni takip ettiğinde' },
  { key: 'mentions', label: 'Bahsetmeler (@mention)', description: 'Birisi seni bir gönderide etiketlediğinde' },
  { key: 'messages', label: 'Mesajlar',              description: 'Yeni mesaj aldığında' },
  { key: 'reposts',  label: 'Yeniden Paylaşım',      description: 'Birisi gönderini yeniden paylaştığında' },
  { key: 'email',    label: 'E-posta Bildirimleri',  description: 'Önemli aktiviteler için e-posta al' },
]

export default function NotificationSettings() {
  const [prefs, setPrefs]     = useState<NotificationPrefs>(DEFAULT_NOTIFICATION_PREFS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState<PrefKey | null>(null)

  useEffect(() => {
    let cancelled = false
    notificationPrefsService
      .getMine()
      .then((p) => { if (!cancelled) setPrefs(p) })
      .catch(() => { /* gracefully keep defaults */ })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const toggle = async (key: PrefKey, value: boolean) => {
    const prev = prefs
    setPrefs({ ...prev, [key]: value })
    setSaving(key)
    try {
      const next = await notificationPrefsService.update({ [key]: value })
      setPrefs(next)
    } catch {
      setPrefs(prev)
      toast.error('Tercih kaydedilemedi')
    } finally {
      setSaving(null)
    }
  }

  return (
    <div className="card p-6 flex flex-col gap-1">
      <h2 className="font-semibold text-white mb-4">Bildirim Tercihleri</h2>
      {ROWS.map((r) => (
        <ToggleRow
          key={r.key}
          label={r.label}
          description={r.description}
          checked={prefs[r.key]}
          disabled={loading || saving === r.key}
          onChange={(v) => toggle(r.key, v)}
        />
      ))}
    </div>
  )
}
