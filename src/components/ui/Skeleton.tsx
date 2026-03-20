export function MapSkeleton() {
  return (
    <div className="skeleton w-full h-[45vh] md:h-[50vh]" />
  )
}

export function StationCardSkeleton() {
  return (
    <div className="bg-surface rounded-2xl p-4 space-y-3 border border-border">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-3/4" />
          <div className="skeleton h-3 w-1/2" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
      </div>
    </div>
  )
}

export function StationListSkeleton() {
  return (
    <div className="space-y-3 px-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <StationCardSkeleton key={i} />
      ))}
    </div>
  )
}
