import { useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import { useUnifiedPortfolio } from '../hooks/useUnifiedPortfolio';
import { formatPercent, formatDateShort } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import KpiCard from '../components/KpiCard';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'];

function CustomTooltip({ active, payload, label, formatMoney }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 shadow-xl !border-white/10">
        <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm font-data font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatMoney(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

function HealthGauge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const glowColor = score >= 80 ? 'rgba(16,185,129,0.3)' : score >= 60 ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)';
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <defs>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="6" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="6"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            filter="url(#glow)"
            style={{ transition: 'stroke-dasharray 1s ease', filter: `drop-shadow(0 0 6px ${glowColor})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-data font-medium" style={{ color }}>{score}</span>
          <span className="text-[9px] text-gray-400 uppercase tracking-wider">score</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-2 font-medium">Portfolio Health</span>
    </div>
  );
}

const typeColors = {
  Dividend: '#10b981',
  Staking: '#06b6d4',
  Yield: '#f59e0b',
  Interest: '#8b5cf6',
};

// Gradient definitions for the bar chart
function ChartGradients() {
  return (
    <defs>
      <linearGradient id="gradStockDividends" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
        <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="gradStakingRewards" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="gradEarnYield" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="gradInterest" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
      </linearGradient>
    </defs>
  );
}

function EmptyState() {
  return (
    <div className="glass-card rounded-xl p-8 text-center card-reveal" style={{ animationDelay: '0.05s' }}>
      <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <h2 className="text-xl font-display font-bold text-white mb-2">Connect a Broker</h2>
      <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
        Link your brokerage accounts to see real portfolio data, income tracking, and analytics.
      </p>
      <Link
        to="/connections"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#a78bfa] text-sm font-medium rounded-lg hover:bg-[#7C5CFC]/20 transition-all duration-200"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Go to Connections
      </Link>
    </div>
  );
}

export default function Dashboard() {
  const {
    totalValue, annualIncome, monthlyIncome, overallYield,
    incomeHistory, upcomingPayments, healthScore, isEmpty,
    allocationByType, connectedBrokers,
  } = useUnifiedPortfolio();
  const { formatMoney, formatLocal, convert } = useCurrency();

  // Sector allocation for pie chart
  const sectorData = useMemo(() =>
    Object.entries(healthScore.sectors).map(([name, value]) => ({
      name,
      value: Math.round(convert(value)),
    })),
  [healthScore.sectors, convert]);

  // Last 6 months for mini chart
  const recentIncome = useMemo(() =>
    incomeHistory.slice(-6).map((m) => ({
      month: m.month,
      stockDividends: convert(m.stockDividends),
      stakingRewards: convert(m.stakingRewards),
      earnYield: convert(m.earnYield),
      interest: convert(m.interest),
    })),
  [incomeHistory, convert]);

  // Next 5 upcoming payments
  const next7Days = upcomingPayments.slice(0, 5);

  // Allocation split by type group (stocks vs crypto)
  const stockTypes = ['Stock', 'ETF', 'REIT'];
  const stockValue = Object.entries(allocationByType)
    .filter(([type]) => stockTypes.includes(type))
    .reduce((s, [, v]) => s + v, 0);
  const cryptoValue = totalValue - stockValue;
  const stockPct = totalValue > 0 ? ((stockValue / totalValue) * 100).toFixed(0) : 0;
  const cryptoPct = totalValue > 0 ? ((cryptoValue / totalValue) * 100).toFixed(0) : 0;

  // YTD income from dividends this year
  const currentYear = new Date().getFullYear();
  const currentMonthName = new Date().toLocaleDateString('en-US', { month: 'short' });
  const ytdMonths = incomeHistory.filter((m) => m.month.includes(String(currentYear)));
  const ytdIncome = ytdMonths.reduce((s, m) => s + m.total, 0);

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader title="Dashboard" subtitle="Your investment command center" />
        <EmptyState />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page title */}
      <PageHeader title="Dashboard" subtitle="Your investment command center" />

      {/* Connected brokers badges */}
      {connectedBrokers.length > 0 && (
        <div className="flex items-center gap-2 card-reveal">
          <span className="text-xs text-gray-500">Live data from:</span>
          {connectedBrokers.map((b) => (
            <span key={b.label} className="text-[10px] font-bold px-2 py-1 rounded-md border"
              style={{ background: b.color + '15', color: b.color, borderColor: b.color + '33' }}>
              {b.abbr} {b.positions}
            </span>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="card-reveal" style={{ animationDelay: '0.04s' }}>
          <KpiCard
            title="Total Portfolio Value"
            value={formatMoney(totalValue, 0)}
            subtitle={`${connectedBrokers.length} broker${connectedBrokers.length !== 1 ? 's' : ''} connected`}
            accentColor="emerald"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
        </div>
        <div className="card-reveal" style={{ animationDelay: '0.08s' }}>
          <KpiCard
            title="Annual Passive Income"
            value={formatMoney(annualIncome, 0)}
            subtitle={`${formatPercent(overallYield)} avg yield`}
            accentColor="cyan"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            }
          />
        </div>
        <div className="card-reveal" style={{ animationDelay: '0.12s' }}>
          <KpiCard
            title="Monthly Income"
            value={formatMoney(monthlyIncome, 0)}
            subtitle="Avg across all sources"
            accentColor="amber"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </div>
        <div className="card-reveal" style={{ animationDelay: '0.16s' }}>
          <KpiCard
            title="YTD Income Received"
            value={formatMoney(ytdIncome, 0)}
            subtitle={ytdIncome > 0 ? `${currentMonthName} ${currentYear}` : 'No income recorded yet'}
            accentColor="purple"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 card-reveal" style={{ animationDelay: '0.22s' }}>
        {/* Income Chart — spans 2 cols */}
        <div className="xl:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Income Last 6 Months</h3>
            <span className="text-xs text-gray-500">All sources</span>
          </div>
          {recentIncome.some((m) => m.stockDividends + m.stakingRewards + m.earnYield + m.interest > 0) ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={recentIncome} barSize={20}>
                  <ChartGradients />
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false}
                    tickFormatter={(v) => formatLocal(v, 0)} />
                  <Tooltip content={<CustomTooltip formatMoney={(v) => formatLocal(v)} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="stockDividends" name="Stock Dividends" stackId="a" fill="url(#gradStockDividends)" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="stakingRewards" name="Staking Rewards" stackId="a" fill="url(#gradStakingRewards)" />
                  <Bar dataKey="earnYield" name="Earn/Yield" stackId="a" fill="url(#gradEarnYield)" />
                  <Bar dataKey="interest" name="Interest" stackId="a" fill="url(#gradInterest)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-4 mt-3">
                {[['Stock Dividends', '#10b981'], ['Staking Rewards', '#06b6d4'], ['Earn/Yield', '#f59e0b'], ['Interest', '#8b5cf6']].map(([label, color]) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-500 text-sm">
              No income data yet — dividends and rewards will appear here
            </div>
          )}
        </div>

        {/* Portfolio Health */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Portfolio Health</h3>
          <div className="flex justify-center mb-4">
            <HealthGauge score={healthScore.overall} />
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Diversification', value: healthScore.diversification, color: '#06b6d4' },
              { label: 'Safety', value: healthScore.safety, color: '#10b981' },
              { label: 'Yield Quality', value: healthScore.yield, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-data">{value}</span>
                </div>
                <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}cc, ${color})` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sector pie */}
          {sectorData.length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Allocation by Type</p>
              <ResponsiveContainer width="100%" height={120}>
                <PieChart>
                  <Pie data={sectorData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                    dataKey="value" paddingAngle={2} stroke="none">
                    {sectorData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => formatLocal(v, 0)} contentStyle={{
                    background: 'rgba(17, 24, 39, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                  }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {sectorData.slice(0, 4).map((s, i) => (
                  <div key={s.name} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[10px] text-gray-500">{s.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 card-reveal" style={{ animationDelay: '0.3s' }}>
        {/* Upcoming Payments */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Payments</h3>
            <span className="text-xs text-gray-500">Next scheduled</span>
          </div>
          {next7Days.length > 0 ? (
            <>
              <div className="space-y-1">
                {next7Days.map((payment, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-transform group-hover:scale-105"
                      style={{ background: (typeColors[payment.type] || '#10b981') + '22', color: typeColors[payment.type] || '#10b981', border: `1px solid ${(typeColors[payment.type] || '#10b981')}33` }}>
                      {payment.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{payment.ticker}</p>
                      <p className="text-xs text-gray-500">{payment.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-data font-medium text-emerald-400">{formatMoney(payment.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDateShort(payment.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-white/5">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total upcoming</span>
                  <span className="text-emerald-400 font-data font-medium">
                    {formatMoney(next7Days.reduce((s, p) => s + p.amount, 0))}
                  </span>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[180px] text-gray-500 text-sm">
              No upcoming payments scheduled
            </div>
          )}
        </div>

        {/* Allocation Split */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Portfolio Allocation</h3>
            <span className="text-xs text-gray-500">{Object.keys(allocationByType).length} types</span>
          </div>

          {/* By type breakdown */}
          <div className="space-y-3 mb-6">
            {Object.entries(allocationByType)
              .sort(([, a], [, b]) => b - a)
              .slice(0, 5)
              .map(([type, value]) => {
                const pct = totalValue > 0 ? ((value / totalValue) * 100).toFixed(1) : 0;
                return (
                  <div key={type}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-300">{type}</span>
                      <span className="text-gray-400 font-data">{formatMoney(value, 0)} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 transition-all duration-700"
                        style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>

          {/* Allocation summary bar */}
          {totalValue > 0 && (
            <div className="pt-4 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-2">Stocks vs Crypto</p>
              <div className="flex gap-0.5 h-2 rounded-full overflow-hidden">
                {Number(stockPct) > 0 && (
                  <div className="rounded-l-full" style={{ width: `${stockPct}%`, background: 'linear-gradient(90deg, #059669, #10b981)' }} />
                )}
                {Number(cryptoPct) > 0 && (
                  <div className="rounded-r-full" style={{ width: `${cryptoPct}%`, background: 'linear-gradient(90deg, #0891b2, #06b6d4)' }} />
                )}
              </div>
              <div className="flex justify-between mt-1.5 text-xs">
                <span className="text-gray-500">
                  <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1" />
                  Stocks <span className="font-data">{stockPct}%</span>
                </span>
                <span className="text-gray-500">
                  Crypto <span className="font-data">{cryptoPct}%</span>
                  <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full ml-1" />
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
