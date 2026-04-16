import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, User, AtSign } from 'lucide-react'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const navigate = useNavigate()
  const register = useAuthStore((s) => s.register)
  const [form, setForm] = useState({ displayName: '', username: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(form)
      navigate('/')
      toast.success('Hesabın oluşturuldu!')
    } catch {
      toast.error('Kayıt sırasında bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Hesap Oluştur</h1>
        <p className="text-sm text-gray-500">Kodeshare topluluğuna katıl</p>
      </div>

      <Input label="Ad Soyad" value={form.displayName} onChange={set('displayName')} placeholder="Adın Soyadın" leftIcon={<User className="w-4 h-4" />} required />
      <Input label="Kullanıcı Adı" value={form.username} onChange={set('username')} placeholder="kullanici_adi" leftIcon={<AtSign className="w-4 h-4" />} required />
      <Input label="E-posta" type="email" value={form.email} onChange={set('email')} placeholder="ornek@mail.com" leftIcon={<Mail className="w-4 h-4" />} required />
      <Input label="Şifre" type="password" value={form.password} onChange={set('password')} placeholder="En az 8 karakter" leftIcon={<Lock className="w-4 h-4" />} required />

      <Button type="submit" variant="primary" fullWidth loading={loading} className="mt-2">
        Kayıt Ol
      </Button>

      <p className="text-center text-sm text-gray-500">
        Zaten hesabın var mı?{' '}
        <Link to="/login" className="link font-medium">Giriş yap</Link>
      </p>
    </form>
  )
}
