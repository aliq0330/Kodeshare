import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { useAuthStore } from '@store/authStore'
import { useSupabaseRealtime } from '@realtime/useSupabaseRealtime'
import './styles/globals.css'

function Root() {
  const init = useAuthStore((s) => s.init)

  React.useEffect(() => {
    init()
  }, []) // eslint-disable-line

  useSupabaseRealtime()

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
