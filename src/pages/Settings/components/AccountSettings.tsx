import { useState, useRef } from 'react'
import { Camera } from 'lucide-react'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import Avatar from '@components/ui/Avatar'
import { useAuthStore } from '@store/authStore'
import { userService } from '@services/userService'
import { uploadService } from '@services/uploadService'
import toast from 'react-hot-toast'

export default function AccountSettings() {
  const { user, setUser } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    displayName: user?.displayName ?? '',
    bio:         user?.bio ?? '',
    location:    user?.location ?? '',
    website:     user?.website ?? '',
    githubUrl:   user?.githubUrl ?? '',
    twitterUrl:  user?.twitterUrl ?? '',
    avatarUrl:   user?.avatarUrl ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)

  const field = (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleAvatarPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadService.uploadAvatar(file)
      setForm((f) => ({ ...f, avatarUrl: url }))
      toast.success('Fotoğraf yüklendi')
    } catch (err: any) {
      toast.error(err?.message ?? 'Yükleme başarısız')
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const updated = await userService.updateProfile(form)
      setUser(updated)
      toast.success('Profil güncellendi')
    } catch (err: any) {
      toast.error(err?.message ?? 'Kaydedilemedi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-6 flex flex-col gap-6">
      <h2 className="font-semibold text-white">Hesap Bilgileri</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={form.avatarUrl || null} alt={form.displayName} size="xl" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-0 right-0 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center hover:bg-brand-600 transition-colors disabled:opacity-60"
          >
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-1">Profil Fotoğrafı</p>
          <Button variant="secondary" size="xs" className="mt-2" loading={uploading} onClick={() => fileInputRef.current?.click()}>
            Fotoğraf Yükle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Ad Soyad" value={form.displayName} onChange={field('displayName')} placeholder="Adın" />
        <Input label="Kullanıcı Adı" defaultValue={user?.username} placeholder="kullanici_adi" disabled />
        <Input label="E-posta" defaultValue={user?.email} type="email" className="sm:col-span-2" disabled />
      </div>

      <Textarea label="Biyografi" value={form.bio} onChange={field('bio')} placeholder="Kendini tanıt..." rows={3} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Konum"   value={form.location}   onChange={field('location')}   placeholder="Şehir, Ülke" />
        <Input label="Website" value={form.website}    onChange={field('website')}    placeholder="https://" />
        <Input label="GitHub"  value={form.githubUrl}  onChange={field('githubUrl')}  placeholder="https://github.com/..." />
        <Input label="Twitter" value={form.twitterUrl} onChange={field('twitterUrl')} placeholder="https://twitter.com/..." />
      </div>

      <div className="flex justify-end pt-2 border-t border-surface-border">
        <Button variant="primary" onClick={handleSave} loading={loading}>Kaydet</Button>
      </div>
    </div>
  )
}
