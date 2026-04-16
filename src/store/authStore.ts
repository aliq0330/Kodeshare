import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authService } from '@services/authService'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login:    (email: string, password: string) => Promise<void>
  register: (payload: { displayName: string; username: string; email: string; password: string }) => Promise<void>
  logout:   () => Promise<void>
  setUser:  (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { user, token } = await authService.login({ email, password })
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      register: async (payload) => {
        const { user, token } = await authService.register(payload)
        localStorage.setItem('token', token)
        set({ user, token, isAuthenticated: true })
      },

      logout: async () => {
        await authService.logout()
        localStorage.removeItem('token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      setUser: (user) => set({ user }),
    }),
    {
      name: 'auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    },
  ),
)
