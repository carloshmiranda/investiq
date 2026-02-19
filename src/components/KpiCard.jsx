export default function KpiCard({ title, value, subtitle, icon, trend, trendValue, accentColor = 'emerald', className = '' }) {
  const colorMap = {
    emerald: {
      icon: 'text-emerald-400',
      iconBg: 'bg-emerald-500/10',
      border: 'border-emerald-500/10',
      trend: 'text-emerald-400',
    },
    cyan: {
      icon: 'text-cyan-400',
      iconBg: 'bg-cyan-500/10',
      border: 'border-cyan-500/10',
      trend: 'text-cyan-400',
    },
    amber: {
      icon: 'text-amber-400',
      iconBg: 'bg-amber-500/10',
      border: 'border-amber-500/10',
      trend: 'text-amber-400',
    },
    purple: {
      icon: 'text-purple-400',
      iconBg: 'bg-purple-500/10',
      border: 'border-purple-500/10',
      trend: 'text-purple-400',
    },
  };
  const colors = colorMap[accentColor] ?? colorMap.emerald;

  return (
    <div className={`glass-card rounded-xl p-5 ${colors.border} ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-400 font-medium">{title}</p>
        {icon && (
          <div className={`${colors.iconBg} ${colors.icon} p-2 rounded-lg`}>
            {icon}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      {(subtitle || trendValue) && (
        <div className="flex items-center gap-2">
          {trendValue && (
            <span className={`text-xs font-medium ${trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
            </span>
          )}
          {subtitle && <span className="text-xs text-gray-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
