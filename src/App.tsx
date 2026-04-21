import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import MainLayout from '@layouts/MainLayout'
import EditorLayout from '@layouts/EditorLayout'
import AuthLayout from '@layouts/AuthLayout'
import HomePage from '@pages/Home'
import ExplorePage from '@pages/Explore'
import FeaturedPage from '@pages/Featured'
import ProfilePage from '@pages/Profile'
import MessagesPage from '@pages/Messages'
import NotificationsPage from '@pages/Notifications'
import SettingsPage from '@pages/Settings'
import EditorPage from '@pages/Editor'
import ArticlesPage from '@pages/Article'
import ArticleEditorPage from '@pages/Article/editor'
import ArticleViewPage from '@pages/Article/view'
import LoginPage from '@pages/Auth/Login'
import RegisterPage from '@pages/Auth/Register'
import PostDetailPage from '@pages/PostDetail'
import CollectionDetailPage from '@pages/CollectionDetail'
import AdminPage from '@pages/Admin'
import AdminUserDetailPage from '@pages/Admin/UserDetail'
import { useAuthStore } from '@store/authStore'
import { useComposerStore } from '@store/composerStore'
import { useEditorStore } from '@store/editorStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const isLoading       = useAuthStore((s) => s.isLoading)
  // Wait for auth check, but never longer than what init() allows (has try/finally)
  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-7 h-7 rounded-full border-2 border-surface-raised border-t-brand-400 animate-spin" />
    </div>
  )
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { pathname } = useLocation()
  const closeComposer = useComposerStore((s) => s.closeComposer)
  const appTheme = useEditorStore((s) => s.appTheme)

  useEffect(() => { closeComposer() }, [pathname, closeComposer])

  useEffect(() => {
    const html = document.documentElement
    const apply = (dark: boolean) => {
      html.classList.toggle('dark', dark)
      html.classList.toggle('light', !dark)
    }
    if (appTheme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      apply(mq.matches)
      const handler = (e: MediaQueryListEvent) => apply(e.matches)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
    apply(appTheme === 'dark')
  }, [appTheme])

  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Article — full screen */}
      <Route path="/article/new"       element={<ProtectedRoute><ArticleEditorPage /></ProtectedRoute>} />
      <Route path="/article/:id/view"  element={<ProtectedRoute><ArticleViewPage /></ProtectedRoute>} />
      <Route path="/article/:id"       element={<ProtectedRoute><ArticleEditorPage /></ProtectedRoute>} />

      {/* Editor — full screen, own layout */}
      <Route
        path="/editor/:projectId?"
        element={
          <ProtectedRoute>
            <EditorLayout>
              <EditorPage />
            </EditorLayout>
          </ProtectedRoute>
        }
      />

      {/* Main app */}
      <Route element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="/articles" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/featured" element={<FeaturedPage />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
        <Route path="/admin/user/:userId" element={<ProtectedRoute><AdminUserDetailPage /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/collection/:collectionId" element={<CollectionDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
