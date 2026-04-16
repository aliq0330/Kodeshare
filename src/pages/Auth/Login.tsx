import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock } from 'lucide-react'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch {
      toast.error('E-posta veya şifre hatalı')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-white mb-1">Tekrar hoş geldin</h1>
        <p className="text-sm text-gray-500">Hesabına giriş yap</p>
      </div>

      <Input
        label="E-posta"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ornek@mail.com"
        leftIcon={<Mail className="w-4 h-4" />}
        required
      />

      <Input
        label="Şifre"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        leftIcon={<Lock className="w-4 h-4" />}
        required
      />

      <div className="flex justify-end">
        <Link to="/forgot-password" className="text-xs link">Şifremi unuttum</Link>
      </div>

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Giriş Yap
      </Button>

      <p className="text-center text-sm text-gray-500">
        Hesabın yok mu?{' '}
        <Link to="/register" className="link font-medium">Kayıt ol</Link>
      </p>
    </form>
  )
}
