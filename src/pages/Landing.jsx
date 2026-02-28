import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Pricing', href: '#pricing' },
];

const FEATURES = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Unified Portfolio',
    description: 'See stocks, ETFs, and crypto from every broker in a single dashboard. No more switching tabs.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Income Tracking',
    description: 'Track dividends, staking rewards, and yield in real time. DRIP simulator projects your compounding future.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'AI Insights',
    description: 'AI-powered analysis of your portfolio. Ask questions, get context-aware answers based on your real holdings.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
    ),
    title: 'Broker & Exchange Integrations',
    description: 'Connect your brokers, exchanges, and crypto wallets. Your API keys stay encrypted at rest — we never place trades.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
      </svg>
    ),
    title: 'Dividend Calendar',
    description: 'See every upcoming payment on a visual calendar. Filter by type — dividends, staking, yield, interest.',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
      </svg>
    ),
    title: 'Multi-Currency',
    description: 'Switch between USD, EUR, and GBP instantly. All values convert in real time — no page reload.',
  },
];

const BROKERS = [
  { name: 'DeGiro', color: '#ff6600' },
  { name: 'Trading 212', color: '#2b6fea' },
  { name: 'Binance', color: '#f0b90b' },
  { name: 'Crypto.com', color: '#002d74' },
];

