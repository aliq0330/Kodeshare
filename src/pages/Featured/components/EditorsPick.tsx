import PostCard from '@components/shared/PostCard'
import Badge from '@components/ui/Badge'

export default function EditorsPick() {
  return (
    <div className="flex flex-col gap-4">
      <div className="card p-6 border-brand-500/30 bg-gradient-to-br from-brand-900/20 to-transparent">
        <Badge variant="brand" className="mb-3">Editör Seçimi</Badge>
        <p className="text-gray-400 text-sm">
          Editörlerimiz bu haftanın en yaratıcı ve öğretici kodlarını seçiyor.
          Buraya çıkmak için harika projeler paylaşmaya devam edin!
        </p>
      </div>
      {/* Rendered dynamically when API is connected */}
    </div>
  )
}
