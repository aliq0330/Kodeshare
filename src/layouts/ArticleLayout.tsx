import type { ReactNode } from 'react'
import Sidebar from '@components/layout/Sidebar'

export default function ArticleLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface flex">
      <aside className="hidden lg:block w-60 shrink-0 sticky top-[60px] h-screen overflow-y-auto scrollbar-none py-4">
        <Sidebar />
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        {children}
      </div>
    </div>
  )
}
