/**
 * Empty state component for pages with no data.
 */
export default function EmptyState({
  icon = 'chart',
  title = 'No data yet',
  description = 'Connect a broker or exchange to see your portfolio data here.',
  action,
  actionLabel = 'Connect Now',
}) {
  const icons = {
    chart: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    ),
    wallet: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    calendar: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    search: (
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    ),
  };

  return (
    <div className="glass-card rounded-xl p-10 text-center border border-white/5 animate-fadeIn">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-white/[0.04] to-white/[0.01] border border-white/5 flex items-center justify-center mx-auto mb-5 text-gray-500">
        {icons[icon] || icons.chart}
      </div>
      <h3 className="text-lg font-display font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-5 max-w-sm mx-auto leading-relaxed">{description}</p>
      {action && (
        <button
          onClick={action}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/20 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
