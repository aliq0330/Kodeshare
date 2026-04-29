import { IconTrophy, IconStar, IconSparkles } from '@tabler/icons-react'
import WeeklyTop from './components/WeeklyTop'
import EditorsPick from './components/EditorsPick'
import TopUsers from './components/TopUsers'

export default function FeaturedPage() {
  return (
    <div className="flex flex-col gap-8 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
          <IconStar className="w-6 h-6 text-yellow-400" />
          Öne Çıkanlar
        </h1>
        <p className="text-gray-500 text-sm">Haftanın en iyi projeleri ve geliştiricileri</p>
      </div>

      {/* Weekly top */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <IconTrophy className="w-5 h-5 text-yellow-500" />
          Haftanın En Popüler Kodları
        </h2>
        <WeeklyTop />
      </section>

      {/* Editor's pick */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <IconSparkles className="w-5 h-5 text-brand-400" />
          Editör Seçimi
        </h2>
        <EditorsPick />
      </section>

      {/* Top users */}
      <section>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
          <IconStar className="w-5 h-5 text-purple-400" />
          En Beğenilen Kullanıcılar
        </h2>
        <TopUsers />
      </section>
    </div>
  )
}
