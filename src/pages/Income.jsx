import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Area, AreaChart, ReferenceLine,
} from 'recharts';
import { incomeHistory, incomeProjections, getPortfolioSummary } from '../data/mockPortfolio';
import { formatCurrency, formatPercent } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1f2937] border border-white/10 rounded-lg p-3 shadow-xl min-w-[160px]">
        <p className="text-gray-400 text-xs mb-2">{label}</p>
        {payload.map((entry) => (
          <p key={entry.dataKey} className="text-sm font-medium" style={{ color: entry.color }}>
            {entry.name}: {formatCurrency(entry.value)}
          </p>
        ))}
        {payload.length > 0 && (
          <p className="text-gray-400 text-xs mt-1 pt-1 border-t border-white/10">
            Total: {formatCurrency(payload.reduce((s, e) => s + (e.value || 0), 0))}
          </p>
        )}
      </div>
    );
  }
  return null;
};

function DRIPSimulator() {
  const [drip, setDrip] = useState(true);
  const [growthRate, setGrowthRate] = useState(5);
  const [years, setYears] = useState(10);
  const summary = getPortfolioSummary();

  const baseIncome = summary.annualIncome;
  const baseValue = summary.totalValue;

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

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">DRIP Simulator & Long-Term Projection</h3>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {/* DRIP toggle */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-[#1f2937] border border-white/5">
          <div>
            <p className="text-xs font-medium text-white">Reinvest (DRIP)</p>
            <p className="text-[10px] text-gray-500">Compound dividends</p>
          </div>
          <button
            onClick={() => setDrip(!drip)}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${drip ? 'bg-emerald-500' : 'bg-gray-700'}`}
          >
            <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${drip ? 'translate-x-4' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Growth rate slider */}
        <div className="p-3 rounded-lg bg-[#1f2937] border border-white/5">
          <div className="flex justify-between mb-1">
            <p className="text-xs font-medium text-white">Dividend Growth</p>
            <p className="text-xs font-bold text-emerald-400">{growthRate}%</p>
          </div>
          <input
            type="range" min="0" max="15" step="0.5" value={growthRate}
            onChange={(e) => setGrowthRate(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-1">
            <span>0%</span><span>15%</span>
          </div>
        </div>

        {/* Years selector */}
        <div className="p-3 rounded-lg bg-[#1f2937] border border-white/5">
          <p className="text-xs font-medium text-white mb-1.5">Projection Period</p>
          <div className="flex gap-1.5">
            {[5, 10, 20].map((y) => (
              <button
                key={y}
                onClick={() => setYears(y)}
                className={`flex-1 text-xs font-medium py-1 rounded-md transition-colors ${years === y
                  ? 'bg-emerald-500 text-white'
                  : 'bg-[#374151] text-gray-400 hover:text-white'
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
          <p className="text-lg font-bold text-emerald-400">{formatCurrency(baseIncome, 0)}</p>
        </div>
        <div className="flex items-center text-gray-600 text-xl font-thin">→</div>
        <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10">
          <p className="text-xs text-gray-500">Projected in {years} Years</p>
          <p className="text-lg font-bold text-cyan-400">{formatCurrency(finalIncome, 0)}</p>
        </div>
        <div className="flex-1 min-w-[120px] p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
          <p className="text-xs text-gray-500">Total Growth</p>
          <p className="text-lg font-bold text-amber-400">
            {formatPercent(((finalIncome - baseIncome) / baseIncome) * 100, 0)}
          </p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={projection}>
          <defs>
            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="year" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={Math.floor(years / 4)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false}
            tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(v) => formatCurrency(v, 0)} contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
          <Area type="monotone" dataKey="income" name="Annual Income" stroke="#10b981" fill="url(#incomeGrad)" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function Income() {
  const summary = getPortfolioSummary();

  // Income by type (pie data)
  const lastMonth = incomeHistory[incomeHistory.length - 1];
  const byType = [
    { name: 'Dividends', value: Math.round(lastMonth.dividends * 12), color: '#10b981' },
    { name: 'Staking', value: Math.round(lastMonth.staking * 12), color: '#06b6d4' },
    { name: 'Yield Farming', value: Math.round(lastMonth.yield * 12), color: '#f59e0b' },
    { name: 'Interest', value: Math.round(lastMonth.interest * 12), color: '#8b5cf6' },
  ];
  const totalAnnual = byType.reduce((s, x) => s + x.value, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Income Intelligence</h1>
        <p className="text-gray-500 text-sm mt-0.5">Track, project, and optimize your passive income</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Annual Income', value: formatCurrency(summary.annualIncome, 0), color: 'text-emerald-400' },
          { label: 'Monthly Avg', value: formatCurrency(summary.monthlyIncome, 0), color: 'text-cyan-400' },
          { label: 'Portfolio Yield', value: formatPercent(summary.overallYield), color: 'text-amber-400' },
          { label: 'Income Sources', value: '4 Types', color: 'text-purple-400' },
        ].map((k) => (
          <div key={k.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{k.label}</p>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Income Timeline */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white">Income Timeline — Last 12 Months</h3>
          <span className="text-xs text-gray-500">{formatCurrency(incomeHistory.reduce((s, m) => s + m.total, 0), 0)} total</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={incomeHistory} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="dividends" name="Dividends" stackId="a" fill="#10b981" />
            <Bar dataKey="staking" name="Staking" stackId="a" fill="#06b6d4" />
            <Bar dataKey="yield" name="Yield" stackId="a" fill="#f59e0b" />
            <Bar dataKey="interest" name="Interest" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Projected Income */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-semibold text-white">Income Forecast — Next 12 Months</h3>
          <div className="flex gap-3 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-emerald-400" />
              <span className="text-gray-400">Conservative</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-cyan-400" style={{ borderTop: '2px dashed #06b6d4' }} />
              <span className="text-gray-400">Optimistic</span>
            </span>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-4">Based on current holdings and historical growth rates</p>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={incomeProjections}>
            <defs>
              <linearGradient id="consGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.01} />
              </linearGradient>
              <linearGradient id="optGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false}
              tickFormatter={(v) => `$${v}`} />
            <Tooltip formatter={(v) => formatCurrency(v, 0)} contentStyle={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
            <Area type="monotone" dataKey="optimistic" name="Optimistic" stroke="#06b6d4" fill="url(#optGrad)" strokeWidth={2} strokeDasharray="6 3" dot={false} />
            <Area type="monotone" dataKey="conservative" name="Conservative" stroke="#10b981" fill="url(#consGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Income Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By type */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">By Income Type (Annual)</h3>
          <div className="space-y-3">
            {byType.map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="font-medium" style={{ color: item.color }}>
                    {formatCurrency(item.value, 0)} ({((item.value / totalAnnual) * 100).toFixed(0)}%)
                  </span>
                </div>
                <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${(item.value / totalAnnual) * 100}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By asset class */}
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4">By Asset Class (Annual)</h3>
          <div className="space-y-3">
            {[
              { name: 'Individual Stocks', value: 2840, color: '#10b981', percent: 42 },
              { name: 'ETFs', value: 2120, color: '#06b6d4', percent: 31 },
              { name: 'Crypto Staking', value: 1450, color: '#f59e0b', percent: 21 },
              { name: 'Stablecoin Yield', value: 408, color: '#8b5cf6', percent: 6 },
            ].map((item) => (
              <div key={item.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-300">{item.name}</span>
                  <span className="font-medium" style={{ color: item.color }}>
                    {formatCurrency(item.value, 0)} ({item.percent}%)
                  </span>
                </div>
                <div className="h-2 bg-[#1f2937] rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${item.percent}%`, background: item.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DRIP Simulator */}
      <DRIPSimulator />
    </div>
  );
}
