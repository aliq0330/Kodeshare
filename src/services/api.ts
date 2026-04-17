import axios, { type AxiosError } from 'axios'
import type { ApiError } from '@/types'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// Attach auth token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Normalize error shape
api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<ApiError>) => {
    const message = err.response?.data?.message ?? err.message ?? 'Bir hata oluştu'
    return Promise.reject(new Error(message))
  },
)
