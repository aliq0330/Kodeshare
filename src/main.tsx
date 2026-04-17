import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { useAuthStore } from '@store/authStore'
import { useSupabaseRealtime } from '@realtime/useSupabaseRealtime'
import './styles/globals.css'

function Root() {
  const init      = useAuthStore((s) => s.init)
  const isLoading = useAuthStore((s) => s.isLoading)

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      useAuthStore.setState({ isLoading: false })
    }, 5000)
    init().finally(() => clearTimeout(timeout))
  }, []) // eslint-disable-line

  useSupabaseRealtime()

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0a0f1a' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #1e2535', borderTopColor: '#8aa8ff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#161b27',
            color: '#e2e8f0',
            border: '1px solid #2a3347',
            borderRadius: '10px',
            fontSize: '14px',
          },
        }}
      />
    </>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Root />
    </BrowserRouter>
  </React.StrictMode>,
)
