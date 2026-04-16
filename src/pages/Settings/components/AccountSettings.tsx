import { useState } from 'react'
import { Camera } from 'lucide-react'
import Input from '@components/ui/Input'
import Textarea from '@components/ui/Textarea'
import Button from '@components/ui/Button'
import Avatar from '@components/ui/Avatar'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'

export default function AccountSettings() {
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 800))
    setLoading(false)
    toast.success('Profil güncellendi')
  }

  return (
    <div className="card p-6 flex flex-col gap-6">
      <h2 className="font-semibold text-white">Hesap Bilgileri</h2>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar src={user?.avatarUrl} alt={user?.displayName ?? ''} size="xl" />
          <button className="absolute bottom-0 right-0 w-7 h-7 bg-brand-500 rounded-full flex items-center justify-center hover:bg-brand-600 transition-colors">
            <Camera className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
        <div>
          <p className="text-sm font-medium text-white mb-1">Profil Fotoğrafı</p>
          <p className="text-xs text-gray-500">JPG, PNG veya GIF · Maks. 2 MB</p>
          <Button variant="secondary" size="xs" className="mt-2">Fotoğraf Yükle</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Ad Soyad" defaultValue={user?.displayName} placeholder="Adın" />
        <Input label="Kullanıcı Adı" defaultValue={user?.username} placeholder="kullanici_adi" />
        <Input label="E-posta" defaultValue={user?.email} type="email" className="sm:col-span-2" />
      </div>

      <Textarea label="Biyografi" defaultValue={user?.bio ?? ''} placeholder="Kendini tanıt..." rows={3} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Konum" defaultValue={user?.location ?? ''} placeholder="Şehir, Ülke" />
        <Input label="Website" defaultValue={user?.website ?? ''} placeholder="https://" />
        <Input label="GitHub" defaultValue={user?.githubUrl ?? ''} placeholder="https://github.com/..." />
        <Input label="Twitter" defaultValue={user?.twitterUrl ?? ''} placeholder="https://twitter.com/..." />
      </div>

      <div className="flex justify-end pt-2 border-t border-surface-border">
        <Button variant="primary" onClick={handleSave} loading={loading}>Kaydet</Button>
      </div>
    </div>
  )
}
