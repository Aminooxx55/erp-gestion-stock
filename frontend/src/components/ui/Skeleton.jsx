/**
 * Reusable skeleton loading components for rich loading states.
 */

export function SkeletonRow({ cols = 4 }) {
  return (
    <div className="flex items-center gap-4 px-6 py-5" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
      <div className="skeleton skeleton-avatar w-10 h-10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton skeleton-text w-2/3" />
        <div className="skeleton skeleton-text w-1/3" />
      </div>
      {Array.from({ length: cols - 1 }).map((_, i) => (
        <div key={i} className="hidden md:block flex-1">
          <div className="skeleton skeleton-text w-3/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="skeleton-card p-6" style={{ background: 'var(--bg-card)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <div className="skeleton skeleton-text w-24" />
          <div className="skeleton skeleton-heading w-16" />
        </div>
        <div className="skeleton w-12 h-12 rounded-[14px]" />
      </div>
      <div className="skeleton skeleton-text w-32" />
    </div>
  );
}

export function SkeletonCards({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
