export default function Loading() {
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-48 rounded-lg bg-[#231f1d]/80 skeleton-shimmer" />
          <div className="h-4 w-72 rounded-md bg-[#231f1d]/60 skeleton-shimmer" />
        </div>
        <div className="h-9 w-28 rounded-lg bg-[#231f1d]/60 skeleton-shimmer" />
      </div>

      {/* Stats row skeleton */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-[#a8a29e]/6 bg-[#1c1917] p-5 space-y-3"
          >
            <div className="h-4 w-20 rounded bg-[#231f1d]/80 skeleton-shimmer" />
            <div className="h-8 w-16 rounded bg-[#231f1d]/60 skeleton-shimmer" />
            <div className="h-2 w-full rounded-full bg-[#231f1d]/40 skeleton-shimmer" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-2xl border border-[#a8a29e]/6 bg-[#1c1917] p-1">
        <div className="space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-lg px-4 py-3"
            >
              <div className="h-9 w-9 shrink-0 rounded-lg bg-[#231f1d]/60 skeleton-shimmer" />
              <div className="h-4 w-36 rounded bg-[#231f1d]/60 skeleton-shimmer" />
              <div className="h-4 w-24 rounded bg-[#231f1d]/40 skeleton-shimmer" />
              <div className="ml-auto h-4 w-20 rounded bg-[#231f1d]/40 skeleton-shimmer" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
