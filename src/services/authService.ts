import { api } from './api'
import type { User } from '@/types'

interface LoginPayload    { email: string; password: string }
interface RegisterPayload { displayName: string; username: string; email: string; password: string }
interface AuthResponse    { user: User; token: string }

export const authService = {
  login:    (payload: LoginPayload)    => api.post<AuthResponse>('/auth/login',    payload).then((r) => r.data),
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  logout:   ()                         => api.post('/auth/logout'),
  me:       ()                         => api.get<User>('/auth/me').then((r) => r.data),
  refresh:  ()                         => api.post<AuthResponse>('/auth/refresh').then((r) => r.data),
}
