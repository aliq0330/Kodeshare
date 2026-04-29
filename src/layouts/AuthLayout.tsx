import { Outlet, Link } from 'react-router-dom'
import { IconCode } from '@tabler/icons-react'

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2 text-white">
            <IconCode className="w-8 h-8 text-brand-400" />
            <span className="text-2xl font-bold tracking-tight">Kodeshare</span>
          </Link>
        </div>
        <div className="card p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
