import { useState, useMemo } from 'react';
import { useUnifiedPortfolio } from '../hooks/useUnifiedPortfolio';
import { formatPercent, formatNumber, formatDateShort } from '../utils/formatters';
import { useCurrency } from '../context/CurrencyContext';
import { Link } from 'react-router-dom';

const safetyTooltips = {
  A: 'Excellent — Strong financials, consistent payout history, low risk of cut',
  B: 'Good — Solid fundamentals, minor risk factors',
  C: 'Fair — Some concerns: payout ratio high or recent cuts',
  D: 'Weak — High risk of dividend reduction',
  F: 'Danger — Dividend cut likely or already suspended',
};

function SafetyBadge({ rating }) {
  if (!rating) return <span className="text-gray-600 text-xs">—</span>;
  return (
    <div className="relative group">
      <span className={`badge-${rating} text-xs font-bold px-2.5 py-1 rounded-md cursor-help transition-transform group-hover:scale-110 inline-block`}>{rating}</span>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-navy-700 border border-white/10 text-white text-[11px] rounded-lg w-52 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl backdrop-blur-sm">
        <span className="font-bold">{rating}: </span>{safetyTooltips[rating]}
        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-navy-700" />
      </div>
    </div>
  );
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) {
    return <span className="text-gray-500 ml-1 opacity-50 group-hover:opacity-80 transition-opacity">⇅</span>;
  }
  return (
    <span className="text-[#a78bfa] ml-1 font-data">
      {sortDir === 'asc' ? '▲' : '▼'}
    </span>
  );
}

const typeColors = {
  Stock: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  ETF: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  REIT: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Crypto: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Stablecoin: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  Earn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Staking: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
};

const BROKER_COLORS = {
  degiro: { label: 'DeGiro', abbr: 'DG', color: '#ff6600' },
  trading212: { label: 'Trading 212', abbr: 'T2', color: '#2b6fea' },
  binance: { label: 'Binance', abbr: 'BN', color: '#f0b90b' },
  cryptocom: { label: 'Crypto.com', abbr: 'CC', color: '#002d74' },
};

