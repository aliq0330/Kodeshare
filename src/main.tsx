import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App'
import { useAuthStore } from '@store/authStore'
import { usePostStore } from '@store/postStore'
import { useSupabaseRealtime } from '@realtime/useSupabaseRealtime'
import './styles/globals.css'

const STALE_MS = 5 * 60_000 // 5 dakika uzakta kalınırsa veri yenilenir

function Root() {
  const init = useAuthStore((s) => s.init)

  React.useEffect(() => {
    init()
  }, []) // eslint-disable-line

  // Sekme/uygulama geçişlerinde donmuş loading state'i temizle
  React.useEffect(() => {
    let hiddenAt = 0

    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = Date.now()
        return
      }

      // Tab'e dönerken
      const postState = usePostStore.getState()

      // Takılı kalmış isLoading'i her zaman temizle
      if (postState.isLoading) {
        usePostStore.setState({ isLoading: false })
      }

      // 5 dakikadan uzun süre uzakta kalındıysa feed'i yenile (sıfırlama değil)
      if (hiddenAt > 0 && Date.now() - hiddenAt > STALE_MS) {
        const { lastParams, fetchPosts } = usePostStore.getState()
        fetchPosts({ ...lastParams, page: 1 })
      }

      hiddenAt = 0
    }

    // bfcache'den geri dönüşte (iOS Safari vb.) sayfayı yenile
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

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
