import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { IconMail, IconLock } from '@tabler/icons-react'
import Input from '@components/ui/Input'
import Button from '@components/ui/Button'
import { useAuthStore } from '@store/authStore'
import toast from 'react-hot-toast'

const ERROR_MESSAGES: Record<string, string> = {
  'Invalid login credentials':   'E-posta veya şifre hatalı',
  'Email not confirmed':         'E-posta adresin onaylanmamış. Gelen kutunu kontrol et.',
  'Too many requests':           'Çok fazla deneme yaptın, birkaç dakika bekle.',
  'User not found':              'Bu e-posta ile kayıtlı hesap bulunamadı.',
}

function friendlyError(msg: string): string {
  for (const [key, val] of Object.entries(ERROR_MESSAGES)) {
    if (msg.includes(key)) return val
  }
  return msg
}

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      toast.success('Hoş geldin!')
      navigate('/')
    } catch (err) {
      const msg = friendlyError((err as Error).message)
      setError(msg)
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
        leftIcon={<IconMail className="w-4 h-4" />}
        required
      />

      <Input
        label="Şifre"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        leftIcon={<IconLock className="w-4 h-4" />}
        required
      />

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg px-3 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end -mt-2">
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
