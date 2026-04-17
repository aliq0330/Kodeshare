import PostCard from '@components/shared/PostCard'

interface LikesTabProps { username: string }

export default function LikesTab({ username: _ }: LikesTabProps) {
  return (
    <div className="card p-10 text-center text-gray-500">
      <p className="font-medium">Beğenilen gönderiler</p>
      <p className="text-sm mt-1">API bağlandığında gösterilecek</p>
    </div>
  )
}
