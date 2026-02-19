import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import {
  getPortfolioSummary, incomeHistory, upcomingPayments,
  stocks, cryptoAssets, getPortfolioHealthScore,
} from '../data/mockPortfolio';
import { formatCurrency, formatPercent, formatDateShort } from '../utils/formatters';
import KpiCard from '../components/KpiCard';

const COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ef4444', '#f97316'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-white/10 rounded-lg p-3 shadow-xl">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

function HealthGauge({ score }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444';
  const circumference = 2 * Math.PI * 40;
  const progress = (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#1f2937" strokeWidth="8" />
          <circle
            cx="50" cy="50" r="40" fill="none"
            stroke={color} strokeWidth="8"
            strokeDasharray={`${progress} ${circumference}`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold" style={{ color }}>{score}</span>
        </div>
      </div>
      <span className="text-xs text-gray-400 mt-1">Health Score</span>
    </div>
  );
}

function SafetyBadge({ rating }) {
  return (
    <span className={`badge-${rating} text-xs font-bold px-1.5 py-0.5 rounded`}>{rating}</span>
  );
}

const typeColors = {
  Dividend: '#10b981',
  Staking: '#06b6d4',
  Yield: '#f59e0b',
  Interest: '#8b5cf6',
};

export default function Dashboard() {
  const summary = getPortfolioSummary();
  const health = getPortfolioHealthScore();

  // Sector allocation for pie chart
  const sectorData = Object.entries(health.sectors).map(([name, value]) => ({
    name,
    value: Math.round(value),
  }));

  // Last 6 months for mini chart
  const recentIncome = incomeHistory.slice(-6);

  // Top movers (mock)
  const topMovers = [
    { ticker: 'NVDA', change: +4.82, price: 615.30 },
    { ticker: 'SOL', change: +3.21, price: 98.45 },
    { ticker: 'JEPQ', change: +1.14, price: 55.21 },
    { ticker: 'T', change: -1.32, price: 16.99 },
    { ticker: 'JNJ', change: -0.78, price: 158.76 },
  ];

  // Next 7 days payments
  const next7Days = upcomingPayments.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Your investment command center</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Portfolio Value"
          value={formatCurrency(summary.totalValue, 0)}
          subtitle="Stocks + Crypto + DeFi"
          trendValue="+2.4% today"
          trend="up"
          accentColor="emerald"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Annual Passive Income"
          value={formatCurrency(summary.annualIncome, 0)}
          subtitle={`${formatPercent(summary.overallYield)} avg yield`}
          trendValue="+8.3% YoY"
          trend="up"
          accentColor="cyan"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
        <KpiCard
          title="Monthly Income"
          value={formatCurrency(summary.monthlyIncome, 0)}
          subtitle="Avg across all sources"
          trendValue="+5.1% vs last month"
          trend="up"
          accentColor="amber"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
        />
        <KpiCard
          title="YTD Income Received"
          value={formatCurrency(summary.ytdIncome, 0)}
          subtitle={`${formatCurrency(summary.ytdProjected, 0)} projected this month`}
          accentColor="purple"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Income Chart — spans 2 cols */}
        <div className="xl:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Income Last 6 Months</h3>
            <span className="text-xs text-gray-500">All sources</span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={recentIncome} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `$${v}`} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="dividends" name="Dividends" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar dataKey="staking" name="Staking" stackId="a" fill="#06b6d4" />
              <Bar dataKey="yield" name="Yield" stackId="a" fill="#f59e0b" />
              <Bar dataKey="interest" name="Interest" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            {[['Dividends', '#10b981'], ['Staking', '#06b6d4'], ['Yield', '#f59e0b'], ['Interest', '#8b5cf6']].map(([label, color]) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                <span className="text-xs text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Portfolio Health */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <h3 className="text-sm font-semibold text-white mb-4">Portfolio Health</h3>
          <div className="flex justify-center mb-4">
            <HealthGauge score={health.overall} />
          </div>
          <div className="space-y-3 flex-1">
            {[
              { label: 'Diversification', value: health.diversification, color: '#06b6d4' },
              { label: 'Safety', value: health.safety, color: '#10b981' },
              { label: 'Yield Quality', value: health.yield, color: '#f59e0b' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-400">{label}</span>
                  <span className="text-white font-medium">{value}</span>
                </div>
                <div className="h-1.5 bg-[#1f2937] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${value}%`, background: color }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Sector pie */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">Sector Allocation</p>
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={sectorData} cx="50%" cy="50%" innerRadius={35} outerRadius={55}
                  dataKey="value" paddingAngle={2}>
                  {sectorData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, 0)} contentStyle={{
                  background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px',
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
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Payments */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming Payments</h3>
            <span className="text-xs text-gray-500">Next 7 days</span>
          </div>
          <div className="space-y-2">
            {next7Days.map((payment, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                  style={{ background: typeColors[payment.type] + '22', color: typeColors[payment.type], border: `1px solid ${typeColors[payment.type]}33` }}>
                  {payment.ticker.slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{payment.ticker}</p>
                  <p className="text-xs text-gray-500">{payment.type}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-emerald-400">{formatCurrency(payment.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDateShort(payment.date)}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-white/5">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">7-day total</span>
              <span className="text-emerald-400 font-semibold">
                {formatCurrency(next7Days.reduce((s, p) => s + p.amount, 0))}
              </span>
            </div>
          </div>
        </div>

        {/* Top Movers + Holdings snapshot */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Top Movers</h3>
            <span className="text-xs text-gray-500">Today</span>
          </div>
          <div className="space-y-2">
            {topMovers.map((m) => (
              <div key={m.ticker} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/3 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-300">
                    {m.ticker.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-white">{m.ticker}</span>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-300">{formatCurrency(m.price)}</p>
                  <p className={`text-xs font-semibold ${m.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {m.change >= 0 ? '+' : ''}{m.change}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Allocation summary */}
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-xs text-gray-500 mb-2">Allocation Split</p>
            <div className="flex gap-1 h-2 rounded-full overflow-hidden">
              <div className="bg-emerald-500" style={{ width: `${(summary.stockValue / summary.totalValue * 100).toFixed(0)}%` }} />
              <div className="bg-cyan-500" style={{ width: `${(summary.cryptoValue / summary.totalValue * 100).toFixed(0)}%` }} />
            </div>
            <div className="flex justify-between mt-1.5 text-xs">
              <span className="text-gray-500">
                <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full mr-1" />
                Stocks {(summary.stockValue / summary.totalValue * 100).toFixed(0)}%
              </span>
              <span className="text-gray-500">
                Crypto {(summary.cryptoValue / summary.totalValue * 100).toFixed(0)}%
                <span className="inline-block w-2 h-2 bg-cyan-500 rounded-full ml-1" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
