import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from '@components/layout/Navbar'
import Sidebar from '@components/layout/Sidebar'
import RightPanel from '@components/layout/RightPanel'
import MobileNav from '@components/layout/MobileNav'
import { useAuthStore, mapProfile } from '@store/authStore'
import { useNotificationStore } from '@store/notificationStore'
import { supabase } from '@/lib/supabase'

export default function MainLayout() {
  const { isAuthenticated, user } = useAuthStore()
  const { fetchNotifications, pushNotification } = useNotificationStore()

  useEffect(() => {
    if (!isAuthenticated || !user) return

    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        async (payload) => {
          const n = payload.new as Record<string, unknown>
          const { data: actor } = await supabase.from('profiles').select('*').eq('id', n.actor_id as string).single()
          if (!actor) return
          pushNotification({
            id:        n.id as string,
            type:      n.type as 'like' | 'comment' | 'follow' | 'reply' | 'mention' | 'repost' | 'message' | 'collection_save',
            actor:     mapProfile(actor as Record<string, unknown>),
            postId:    n.post_id as string | null,
            commentId: n.comment_id as string | null,
            message:   n.message as string,
            isRead:    false,
            createdAt: n.created_at as string,
          })
        },
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [isAuthenticated, user?.id])

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className="flex flex-1 max-w-[1440px] mx-auto w-full px-4 pt-16 gap-4">
        {/* Left sidebar — hidden on mobile */}
        <aside className="hidden lg:block w-60 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none py-4">
          <Sidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0 py-4">
          <Outlet />
        </main>

        {/* Right panel — hidden on mobile and tablet */}
        <aside className="hidden xl:block w-72 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto scrollbar-none py-4">
          <RightPanel />
        </aside>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
