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
import LoginPage from '@pages/Auth/Login'
import RegisterPage from '@pages/Auth/Register'
import PostDetailPage from '@pages/PostDetail'
import CollectionDetailPage from '@pages/CollectionDetail'
import { useAuthStore } from '@store/authStore'
import { useComposerStore } from '@store/composerStore'

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
  useEffect(() => { closeComposer() }, [pathname, closeComposer])

  return (
    <Routes>
      {/* Auth */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

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
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/featured" element={<FeaturedPage />} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:conversationId" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/profile/:username" element={<ProfilePage />} />
        <Route path="/post/:postId" element={<PostDetailPage />} />
        <Route path="/collection/:collectionId" element={<CollectionDetailPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
