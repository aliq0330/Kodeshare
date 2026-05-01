import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '@components/layout/Navbar'
import Sidebar from '@components/layout/Sidebar'
import RightPanel from '@components/layout/RightPanel'
import MobileNav from '@components/layout/MobileNav'
import PostComposer from '@modules/post/PostComposer'
import { cn } from '@utils/cn'

export default function MainLayout() {
  const { pathname } = useLocation()
  const isMessages = pathname.startsWith('/messages')

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      <div className={cn(
        'flex flex-1 max-w-[1440px] mx-auto w-full px-4 pt-14 lg:pt-0 pb-20 lg:pb-4 gap-0',
        isMessages ? 'justify-start' : 'justify-center',
      )}>
        <aside className="hidden lg:block w-60 shrink-0 sticky top-[60px] h-screen overflow-y-auto scrollbar-none py-4">
          <Sidebar />
        </aside>

        <main className={cn(
          'w-full min-w-0',
          isMessages ? 'flex-1' : 'lg:w-[672px] lg:shrink-0 py-4',
        )}>
          <Outlet />
        </main>

        {!isMessages && (
          <aside className="hidden xl:block w-72 shrink-0 sticky top-[60px] h-screen overflow-y-auto scrollbar-none py-4 pl-4">
            <RightPanel />
          </aside>
        )}
      </div>

      <MobileNav />
      <PostComposer hideCard />
    </div>
  )
}