function Nav({ scrolled }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-black/70 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Wordmark */}
        <Link to="/" className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
          Accrue
        </Link>

        {/* Center nav — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm text-white/45 hover:text-white transition-colors duration-200"
            >
              {link.label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="text-sm text-white/60 hover:text-white px-4 py-2 transition-colors duration-200"
          >
            Log in
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] px-5 py-2 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(124,92,252,0.25)] hover:shadow-[0_0_30px_rgba(124,92,252,0.4)]"
          >
            Get Early Access
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-white/60 hover:text-white p-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/90 backdrop-blur-xl border-t border-white/[0.06] px-6 py-4 space-y-3">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm text-white/45 hover:text-white py-2"
            >
              {link.label}
            </a>
          ))}
          <div className="pt-3 border-t border-white/[0.06] flex flex-col gap-2">
            <Link to="/login" className="text-sm text-white/60 hover:text-white py-2">
              Log in
            </Link>
            <Link
              to="/register"
              className="text-sm font-medium text-white bg-[#7C5CFC] px-5 py-2.5 rounded-full text-center"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle background */}
      <ParticleBackground />

      {/* Purple radial glow */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -55%)',
          background: 'radial-gradient(circle, rgba(124,92,252,0.18) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
        {/* Beta badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-[#7C5CFC]/30 bg-[#7C5CFC]/[0.08] mb-8 landing-fade-up">
          <span className="w-2 h-2 rounded-full bg-[#7C5CFC] animate-pulse" />
          <span className="text-xs font-medium text-[#9B7DFF] tracking-wider uppercase" style={{ fontFamily: '"DM Mono", monospace' }}>
            Beta Live
          </span>
        </div>

        {/* Headline */}
        <h1 className="landing-fade-up" style={{ animationDelay: '0.1s' }}>
          <span className="block text-5xl md:text-7xl font-bold text-white leading-[1.08] tracking-[-0.02em]" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
            Your Portfolio.
          </span>
          <span
            className="block text-5xl md:text-7xl font-bold leading-[1.08] tracking-[-0.02em] bg-clip-text text-transparent"
            style={{
              fontFamily: '"Cal Sans", "Inter", sans-serif',
              backgroundImage: 'linear-gradient(135deg, #7C5CFC 0%, #B78AFF 100%)',
            }}
          >
            One Dashboard.
          </span>
        </h1>

        {/* Subtext */}
        <p
          className="mt-6 text-base md:text-lg text-white/40 max-w-[520px] mx-auto leading-relaxed landing-fade-up"
          style={{ animationDelay: '0.2s' }}
        >
          Unified view of your stocks, ETFs, and crypto across every broker and exchange.
          Real data. AI insights. Zero spreadsheets.
        </p>

        {/* CTA row */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 landing-fade-up" style={{ animationDelay: '0.3s' }}>
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 text-sm font-medium text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] px-7 py-3 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(124,92,252,0.3)] hover:shadow-[0_0_50px_rgba(124,92,252,0.5)]"
          >
            Get Early Access
            <svg className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
          <a
            href="#features"
            className="text-sm text-white/40 hover:text-white/70 px-6 py-3 rounded-full border border-white/[0.08] hover:border-white/[0.15] transition-all duration-200"
          >
            See how it works
          </a>
        </div>

        {/* Glass stat block — P2: live-looking portfolio preview */}
        <div className="mt-10 mx-auto max-w-xs landing-fade-up" style={{ animationDelay: '0.4s' }}>
          <div
            className="relative p-5 rounded-2xl border border-white/[0.1] text-left"
            style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}
          >
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-wider mb-1" style={{ fontFamily: '"DM Mono", monospace' }}>Total Portfolio</p>
                <p className="text-2xl font-bold text-white" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>€11,534</p>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                <span className="text-xs text-emerald-400 font-medium" style={{ fontFamily: '"DM Mono", monospace' }}>+8.3% yield</span>
              </div>
            </div>
            {/* Mini stats row */}
            <div className="flex items-center gap-5 pt-3 border-t border-white/[0.07]">
              {[
                { label: 'Monthly', value: '€96/mo' },
                { label: 'Holdings', value: '24' },
                { label: 'Sources', value: '4 brokers' },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-[9px] text-white/25 mb-0.5 uppercase tracking-wider">{s.label}</p>
                  <p className="text-xs text-white/70 font-medium" style={{ fontFamily: '"DM Mono", monospace' }}>{s.value}</p>
                </div>
              ))}
            </div>
            {/* Corner glow */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(124,92,252,0.2) 0%, transparent 70%)', filter: 'blur(10px)' }}
            />
          </div>
        </div>

        {/* Social proof */}
        <div className="mt-8 flex items-center justify-center gap-6 landing-fade-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex -space-x-2">
            {BROKERS.map((b) => (
              <div
                key={b.name}
                className="w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: b.color }}
                title={b.name}
              >
                {b.name[0]}
              </div>
            ))}
          </div>
          <p className="text-xs text-white/25" style={{ fontFamily: '"DM Mono", monospace' }}>
            Multiple brokers &amp; exchanges &middot; Live data
          </p>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 landing-fade-up" style={{ animationDelay: '0.6s' }}>
        <div className="w-5 h-8 rounded-full border border-white/10 flex items-start justify-center p-1.5">
          <div className="w-1 h-2 rounded-full bg-white/20 animate-bounce" />
        </div>
      </div>
    </section>
  );
}

