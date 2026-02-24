import { useState, useEffect } from 'react';
import { useUnifiedPortfolio } from '../hooks/useUnifiedPortfolio';
import { useCurrency } from '../context/CurrencyContext';

const CURRENCIES = ['USD', 'EUR', 'GBP'];
const SYMBOLS = { USD: '$', EUR: '€', GBP: '£' };

export default function Header({ collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile }) {
  const [time, setTime] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const { totalValue, monthlyIncome } = useUnifiedPortfolio();
  const { activeCurrency, setActiveCurrency, formatMoney } = useCurrency();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
      setPulse((p) => !p);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const formattedDate = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const headerLeft = isMobile ? '0' : collapsed ? '4rem' : '15rem';

  return (
    <header className="fixed top-0 right-0 z-20 h-16 flex items-center px-3 sm:px-4 gap-2 sm:gap-4
      bg-[#0d1526]/90 backdrop-blur-md border-b border-white/5
      transition-all duration-300"
      style={{ left: headerLeft }}
    >
      {/* Mobile hamburger */}
      <button
        className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Live portfolio value */}
      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
        <div className="relative flex-shrink-0">
          <div className={`w-2 h-2 rounded-full bg-emerald-400 transition-opacity duration-500 ${pulse ? 'opacity-100' : 'opacity-40'}`} />
          <div className="absolute inset-0 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-20" />
        </div>
        <span className="text-gray-500 text-sm hidden md:inline">Portfolio</span>
        <span className="text-sm sm:text-lg font-data font-medium text-white value-pulse truncate">
          {formatMoney(totalValue)}
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Income pill */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
        <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-xs font-data text-emerald-400">
          {formatMoney(monthlyIncome)}/mo
        </span>
      </div>

      {/* Currency switcher */}
      <div className="flex items-center rounded-lg border border-white/10 overflow-hidden flex-shrink-0">
        {CURRENCIES.map((code) => (
          <button
            key={code}
            onClick={() => setActiveCurrency(code)}
            className={`px-1.5 sm:px-2.5 py-1 text-[10px] sm:text-xs font-medium transition-all duration-200 ${
              activeCurrency === code
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span className="sm:hidden font-data">{SYMBOLS[code]}</span>
            <span className="hidden sm:inline font-data">{SYMBOLS[code]} {code}</span>
          </button>
        ))}
      </div>

      {/* Date/Time */}
      <div className="text-right hidden sm:block">
        <p className="text-xs text-gray-500">{formattedDate}</p>
        <p className="text-sm font-data text-gray-300">{formattedTime}</p>
      </div>

      {/* Notification bell */}
      <button className="relative p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors hidden sm:block">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-400 rounded-full" />
      </button>
    </header>
  );
}
