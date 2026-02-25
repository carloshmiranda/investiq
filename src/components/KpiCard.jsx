const colorMap = {
  emerald: {
    icon: 'text-emerald-400',
    iconBg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    glow: 'hover:shadow-emerald-500/5',
    accent: '#10b981',
  },
  cyan: {
    icon: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    glow: 'hover:shadow-cyan-500/5',
    accent: '#06b6d4',
  },
  amber: {
    icon: 'text-amber-400',
    iconBg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    glow: 'hover:shadow-amber-500/5',
    accent: '#f59e0b',
  },
  purple: {
    icon: 'text-purple-400',
    iconBg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    glow: 'hover:shadow-purple-500/5',
    accent: '#8b5cf6',
  },
};

export default function KpiCard({ title, value, subtitle, icon, trend, trendValue, accentColor = 'emerald', className = '' }) {
  const colors = colorMap[accentColor] ?? colorMap.emerald;

  return (
    <div
      className={`glass-card rounded-xl p-5 ${colors.border} ${colors.glow} hover:shadow-lg transition-all duration-300 card-accent ${className}`}
      style={{ '--accent': colors.accent }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium tracking-wide uppercase" style={{ fontSize: '0.7rem', letterSpacing: '0.05em' }}>{title}</p>
        {icon && (
          <div className={`${colors.iconBg} ${colors.icon} p-2 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-data font-medium text-white mb-1">{value}</p>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2">
          {trendValue && (
            <span className={`text-xs font-data font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
              {trend === 'up' ? '▲' : trend === 'down' ? '▼' : ''} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