function AppPreview() {
  const BARS = [28, 42, 35, 58, 50, 72, 65, 80, 61, 75, 88, 92];
  const MONTHS = ['Mar', 'Jun', 'Sep', 'Feb'];
  const HOLDINGS = [
    { ticker: 'VWCE', pct: '38%', bar: 95, color: '#7C5CFC' },
    { ticker: 'BTC',  pct: '22%', bar: 55, color: '#f59e0b' },
    { ticker: 'AAPL', pct: '15%', bar: 38, color: '#10b981' },
    { ticker: 'ETH',  pct: '12%', bar: 30, color: '#6366f1' },
  ];

  return (
    <section className="relative py-6 pb-24 overflow-hidden">
      {/* Fade edges into surrounding sections */}
      <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black to-transparent pointer-events-none z-10" />
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black to-transparent pointer-events-none z-10" />

      <div className="max-w-5xl mx-auto px-6 relative">
        {/* Section label */}
        <p className="text-center text-[10px] text-white/20 uppercase tracking-[0.25em] mb-10"
           style={{ fontFamily: '"DM Mono", monospace' }}>
          Dashboard Preview
        </p>

        {/* Perspective wrapper */}
        <div style={{ perspective: '1200px' }}>
          {/* Ambient glow behind the frame */}
          <div
            className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
            style={{
              width: '75%', height: '55%', bottom: '-8%',
              background: 'radial-gradient(ellipse at 50% 80%, rgba(124,92,252,0.2) 0%, transparent 65%)',
              filter: 'blur(32px)',
            }}
          />

          {/* Browser frame */}
          <div
            className="relative rounded-xl overflow-hidden border border-white/[0.12]"
            style={{
              transform: 'rotateX(5deg)',
              transformOrigin: 'center bottom',
              boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
          >
            {/* Chrome bar */}
            <div className="flex items-center gap-3 px-4 h-9 bg-[#0d0d12] border-b border-white/[0.06] flex-shrink-0">
              {/* Traffic lights */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
              </div>
              {/* URL bar */}
              <div className="flex-1 h-5 rounded bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mx-4">
                <span className="text-[9px] text-white/20" style={{ fontFamily: '"DM Mono", monospace' }}>
                  accrue-io.vercel.app/dashboard
                </span>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="bg-[#07070b] p-4 select-none">
              {/* KPI cards row */}
              <div className="grid grid-cols-4 gap-2 mb-3">
                {[
                  { label: 'Portfolio',      value: '€11,534',  accent: '#10b981' },
                  { label: 'Monthly Income', value: '€47/mo',   accent: '#06b6d4' },
                  { label: 'Avg. Yield',     value: '3.2%',     accent: '#f59e0b' },
                  { label: 'Holdings',       value: '24 assets', accent: '#7C5CFC' },
                ].map((k) => (
                  <div key={k.label}
                    className="rounded-lg p-2.5"
                    style={{
                      background: 'rgba(255,255,255,0.025)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderLeft: `2px solid ${k.accent}`,
                    }}
                  >
                    <p className="text-[7px] text-white/30 uppercase tracking-wide mb-1">{k.label}</p>
                    <p className="text-xs font-bold text-white" style={{ fontFamily: '"DM Mono", monospace' }}>{k.value}</p>
                  </div>
                ))}
              </div>

              {/* Body: bar chart + holdings */}
              <div className="grid grid-cols-5 gap-2">
                {/* Bar chart — col-span-3 */}
                <div className="col-span-3 rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[7px] text-white/30 uppercase tracking-wide mb-3">Income Over Time</p>
                  <div className="flex items-end gap-0.5 h-14">
                    {BARS.map((h, i) => (
                      <div key={i} className="flex-1 rounded-t-[2px]"
                        style={{
                          height: `${h}%`,
                          background: i === BARS.length - 1
                            ? 'linear-gradient(to top, #10b981, #34d399)'
                            : `rgba(16,185,129,${0.22 + (h / 100) * 0.38})`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between mt-1.5">
                    {MONTHS.map((m) => (
                      <span key={m} className="text-[7px] text-white/15">{m}</span>
                    ))}
                  </div>
                </div>

                {/* Holdings list — col-span-2 */}
                <div className="col-span-2 rounded-lg p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <p className="text-[7px] text-white/30 uppercase tracking-wide mb-3">Top Holdings</p>
                  <div className="space-y-2">
                    {HOLDINGS.map((h) => (
                      <div key={h.ticker}>
                        <div className="flex justify-between mb-0.5">
                          <span className="text-[8px] text-white/55">{h.ticker}</span>
                          <span className="text-[8px] text-white/30">{h.pct}</span>
                        </div>
                        <div className="h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                          <div className="h-full rounded-full"
                            style={{ width: `${h.bar}%`, background: h.color, opacity: 0.72 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="relative py-32 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-xs font-medium text-[#7C5CFC] tracking-widest uppercase mb-3" style={{ fontFamily: '"DM Mono", monospace' }}>
            Features
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
            Everything in one place
          </h2>
          <p className="mt-4 text-white/35 max-w-md mx-auto">
            No more juggling broker apps. Accrue pulls your data together and gives you the full picture.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="group p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] transition-all duration-300"
              style={{ animationDelay: `${i * 0.06}s` }}
            >
              <div className="w-10 h-10 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#9B7DFF] mb-4 group-hover:shadow-[0_0_20px_rgba(124,92,252,0.15)] transition-shadow duration-300">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-white/35 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function About() {
  return (
    <section id="about" className="relative py-32 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-medium text-[#7C5CFC] tracking-widest uppercase mb-3" style={{ fontFamily: '"DM Mono", monospace' }}>
              About
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-6" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
              Built for investors who use multiple brokers
            </h2>
            <div className="space-y-4 text-sm text-white/40 leading-relaxed">
              <p>
                If you invest across multiple brokers and exchanges, you know the pain: no single view of your total portfolio, no unified income tracking, no coherent picture.
              </p>
              <p>
                Accrue connects to your brokers directly via their APIs, pulls your real positions and dividend history, and presents everything in one clean dashboard. Your API keys are encrypted at rest — we never place trades or modify your accounts.
              </p>
              <p>
                Add AI-powered analysis on top, and you get a personal portfolio terminal that actually understands your holdings.
              </p>
            </div>
          </div>

          {/* Visual element */}
          <div className="relative">
            <div className="aspect-square rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 flex flex-col justify-center">
              <div className="space-y-4">
                {[
                  { label: 'Integrations', value: 'Growing', color: '#7C5CFC' },
                  { label: 'Data encrypted', value: 'AES-256', color: '#22c55e' },
                  { label: 'API calls', value: 'Read-only', color: '#f59e0b' },
                  { label: 'Cost', value: 'Free', color: '#06b6d4' },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-white/[0.04] last:border-0">
                    <span className="text-sm text-white/35">{item.label}</span>
                    <span className="text-sm font-medium" style={{ color: item.color, fontFamily: '"DM Mono", monospace' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            {/* Glow behind card */}
            <div
              className="absolute -inset-4 -z-10 rounded-3xl"
              style={{
                background: 'radial-gradient(circle at 50% 50%, rgba(124,92,252,0.06) 0%, transparent 70%)',
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  const TRUST_ITEMS = [
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      title: 'AES-256 Encrypted',
      desc: 'API keys encrypted at rest. Never stored in plain text, never logged.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      title: 'Read-Only API Access',
      desc: 'We read your positions and history. No trades, no withdrawals — ever.',
    },
    {
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ),
      title: 'Your Data, Private',
      desc: 'Portfolio data is yours alone. Never sold, never shared with third parties.',
    },
  ];

  return (
    <section className="relative py-20 px-6 border-y border-white/[0.04]">
      <div className="max-w-5xl mx-auto">
        {/* Broker logo strip */}
        <div className="text-center mb-14">
          <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] mb-6" style={{ fontFamily: '"DM Mono", monospace' }}>
            Works with
          </p>
          <div className="flex items-center justify-center flex-wrap gap-6 md:gap-10">
            {BROKERS.map((b) => (
              <div key={b.name} className="flex items-center gap-2.5 group">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
                  style={{ background: b.color }}
                >
                  {b.name[0]}
                </div>
                <span className="text-sm text-white/35 group-hover:text-white/60 transition-colors duration-200">
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Security callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TRUST_ITEMS.map((item) => (
            <div
              key={item.title}
              className="flex gap-4 p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:border-white/[0.09] transition-all duration-300"
            >
              <div className="w-9 h-9 rounded-xl bg-[#7C5CFC]/10 border border-[#7C5CFC]/20 flex items-center justify-center text-[#9B7DFF] flex-shrink-0">
                {item.icon}
              </div>
              <div>
                <p className="text-sm font-semibold text-white mb-1">{item.title}</p>
                <p className="text-xs text-white/30 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCheck({ included }) {
  return included ? (
    <svg className="w-4 h-4 text-[#7C5CFC] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ) : (
    <svg className="w-4 h-4 text-white/15 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function Pricing() {
  const FREE_FEATURES = [
    { text: 'Dashboard, Holdings, Income, Calendar', included: true },
    { text: 'All broker connections', included: true },
    { text: 'DRIP Simulator', included: true },
    { text: 'Multi-currency (USD, EUR, GBP)', included: true },
    { text: '5 AI queries / month', included: true },
    { text: 'CSV export', included: false },
    { text: 'Auto sync (daily)', included: false },
    { text: 'Full income history', included: false },
  ];

  const PRO_FEATURES = [
    { text: 'Everything in Free', included: true },
    { text: 'Unlimited AI queries', included: true },
    { text: 'CSV export', included: true },
    { text: 'Auto sync (daily)', included: true },
    { text: 'Full income history', included: true },
    { text: 'Priority support', included: true },
  ];

  return (
    <section id="pricing" className="relative py-32 px-6">
      <div className="max-w-3xl mx-auto text-center">
        <p className="text-xs font-medium text-[#7C5CFC] tracking-widest uppercase mb-3" style={{ fontFamily: '"DM Mono", monospace' }}>
          Pricing
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>
          Start free, upgrade when ready
        </h2>
        <p className="text-white/35 max-w-md mx-auto mb-12">
          All core features are free. Upgrade to Pro for unlimited AI, CSV export, and daily auto sync.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-2xl mx-auto">
          {/* Free card */}
          <div className="p-7 rounded-2xl border border-white/[0.08] bg-white/[0.02] text-left">
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>Free</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>$0</span>
              <span className="text-white/25 text-sm ml-1">/month</span>
            </div>
            <ul className="space-y-2.5 text-sm mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <PricingCheck included={f.included} />
                  <span className={f.included ? 'text-white/55' : 'text-white/20'}>{f.text}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-sm font-medium text-center text-white/70 border border-white/[0.1] hover:border-white/[0.2] hover:text-white py-2.5 rounded-full transition-all duration-200"
            >
              Get Started Free
            </Link>
          </div>

          {/* Pro card */}
          <div className="relative p-7 rounded-2xl border border-[#7C5CFC]/30 bg-[#7C5CFC]/[0.04] text-left shadow-[0_0_40px_rgba(124,92,252,0.1)]">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#7C5CFC] text-white tracking-wider uppercase" style={{ fontFamily: '"DM Mono", monospace' }}>
                Most Popular
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>Pro</h3>
            <div className="mb-6">
              <span className="text-3xl font-bold text-white" style={{ fontFamily: '"Cal Sans", "Inter", sans-serif' }}>$8</span>
              <span className="text-white/25 text-sm ml-1">/month</span>
              <span className="text-white/20 text-[11px] ml-2" style={{ fontFamily: '"DM Mono", monospace' }}>($80/yr)</span>
            </div>
            <ul className="space-y-2.5 text-sm mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f.text} className="flex items-center gap-3">
                  <PricingCheck included={f.included} />
                  <span className="text-white/55">{f.text}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="block w-full text-sm font-medium text-center text-white bg-[#7C5CFC] hover:bg-[#6B4CE0] py-2.5 rounded-full transition-all duration-200 shadow-[0_0_20px_rgba(124,92,252,0.3)] hover:shadow-[0_0_30px_rgba(124,92,252,0.5)]"
            >
              Get Early Access
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.04] py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <span className="text-sm text-white/20" style={{ fontFamily: '"DM Mono", monospace' }}>
          Accrue &copy; {new Date().getFullYear()}
        </span>
        <div className="flex items-center gap-6">
          <Link to="/login" className="text-xs text-white/25 hover:text-white/50 transition-colors">
            Log in
          </Link>
          <Link to="/register" className="text-xs text-white/25 hover:text-white/50 transition-colors">
            Register
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden">
      <Nav scrolled={scrolled} />
      <Hero />
      <AppPreview />
      <Features />
      <About />
      <TrustBar />
      <Pricing />
      <Footer />
    </div>
  );
}