export default function Holdings() {
  const { formatMoney } = useCurrency();
  const { holdings, isEmpty, connectedBrokers, sourceOptions, syncing } = useUnifiedPortfolio();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sortField, setSortField] = useState('value');
  const [sortDir, setSortDir] = useState('desc');

  const types = ['All', ...new Set(holdings.map((h) => h.type).filter(Boolean))];

  const filtered = useMemo(() => {
    let data = holdings.filter((h) => {
      const matchSearch = (h.ticker || '').toLowerCase().includes(search.toLowerCase()) ||
        (h.name || '').toLowerCase().includes(search.toLowerCase());
      const matchType = typeFilter === 'All' || h.type === typeFilter;
      const matchSource = sourceFilter === 'All' || (h.source || h.broker) === sourceFilter;
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
  }, [holdings, search, typeFilter, sourceFilter, sortField, sortDir]);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const totalValue = filtered.reduce((s, h) => s + (h.value || 0), 0);
  const totalAnnualIncome = filtered.reduce((s, h) => s + (h.annualIncome || 0), 0);

  const exportCSV = () => {
    const headers = ['Ticker', 'Name', 'Type', 'Quantity', 'Price', 'Value', 'Annual Income', 'Yield %', 'Frequency', 'Next Payment', 'Safety', 'Source'];
    const rows = filtered.map((h) => [
      h.ticker, h.name, h.type, h.quantity, (h.price || 0).toFixed(2),
      (h.value || 0).toFixed(2), (h.annualIncome || 0).toFixed(2), (h.yieldPercent || 0).toFixed(2),
      h.frequency || '', h.nextPayDate || '', h.safetyRating || '', h.source || h.broker || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'accrue-holdings.csv';
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

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="card-reveal">
          <h1 className="text-3xl font-display font-bold text-white">Holdings Terminal</h1>
          <p className="text-gray-400 text-sm mt-1">All assets unified — stocks, crypto, DeFi</p>
        </div>
        <div className="glass-card rounded-xl p-8 text-center card-reveal" style={{ animationDelay: '0.05s' }}>
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h2 className="text-xl font-display font-bold text-white mb-2">No Holdings Yet</h2>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
            Connect a broker on the Connections page to see your positions here.
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
      {/* Connected broker banners */}
      {connectedBrokers.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02]">
          {connectedBrokers.map((b) => (
            <div key={b.label} className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black"
                style={{ background: b.color + '22', color: b.color }}>
                {b.abbr}
              </div>
              <span className="text-sm text-gray-300">
                <span className="font-medium" style={{ color: b.color }}>{b.positions}</span> positions
              </span>
            </div>
          ))}
          {syncing && (
            <span className="text-xs text-gray-500 ml-auto animate-pulse">Syncing...</span>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 card-reveal">
        <div>
          <h1 className="text-3xl font-display font-bold text-white">Holdings Terminal</h1>
          <p className="text-gray-400 text-sm mt-1">All assets unified — {connectedBrokers.map((b) => b.label).join(', ') || 'no brokers'}</p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 text-[#a78bfa] text-sm font-medium rounded-lg hover:bg-[#7C5CFC]/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40"
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
        {[
          { label: 'Total Holdings', value: filtered.length, color: 'text-white' },
          { label: 'Total Value', value: formatMoney(totalValue, 0), color: 'text-emerald-400' },
          { label: 'Annual Income', value: formatMoney(totalAnnualIncome, 0), color: 'text-cyan-400' },
          { label: 'Avg Yield', value: formatPercent(totalValue > 0 ? (totalAnnualIncome / totalValue) * 100 : 0), color: 'text-amber-400' },
        ].map((k, i) => (
          <div key={k.label} className="glass-card rounded-xl p-4 card-reveal" style={{ animationDelay: `${0.04 + i * 0.04}s` }}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">{k.label}</p>
            <p className={`text-xl font-data font-medium ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 card-reveal" style={{ animationDelay: '0.1s' }}>
        {/* Search */}
        <div className="relative flex-1 max-w-sm group">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 transition-colors group-focus-within:text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search ticker or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#7C5CFC]/50 focus:ring-2 focus:ring-[#7C5CFC]/20 transition-all duration-200"
          />
        </div>
        {/* Source + Type filters */}
        <div className="flex gap-1.5 flex-wrap">
          {/* Source filter — dynamic from connected brokers */}
          {sourceOptions.length > 1 && sourceOptions.map((s) => {
            const brokerInfo = BROKER_COLORS[s];
            return (
              <button key={s} onClick={() => setSourceFilter(s)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${
                  sourceFilter === s
                    ? brokerInfo ? `text-white border-current` : 'bg-[#7C5CFC] text-white border-[#7C5CFC]'
                    : 'bg-navy-700 text-gray-400 hover:text-white border-white/5'
                }`}
                style={sourceFilter === s && brokerInfo ? { background: brokerInfo.color, borderColor: brokerInfo.color } : {}}
              >
                {brokerInfo ? brokerInfo.label : s}
              </button>
            );
          })}
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${typeFilter === t
                ? 'bg-[#7C5CFC] text-white'
                : 'bg-navy-700 text-gray-400 hover:text-white border border-white/5'
                }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass-card rounded-xl overflow-hidden card-reveal" style={{ animationDelay: '0.15s' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="group px-4 py-3 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-white transition-colors whitespace-nowrap"
                  >
                    {col.label}
                    <SortIcon field={col.key} sortField={sortField} sortDir={sortDir} />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((h, i) => {
                const source = h.source || h.broker;
                const brokerInfo = BROKER_COLORS[source];
                return (
                  <tr
                    key={`${h.ticker}-${source}-${i}`}
                    className={`table-row-hover border-b border-white/[0.03] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                  >
                    {/* Asset */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                          style={{ background: (h.logoColor || '#666') + '33', border: `1px solid ${(h.logoColor || '#666')}44` }}
                        >
                          {(h.ticker || '??').slice(0, 2)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="font-semibold text-white text-xs">{h.ticker}</p>
                            {brokerInfo && (
                              <span className="text-[8px] font-bold px-1 py-0.5 rounded"
                                style={{ background: brokerInfo.color + '22', color: brokerInfo.color, border: `1px solid ${brokerInfo.color}33` }}>
                                {brokerInfo.abbr}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-500 text-[10px] truncate max-w-[120px]">{h.name}</p>
                        </div>
                      </div>
                    </td>
                    {/* Type */}
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${typeColors[h.type] ?? 'text-gray-400'}`}>
                        {h.type}
                      </span>
                    </td>
                    {/* Qty */}
                    <td className="px-4 py-3 text-gray-300 text-xs font-data">
                      {formatNumber(h.quantity)}
                    </td>
                    {/* Price */}
                    <td className="px-4 py-3 text-gray-300 text-xs font-data">
                      {formatMoney(h.price)}
                    </td>
                    {/* Value */}
                    <td className="px-4 py-3 text-white font-medium text-xs font-data">
                      {formatMoney(h.value, 0)}
                    </td>
                    {/* Annual Income */}
                    <td className="px-4 py-3 text-emerald-400 font-medium text-xs font-data">
                      {(h.annualIncome || 0) > 0 ? formatMoney(h.annualIncome, 0) : <span className="text-gray-600">—</span>}
                    </td>
                    {/* Yield */}
                    <td className="px-4 py-3">
                      {(h.yieldPercent || 0) > 0 ? (
                        <span className={`text-xs font-data font-medium ${h.yieldPercent >= 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {formatPercent(h.yieldPercent)}
                        </span>
                      ) : <span className="text-gray-600 text-xs">—</span>}
                    </td>
                    {/* Frequency */}
                    <td className="px-4 py-3 text-gray-400 text-xs">
                      {h.frequency && h.frequency !== 'N/A' ? h.frequency : <span className="text-gray-600">—</span>}
                    </td>
                    {/* Next payment */}
                    <td className="px-4 py-3 text-gray-400 text-xs font-data whitespace-nowrap">
                      {h.nextPayDate && h.nextPayDate !== 'N/A' ? formatDateShort(h.nextPayDate) : <span className="text-gray-600">—</span>}
                    </td>
                    {/* Safety */}
                    <td className="px-4 py-3">
                      <SafetyBadge rating={h.safetyRating} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <p className="text-sm">No holdings found matching your filters</p>
          </div>
        )}
        {/* Footer totals */}
        <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs bg-white/[0.02]">
          <span className="text-gray-500">{filtered.length} holdings shown</span>
          <div className="flex gap-6">
            <span className="text-gray-400">Total: <span className="text-white font-data font-medium">{formatMoney(totalValue, 0)}</span></span>
            <span className="text-gray-400">Annual: <span className="text-emerald-400 font-data font-medium">{formatMoney(totalAnnualIncome, 0)}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}
