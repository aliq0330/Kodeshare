export default function PostCardSkeleton() {
  return (
    <div className="border-b border-surface-border px-4 pt-3 pb-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="skeleton w-9 h-9 rounded-lg shrink-0" />

        <div className="flex-1 min-w-0">
          {/* Name + handle */}
          <div className="flex gap-2 mb-2">
            <div className="skeleton h-3.5 w-28 rounded-full" />
            <div className="skeleton h-3.5 w-20 rounded-full" />
          </div>

          {/* Title line */}
          <div className="skeleton h-3.5 w-full rounded-full mb-1.5" />
          <div className="skeleton h-3.5 w-3/4 rounded-full mb-3" />

          {/* Preview block */}
          <div className="skeleton w-full h-36 rounded-xl mb-3" />

          {/* Action buttons */}
          <div className="flex gap-3">
            <div className="skeleton h-5 w-12 rounded-full" />
            <div className="skeleton h-5 w-10 rounded-full" />
            <div className="skeleton h-5 w-10 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
