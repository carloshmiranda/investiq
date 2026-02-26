import { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';
import { useUnifiedPortfolio } from '../hooks/useUnifiedPortfolio';
import { formatPercent } from '../utils/formatters';
import { classifyIncome, INCOME_CATEGORIES } from '../utils/classifyIncome';
import { useCurrency } from '../context/CurrencyContext';
import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader';

const SOURCE_LABELS = {
  degiro: 'DeGiro',
  trading212: 'Trading 212',
  binance: 'Binance',
  cryptocom: 'Crypto.com',
};

function CustomTooltip({ active, payload, label, formatMoney }) {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card rounded-lg p-3 shadow-xl !border-white/10 min-w-[160px]">
        <p className="text-gray-400 text-xs mb-2 font-medium">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm font-data font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatMoney(entry.value)}
          </p>
        ))}
        {payload.length > 0 && (
          <p className="text-gray-400 text-xs font-data mt-1 pt-1 border-t border-white/10">
            Total: {formatMoney(payload.reduce((s, e) => s + (e.value || 0), 0))}
          </p>
        )}
      </div>
    );
  }
  return null;
}

function IncomeChartGradients() {
  return (
    <defs>
      <linearGradient id="incGradDividends" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34d399" stopOpacity={1} />
        <stop offset="100%" stopColor="#10b981" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="incGradStakingRewards" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#22d3ee" stopOpacity={1} />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="incGradYieldInterest" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fbbf24" stopOpacity={1} />
        <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
      </linearGradient>
      <linearGradient id="incGradDistributions" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
        <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
      </linearGradient>
    </defs>
  );
}

