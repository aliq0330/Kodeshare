import type { ReactNode } from 'react'
import EditorNavbar from '@components/layout/EditorNavbar'
import PostComposer from '@modules/post/PostComposer'

interface EditorLayoutProps {
  children: ReactNode
}

export default function EditorLayout({ children }: EditorLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[#0d1117] overflow-hidden">
      <EditorNavbar />
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
      <PostComposer hideCard />
    </div>
  )
}
