/**
 * Reusable skeleton loading components for Accrue.
 * Uses shimmer animation defined in index.css.
 */

export function SkeletonBlock({ className = '' }) {
  return (
    <div className={`skeleton-shimmer rounded-lg ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-card rounded-xl p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
        <div className="space-y-1.5 flex-1">
          <div className="h-3 skeleton-shimmer rounded w-24" />
          <div className="h-2 skeleton-shimmer rounded w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-2 skeleton-shimmer rounded w-full" />
        <div className="h-2 skeleton-shimmer rounded w-3/4" />
        <div className="h-2 skeleton-shimmer rounded w-1/2" />
      </div>
      <div className="h-8 skeleton-shimmer rounded-lg" />
    </div>
  );
}

export function SkeletonKpi() {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="h-2 skeleton-shimmer rounded w-20 mb-3" />
      <div className="h-6 skeleton-shimmer rounded w-28 mb-2" />
      <div className="h-2 skeleton-shimmer rounded w-16" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="h-4 skeleton-shimmer rounded w-32" />
      </div>
      <div className="divide-y divide-white/[0.03]">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4 p-4" style={{ opacity: 1 - i * 0.12 }}>
            {Array.from({ length: cols }).map((_, j) => (
              <div key={j} className="h-3 skeleton-shimmer rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart() {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="h-4 skeleton-shimmer rounded w-36 mb-4" />
      <div className="h-48 skeleton-shimmer rounded-lg" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => <SkeletonKpi key={i} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SkeletonChart />
        <SkeletonChart />
      </div>
    </div>
  );
}