function DRIPSimulator({ annualIncome, totalValue }) {
  const { formatMoney, formatLocal, convert } = useCurrency();
  const [drip, setDrip] = useState(true);
  const [growthRate, setGrowthRate] = useState(5);
  const [years, setYears] = useState(10);

  const baseIncome = annualIncome;
  const baseValue = totalValue;

  const generateProjection = () => {
    const data = [];
    let currentIncome = baseIncome;
    let currentValue = baseValue;

    for (let y = 0; y <= years; y++) {
      if (drip) {
        currentValue += currentIncome;
        const yield_ = currentIncome / currentValue;
        currentIncome = currentValue * yield_ * (1 + growthRate / 100);
      } else {
        currentIncome = baseIncome * Math.pow(1 + growthRate / 100, y);
      }
      data.push({
        year: `Year ${y}`,
        income: Math.round(drip ? currentIncome : currentIncome),
        value: Math.round(currentValue),
      });
    }
    return data;
  };

  const projection = generateProjection();
  const finalIncome = projection[projection.length - 1].income;

  if (baseIncome === 0) {
    return (
      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4">DRIP Simulator & Long-Term Projection</h3>
        <div className="flex items-center justify-center h-[180px] text-gray-500 text-sm">
          Connect a broker with income-generating assets to use the DRIP simulator
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">DRIP Simulator & Long-Term Projection</h3>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* DRIP toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-navy-700 border border-white/5">
          <div>
            <p className="text-xs font-medium text-white">Reinvest (DRIP)</p>
            <p className="text-[10px] text-gray-500">Compound dividends</p>
          </div>
          <button
            onClick={() => setDrip(!drip)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${drip ? 'bg-[#7C5CFC] shadow-[0_0_12px_rgba(124,92,252,0.3)]' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-md transition-transform duration-300 ${drip ? 'translate-x-5.5' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Growth rate slider */}
        <div className="p-3 rounded-lg bg-navy-700 border border-white/5">
          <div className="flex justify-between mb-1">
            <p className="text-xs font-medium text-white">Dividend Growth</p>
            <p className="text-xs font-data font-medium text-emerald-400">{growthRate}%</p>
          </div>
          <input
            type="range" min="0" max="15" step="0.5" value={growthRate}
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 font-data mt-1">
            <span>0%</span><span>15%</span>
          </div>
        </div>

        {/* Years selector */}
        <div className="p-3 rounded-lg bg-navy-700 border border-white/5">
          <p className="text-xs font-medium text-white mb-1.5">Projection Period</p>
          <div className="flex gap-1.5">
            {[5, 10, 20].map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`flex-1 text-xs font-data font-medium py-1.5 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${years === y
                  ? 'bg-[#7C5CFC] text-white shadow-[0_0_8px_rgba(124,92,252,0.25)]'
                  : 'bg-white/[0.04] text-gray-400 hover:text-white hover:bg-white/[0.08]'
                  }`}
              >
                {y}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <p className="text-xs text-gray-500">Current Annual Income</p>
          <p className="text-lg font-data font-medium text-emerald-400">{formatMoney(baseIncome, 0)}</p>
        </div>
        <div className="flex items-center text-gray-600 text-xl font-thin">→</div>
        <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-xs text-gray-500">Projected in {years} Years</p>
          <p className="text-lg font-data font-medium text-cyan-400">{formatMoney(finalIncome, 0)}</p>
        </div>
        <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-gray-500">Total Growth</p>
          <p className="text-lg font-data font-medium text-amber-400">
            {baseIncome > 0 ? formatPercent(((finalIncome - baseIncome) / baseIncome) * 100, 0) : '0%'}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={projection}>
          <defs>
            <linearGradient id="dripIncomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} interval={Math.floor(years / 4)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false}
            tickFormatter={(v) => formatLocal(convert(v), 0)} />
          <Tooltip formatter={(v) => formatMoney(v, 0)} contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} />
          <Area type="monotone" dataKey="income" name="Annual Income" stroke="#10b981" fill="url(#dripIncomeGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Income() {
  const { formatMoney, formatLocal, convert } = useCurrency();
  const {
    annualIncome, monthlyIncome, overallYield, totalValue,
    incomeHistory, incomeProjections, dividends, isEmpty,
  } = useUnifiedPortfolio();

  const [sourceFilter, setSourceFilter] = useState('All');

  // Derive available source options from dividends
  const sourceOptions = useMemo(() => {
    const sources = new Set(dividends.map((d) => d.source).filter(Boolean));
    return ['All', ...sources];
  }, [dividends]);

  // Filter dividends by selected source
  const filteredDividends = useMemo(() =>
    sourceFilter === 'All' ? dividends : dividends.filter((d) => d.source === sourceFilter),
  [dividends, sourceFilter]);

  // Recompute filtered income history for the chart
  const filteredIncomeHistory = useMemo(() => {
    if (sourceFilter === 'All') return incomeHistory;
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    const emptyBucket = () => ({ dividends: 0, stakingRewards: 0, yieldInterest: 0, distributions: 0, total: 0 });
    const buckets = {};
    filteredDividends.forEach((d) => {
      const dDate = new Date(d.date);
      if (dDate < twelveMonthsAgo) return;
      const key = dDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!buckets[key]) buckets[key] = { month: key, ...emptyBucket() };
      const bucket = buckets[key];
      const amt = d.amount || 0;
      bucket[classifyIncome(d)] += amt;
      bucket.total += amt;
    });
    const result = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      result.push(buckets[key] || { month: key, ...emptyBucket() });
    }
    return result;
  }, [filteredDividends, sourceFilter, incomeHistory]);

  // Income by type with broker source badges
  const byType = useMemo(() => {
    const buckets = {};
    for (const [key, meta] of Object.entries(INCOME_CATEGORIES)) {
      buckets[key] = { label: meta.label, color: meta.color, total: 0, sources: new Set() };
    }
    filteredDividends.forEach((d) => {
      const cls = classifyIncome(d);
      buckets[cls].total += (d.amount || 0);
      if (d.source) buckets[cls].sources.add(d.source);
    });
    return Object.values(buckets)
      .filter((b) => b.total > 0)
      .map((b) => ({
        name: b.label,
        value: Math.round(b.total),
        color: b.color,
        sources: [...b.sources].map((s) => SOURCE_LABELS[s] || s),
      }));
  }, [filteredDividends]);

  const totalByType = byType.reduce((s, x) => s + x.value, 0);

  // Income sources count = unique broker+type combos
  const incomeSourceCount = useMemo(() => {
    const combos = new Set(dividends.map((d) => `${d.source}-${classifyIncome(d)}`));
    return combos.size;
  }, [dividends]);

  const filteredTotal = filteredIncomeHistory.reduce((s, m) => s + m.total, 0);
  const hasIncomeData = filteredTotal > 0;
  const hasProjections = incomeProjections.length > 0;

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <PageHeader title="Income Intelligence" subtitle="Track, project, and optimize your passive income" />
        <div className="glass-card rounded-xl p-8 text-center card-reveal" style={{ animationDelay: '0.05s' }}>
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-xl font-display font-bold text-white mb-2">No Income Data Yet</h2>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
            Connect a broker to start tracking dividends, staking rewards, and passive income.
          </p>
          <Link to="/connections"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#a78bfa] text-sm font-medium rounded-lg hover:bg-[#7C5CFC]/20 transition-all duration-200">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Go to Connections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Income Intelligence" subtitle="Track, project, and optimize your passive income" />

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Annual Income', value: formatMoney(annualIncome, 0), color: 'text-emerald-400' },
          { label: 'Monthly Avg', value: formatMoney(monthlyIncome, 0), color: 'text-cyan-400' },
          { label: 'Portfolio Yield', value: formatPercent(overallYield), color: 'text-amber-400' },
          { label: 'Income Sources', value: incomeSourceCount > 0 ? `${incomeSourceCount} Sources` : 'N/A', color: 'text-purple-400' },
        ].map((k, i) => (
          <div key={k.label} className="glass-card rounded-xl p-4 transition-all duration-300 card-reveal" style={{ animationDelay: `${0.04 + i * 0.04}s` }}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{k.label}</p>
            <p className={`text-xl font-data font-medium ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Income Timeline */}
      <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '0.1s' }}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Income Timeline — Last 12 Months</h3>
          {hasIncomeData && (
            <span className="text-xs font-data text-gray-500">{formatMoney(filteredTotal, 0)} total</span>
          )}
        </div>

        {/* Source filter pills */}
        {sourceOptions.length > 2 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {sourceOptions.map((src) => {
              const label = src === 'All' ? 'All' : (SOURCE_LABELS[src] || src);
              const active = sourceFilter === src;
              return (
                <button
                  key={src}
                  onClick={() => setSourceFilter(src)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-all duration-200 ${
                    active
                      ? 'bg-[#7C5CFC]/15 border-[#7C5CFC]/30 text-[#a78bfa]'
                      : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-gray-300 hover:border-white/10'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {hasIncomeData ? (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={filteredIncomeHistory} barSize={20}>
              <IncomeChartGradients />
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => formatLocal(convert(v), 0)} />
              <Tooltip content={<CustomTooltip formatMoney={formatMoney} />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="dividends" name="Dividends" stackId="a" fill="url(#incGradDividends)" />
              <Bar dataKey="stakingRewards" name="Staking Rewards" stackId="a" fill="url(#incGradStakingRewards)" />
              <Bar dataKey="yieldInterest" name="Yield & Interest" stackId="a" fill="url(#incGradYieldInterest)" />
              <Bar dataKey="distributions" name="Distributions" stackId="a" fill="url(#incGradDistributions)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[260px] text-gray-500 text-sm">
            {sourceFilter !== 'All'
              ? `No income from ${SOURCE_LABELS[sourceFilter] || sourceFilter} in the last 12 months`
              : 'No income received yet — dividends and rewards will appear here as they come in'}
          </div>
        )}
      </div>

      {/* Projected Income — only show if we have enough data */}
      {hasProjections && (
        <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '0.16s' }}>
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-semibold text-white">Income Forecast — Next 12 Months</h3>
            <div className="flex gap-3 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-emerald-400 rounded-full" />
                <span className="text-gray-400">Conservative</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-0.5 bg-cyan-400 rounded-full" style={{ borderTop: '2px dashed #06b6d4' }} />
                <span className="text-gray-400">Optimistic</span>
              </span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mb-4">Based on recent income trends</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={incomeProjections}>
              <defs>
                <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
                </linearGradient>
                <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 11, fontFamily: 'DM Mono' }} axisLine={false} tickLine={false}
                tickFormatter={(v) => formatLocal(convert(v), 0)} />
              <Tooltip formatter={(v) => formatMoney(v, 0)} contentStyle={{ background: 'rgba(17,24,39,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', backdropFilter: 'blur(8px)' }} />
              <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#06b6d4" fill="url(#optGrad)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
              <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#10b981" fill="url(#consGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Income Breakdown — only show if we have dividend data */}
      {byType.length > 0 && (
        <div className="glass-card rounded-xl p-5 card-reveal" style={{ animationDelay: '0.22s' }}>
          <h3 className="text-sm font-semibold text-white mb-4">By Income Type (All Time)</h3>
          <div className="space-y-3">
            {byType.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">
                    {item.name}
                    {item.sources.length > 0 && (
                      <span className="text-gray-500 ml-1.5 text-[10px]">
                        · {item.sources.join(', ')}
                      </span>
                    )}
                  </span>
                  <span className="font-data font-medium" style={{ color: item.color }}>
                    {formatMoney(item.value, 0)} ({totalByType > 0 ? ((item.value / totalByType) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
                <div className="h-2 bg-navy-700 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${totalByType > 0 ? (item.value / totalByType) * 100 : 0}%`, background: `linear-gradient(90deg, ${item.color}cc, ${item.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* DRIP Simulator */}
      <div className="card-reveal" style={{ animationDelay: '0.28s' }}>
        <DRIPSimulator annualIncome={annualIncome} totalValue={totalValue} />
      </div>
    </div>
  );
}
