import { useState, useMemo } from 'react';
import { getAllHoldings } from '../data/mockPortfolio';
import { formatPercent, formatNumber, formatDateShort } from '../utils/formatters';
import { useDegiro } from '../context/DegiroContext';
import { mergeHoldings } from '../services/degiro/mapper';
import { useCurrency } from '../context/CurrencyContext';

const safetyTooltips = {
  A: 'Excellent — Strong financials, consistent payout history, low risk of cut',
  B: 'Good — Solid fundamentals, minor risk factors',
  C: 'Fair — Some concerns: payout ratio high or recent cuts',
  D: 'Weak — High risk of dividend reduction',
  F: 'Danger — Dividend cut likely or already suspended',
};

function SafetyBadge({ rating }) {
  return (
    <div className="relative group">
      <span className={`badge-${rating} text-xs font-bold px-2 py-0.5 rounded cursor-help`}>{rating}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1.5 bg-gray-800 border border-white/10 text-white text-[11px] rounded-lg w-52 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
        <span className="font-bold">{rating}: </span>{safetyTooltips[rating]}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800" />
      </div>
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <span className="text-gray-700 ml-1">↕</span>;
  return <span className="text-emerald-400 ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
}

const typeColors = {
  Stock: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  ETF: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  REIT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Crypto: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Stablecoin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export default function Holdings() {
  const { formatMoney } = useCurrency();
  const mockHoldings = getAllHoldings();
  const { connected: degiroConnected, positions: degiroPositions, syncing: degiroSyncing, sync: degiroSync } = useDegiro();

  // Merge mock + live DeGiro data (deduped by ticker/ISIN)
  const allHoldings = useMemo(
    () => degiroConnected ? mergeHoldings(mockHoldings, degiroPositions) : mockHoldings,
    [mockHoldings, degiroConnected, degiroPositions]
  );

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All'); // 'All' | 'mock' | 'degiro'
  const [sortField, setSortField] = useState('value');
  const [sortDir, setSortDir] = useState('desc');

  const types = ['All', ...new Set(allHoldings.map((h) => h.type))];

  const filtered = useMemo(() => {
    let data = allHoldings.filter((h) => {
      const matchSearch = h.ticker.toLowerCase().includes(search.toLowerCase()) ||
        h.name.toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || h.type === typeFilter;
      const matchSource = sourceFilter === 'All' ||
        (sourceFilter === 'degiro' ? h.source === 'degiro' : h.source !== 'degiro');
      return matchSearch && matchType && matchSource;
    });

    data.sort((a, b) => {
      let av = a[sortField], bv = b[sortField];
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return data;
  }, [allHoldings, search, typeFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const totalValue = filtered.reduce((s, h) => s + h.value, 0);
  const totalAnnualIncome = filtered.reduce((s, h) => s + h.annualIncome, 0);

  const exportCSV = () => {
    const headers = ['Ticker', 'Name', 'Type', 'Quantity', 'Price', 'Value', 'Annual Income', 'Yield %', 'Frequency', 'Next Payment', 'Safety'];
    const rows = filtered.map((h) => [
      h.ticker, h.name, h.type, h.quantity, h.price.toFixed(2),
      h.value.toFixed(2), h.annualIncome.toFixed(2), h.yieldPercent.toFixed(2),
      h.frequency, h.nextPayDate, h.safetyRating,
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'investiq-holdings.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = [
    { key: 'ticker', label: 'Asset' },
    { key: 'type', label: 'Type' },
    { key: 'quantity', label: 'Qty' },
    { key: 'price', label: 'Price' },
    { key: 'value', label: 'Value' },
    { key: 'annualIncome', label: 'Annual Income' },
    { key: 'yieldPercent', label: 'Yield %' },
    { key: 'frequency', label: 'Frequency' },
    { key: 'nextPayDate', label: 'Next Payment' },
    { key: 'safetyRating', label: 'Safety' },
  ];

  return (
    <div className="space-y-6">
      {/* DeGiro sync banner */}
      {degiroConnected && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#ff6600]/20 bg-[#ff6600]/5">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
            style={{ background: '#ff660022', color: '#ff6600' }}>DG</div>
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-300">
              DeGiro connected — <span className="text-[#ff6600] font-medium">{degiroPositions.length} live positions</span> merged
            </span>
          </div>
          <button
            onClick={degiroSync}
            disabled={degiroSyncing}
            className="text-xs px-3 py-1 rounded-lg border border-[#ff6600]/30 text-[#ff6600] hover:bg-[#ff6600]/10 transition-colors disabled:opacity-40"
          >
            {degiroSyncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Holdings Terminal</h1>
          <p className="text-gray-500 text-sm mt-0.5">All assets unified — stocks, crypto, DeFi{degiroConnected ? ' + DeGiro' : ''}</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium rounded-lg hover:bg-emerald-500/20 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Holdings</p>
          <p className="text-xl font-bold text-white">{filtered.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Value</p>
          <p className="text-xl font-bold text-emerald-400">{formatMoney(totalValue, 0)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Annual Income</p>
          <p className="text-xl font-bold text-cyan-400">{formatMoney(totalAnnualIncome, 0)}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500">Avg Yield</p>
          <p className="text-xl font-bold text-amber-400">
            {formatPercent(totalValue > 0 ? (totalAnnualIncome / totalValue) * 100 : 0)}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-[#1f2937] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        {/* Type filter */}
        <div className="flex gap-1.5 flex-wrap">
          {/* Source filter — only show when DeGiro connected */}
          {degiroConnected && ['All', 'Mock', 'DeGiro'].map((s) => (
            <button key={s} onClick={() => setSourceFilter(s === 'Mock' ? 'mock' : s === 'DeGiro' ? 'degiro' : 'All')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${
                sourceFilter === (s === 'Mock' ? 'mock' : s === 'DeGiro' ? 'degiro' : 'All')
                  ? s === 'DeGiro' ? 'bg-[#ff6600] text-white border-[#ff6600]' : 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-[#1f2937] text-gray-400 hover:text-white border-white/5'
              }`}
            >{s}</button>
          ))}
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${typeFilter === t
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1f2937] text-gray-400 hover:text-white border border-white/5'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    {col.label}
                    <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => (
                <tr
                  key={h.ticker}
                  className={`table-row-hover border-b border-white/3 ${i % 2 === 0 ? '' : 'bg-white/[0.02]'}`}
                >
                  {/* Asset */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                        style={{ background: h.logoColor + '33', border: `1px solid ${h.logoColor}44` }}
                      >
                        {h.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="font-semibold text-white text-xs">{h.ticker}</p>
                          {h.source === 'degiro' && (
                            <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                              style={{ background: '#ff660022', color: '#ff6600', border: '1px solid #ff660033' }}>
                              DG
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-[10px] truncate max-w-[120px]">{h.name}</p>
                      </div>
                    </div>
                  </td>
                  {/* Type */}
                  <td className="px-4 py-3">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${typeColors[h.type] ?? 'text-gray-400'}`}>
                      {h.type}
                    </span>
                  </td>
                  {/* Qty */}
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">
                    {formatNumber(h.quantity)}
                  </td>
                  {/* Price */}
                  <td className="px-4 py-3 text-gray-300 text-xs font-mono">
                    {formatMoney(h.price)}
                  </td>
                  {/* Value */}
                  <td className="px-4 py-3 text-white font-semibold text-xs font-mono">
                    {formatMoney(h.value, 0)}
                  </td>
                  {/* Annual Income */}
                  <td className="px-4 py-3 text-emerald-400 font-semibold text-xs font-mono">
                    {h.annualIncome > 0 ? formatMoney(h.annualIncome, 0) : <span className="text-gray-600">—</span>}
                  </td>
                  {/* Yield */}
                  <td className="px-4 py-3">
                    {h.yieldPercent > 0 ? (
                      <span className={`text-xs font-bold ${h.yieldPercent >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {formatPercent(h.yieldPercent)}
                      </span>
                    ) : <span className="text-gray-600 text-xs">—</span>}
                  </td>
                  {/* Frequency */}
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {h.frequency !== 'N/A' ? h.frequency : <span className="text-gray-600">—</span>}
                  </td>
                  {/* Next payment */}
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                    {h.nextPayDate !== 'N/A' ? formatDateShort(h.nextPayDate) : <span className="text-gray-600">—</span>}
                  </td>
                  {/* Safety */}
                  <td className="px-4 py-3">
                    <SafetyBadge rating={h.safetyRating} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No holdings found</p>
          </div>
        )}
        {/* Footer totals */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs bg-white/[0.02]">
          <span className="text-gray-500">{filtered.length} holdings shown</span>
          <div className="flex gap-6">
            <span className="text-gray-400">Total: <span className="text-white font-bold">{formatMoney(totalValue, 0)}</span></span>
            <span className="text-gray-400">Annual: <span className="text-emerald-400 font-bold">{formatMoney(totalAnnualIncome, 0)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
