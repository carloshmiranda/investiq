import { useState } from 'react';
import { useUnifiedPortfolio } from '../hooks/useUnifiedPortfolio';
import { useCurrency } from '../context/CurrencyContext';
import { Link } from 'react-router-dom';

const typeColors = {
  Dividend: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', border: 'border-emerald-500/20', hex: '#10b981' },
  Staking: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400', border: 'border-cyan-500/20', hex: '#06b6d4' },
  Yield: { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400', border: 'border-amber-500/20', hex: '#f59e0b' },
  Interest: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400', border: 'border-purple-500/20', hex: '#8b5cf6' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

function CalendarGrid({ year, month, payments, onDayClick, selectedDay }) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map payments to day numbers
  const paymentsByDay = {};
  payments.forEach((p) => {
    const d = new Date(p.date);
    if (d.getFullYear() === year && d.getMonth() === month) {
      const day = d.getDate();
      if (!paymentsByDay[day]) paymentsByDay[day] = [];
      paymentsByDay[day].push(p);
    }
  });

  const today = new Date();
  const todayDay = today.getFullYear() === year && today.getMonth() === month ? today.getDate() : null;

  const cells = [];
  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`e-${i}`} />);
  }
  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dayPayments = paymentsByDay[d] ?? [];
    const isToday = d === todayDay;
    const isSelected = d === selectedDay;
    const hasPayments = dayPayments.length > 0;

    cells.push(
      <div
        key={d}
        onClick={() => onDayClick(d, dayPayments)}
        className={`relative p-1.5 rounded-lg cursor-pointer min-h-[56px] transition-all duration-200
          ${isToday ? 'border border-[#7C5CFC]/40 bg-[#7C5CFC]/5' : 'border border-transparent'}
          ${isSelected ? 'bg-white/[0.06] ring-1 ring-[#7C5CFC]/30' : 'hover:bg-white/[0.04]'}
          ${hasPayments ? 'hover:scale-[1.02]' : ''}
        `}
      >
        <span className={`text-xs font-medium ${isToday ? 'text-[#a78bfa] font-data' : 'text-gray-400'}`}>{d}</span>
        {/* Payment dots for compact view */}
        {dayPayments.length > 0 && dayPayments.length <= 2 && (
          <div className="flex flex-wrap gap-0.5 mt-1">
            {dayPayments.map((p, i) => {
              const colors = typeColors[p.type] ?? typeColors.Dividend;
              return (
                <div key={i} className={`text-[9px] font-bold px-1 py-0.5 rounded ${colors.bg} ${colors.text} border ${colors.border} leading-none whitespace-nowrap`}>
                  {p.ticker}
                </div>
              );
            })}
          </div>
        )}
        {dayPayments.length > 2 && (
          <div className="flex items-center gap-0.5 mt-1">
            {dayPayments.slice(0, 3).map((p, i) => {
              const colors = typeColors[p.type] ?? typeColors.Dividend;
              return <div key={i} className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />;
            })}
            {dayPayments.length > 3 && (
              <span className="text-[8px] text-gray-500 ml-0.5">+{dayPayments.length - 3}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] text-gray-500 font-medium py-2 uppercase tracking-wider">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">{cells}</div>
    </div>
  );
}

export default function Calendar() {
  const { formatMoney } = useCurrency();
  const { upcomingPayments, isEmpty } = useUnifiedPortfolio();
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [typeFilter, setTypeFilter] = useState('All');
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPayments, setSelectedPayments] = useState([]);

  const filteredPayments = upcomingPayments.filter(
    (p) => typeFilter === 'All' || p.type === typeFilter
  );

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="card-reveal">
          <h1 className="text-3xl font-display font-bold text-white">Dividend & Rewards Calendar</h1>
          <p className="text-gray-400 text-sm mt-1">Track all upcoming income payments</p>
        </div>
        <div className="glass-card rounded-xl p-8 text-center card-reveal" style={{ animationDelay: '0.05s' }}>
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h2 className="text-xl font-display font-bold text-white mb-2">No Upcoming Payments</h2>
          <p className="text-gray-400 text-sm mb-5 max-w-sm mx-auto">
            Connect a broker to see upcoming dividend and reward payment dates.
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

  const navigateMonth = (dir) => {
    let m = viewMonth + dir;
    let y = viewYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
  };

  const handleDayClick = (day, payments) => {
    setSelectedDay(day);
    setSelectedPayments(payments);
  };

  const monthTotal = filteredPayments
    .filter((p) => {
      const d = new Date(p.date);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    })
    .reduce((s, p) => s + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="card-reveal">
        <h1 className="text-3xl font-display font-bold text-white">Dividend & Rewards Calendar</h1>
        <p className="text-gray-400 text-sm mt-1">Track all upcoming income payments</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 card-reveal" style={{ animationDelay: '0.08s' }}>
        {/* Calendar main */}
        <div className="xl:col-span-2 glass-card rounded-xl p-5">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigateMonth(-1)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              <h3 className="text-lg font-display font-bold text-white">{MONTHS[viewMonth]} {viewYear}</h3>
              <p className="text-xs font-data text-gray-500 mt-0.5">
                {monthTotal > 0 ? `${formatMoney(monthTotal, 0)} expected` : 'No payments this month'}
              </p>
            </div>
            <button onClick={() => navigateMonth(1)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Type filter */}
          <div className="flex gap-1.5 mb-4 flex-wrap">
            {['All', 'Dividend', 'Staking', 'Yield', 'Interest'].map((t) => {
              const c = typeColors[t] ?? null;
              return (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 border focus:outline-none focus:ring-2 focus:ring-[#7C5CFC]/40 ${typeFilter === t
                    ? c ? `${c.bg} ${c.text} ${c.border}` : 'bg-white/10 text-white border-white/20'
                    : 'bg-transparent text-gray-500 border-white/5 hover:text-gray-300 hover:bg-white/[0.03]'
                    }`}
                >
                  {t !== 'All' && c && <span className={`inline-block w-1.5 h-1.5 rounded-full ${c.dot} mr-1.5`} />}
                  {t}
                </button>
              );
            })}
          </div>

          <CalendarGrid
            year={viewYear}
            month={viewMonth}
            payments={filteredPayments}
            onDayClick={handleDayClick}
            selectedDay={selectedDay}
          />

          {/* Selected day detail */}
          {selectedDay && selectedPayments.length > 0 && (
            <div className="mt-4 pt-4 border-t border-white/5 animate-fadeIn">
              <h4 className="text-xs font-semibold text-gray-400 mb-3">
                {MONTHS[viewMonth]} {selectedDay} — Payments
              </h4>
              <div className="space-y-2">
                {selectedPayments.map((p, i) => {
                  const c = typeColors[p.type] ?? typeColors.Dividend;
                  return (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${c.bg} border ${c.border} transition-all duration-200 hover:scale-[1.01]`}>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${c.text}`}>{p.ticker}</span>
                        <span className={`text-[10px] ${c.text} opacity-70`}>{p.type}</span>
                      </div>
                      <span className={`text-sm font-data font-medium ${c.text}`}>{formatMoney(p.amount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: upcoming 30 days */}
        <div className="glass-card rounded-xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Upcoming — Next 30 Days</h3>
            <span className="text-xs font-data text-emerald-400 font-medium">
              {formatMoney(filteredPayments.reduce((s, p) => s + p.amount, 0), 0)}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 max-h-[600px]">
            {filteredPayments.map((p, i) => {
              const c = typeColors[p.type] ?? typeColors.Dividend;
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${c.border} ${c.bg} transition-all duration-200 hover:scale-[1.01]`}>
                  <div className="flex-shrink-0 text-center w-10">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider">
                      {new Date(p.date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-base font-data font-medium text-white leading-none mt-0.5">
                      {new Date(p.date).getDate()}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-bold ${c.text}`}>{p.ticker}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded ${c.bg} ${c.text} border ${c.border}`}>
                        {p.type}
                      </span>
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{p.name}</p>
                  </div>
                  <span className={`text-sm font-data font-medium ${c.text} flex-shrink-0`}>
                    {formatMoney(p.amount)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="mt-4 pt-4 border-t border-white/5 space-y-2.5">
            {Object.entries(typeColors).map(([type, c]) => {
              const typeTotal = filteredPayments.filter((p) => p.type === type).reduce((s, p) => s + p.amount, 0);
              if (typeTotal === 0) return null;
              return (
                <div key={type} className="flex justify-between text-xs">
                  <span className={`flex items-center gap-1.5 ${c.text}`}>
                    <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    {type}
                  </span>
                  <span className={`font-data font-medium ${c.text}`}>{formatMoney(typeTotal)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
