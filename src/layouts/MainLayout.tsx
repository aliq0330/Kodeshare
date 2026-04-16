import { Outlet } from 'react-router-dom'
import Navbar from '@components/layout/Navbar'
import Sidebar from '@components/layout/Sidebar'
import RightPanel from '@components/layout/RightPanel'
import MobileNav from '@components/layout/MobileNav'

export default function MainLayout() {
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
