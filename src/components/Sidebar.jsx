import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    path: '/dashboard',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    path: '/income',
    label: 'Income',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
  },
  {
    path: '/holdings',
    label: 'Holdings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    path: '/calendar',
    label: 'Calendar',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    path: '/connections',
    label: 'Connections',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
  },
  {
    path: '/ai-insights',
    label: 'AI Insights',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    badge: 'AI',
  },
  {
    path: '/billing',
    label: 'Billing',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: 'Settings',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.573-1.066z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, isMobile }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : 'IQ';

  // On mobile: slide in/out as a drawer. On desktop: collapsed/expanded in place.
  const sidebarWidth = isMobile ? 'w-60' : collapsed ? 'w-16' : 'w-60';
  const sidebarTranslate = isMobile && !mobileOpen ? '-translate-x-full' : 'translate-x-0';
  const showLabels = isMobile ? true : !collapsed;

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-20"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-[#080808]/95 backdrop-blur-md border-r border-white/[0.04]
          transition-all duration-300 ease-in-out
          ${sidebarWidth} ${sidebarTranslate}
        `}
        style={{ paddingTop: 'var(--safe-top)', paddingLeft: 'var(--safe-left)' }}
      >
        {/* Logo */}
        <div className={`flex items-center h-16 ${showLabels ? 'px-4' : 'justify-center px-2'} border-b border-white/5 flex-shrink-0 relative`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="sidebar-logo-icon w-8 h-8 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#a78bfa] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#7C5CFC]/20">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            {showLabels && (
              <span className="font-display font-bold text-lg gradient-text whitespace-nowrap">Accrue</span>
            )}
          </div>
          {/* Collapse toggle: floats on sidebar edge when collapsed, inline when expanded */}
          {!showLabels && !isMobile ? (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="sidebar-toggle-collapsed absolute -right-3 top-1/2 -translate-y-1/2 z-40 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200 focus:outline-none"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => isMobile ? setMobileOpen(false) : setCollapsed(!collapsed)}
              className="ml-auto p-1.5 rounded-md text-gray-400 hover:text-white hover:bg-white/5 transition-all duration-200 flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/20"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobile
                  ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />}
              </svg>
            </button>
          )}
        </div>

        {/* Nav items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                    transition-all duration-200 group relative
                    ${isActive
                      ? 'bg-[#7C5CFC]/10 text-[#a78bfa] border-l-[3px] border-[#7C5CFC] shadow-[inset_0_0_20px_rgba(124,92,252,0.05)]'
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.04] border-l-[3px] border-transparent'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  {showLabels && (
                    <>
                      <span className="whitespace-nowrap">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-[#7C5CFC]/15 text-[#a78bfa] border border-[#7C5CFC]/30">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {/* Tooltip on collapsed */}
                  {!showLabels && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 glass-card text-white text-xs rounded-lg
                      opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-xl">
                      {item.label}
                    </div>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom: user info */}
        <div className="p-3 border-t border-white/5 flex-shrink-0" style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}>
          <div className="flex items-center gap-3">
            <NavLink to="/settings" className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-xs font-bold flex-shrink-0 hover:ring-2 hover:ring-purple-400/40 transition-all shadow-md shadow-purple-500/20">
              {initials}
            </NavLink>
            {showLabels && (
              <div className="min-w-0 flex-1">
                <NavLink to="/settings" className="block text-sm font-medium text-white truncate hover:text-[#a78bfa] transition-colors">
                  {user?.name ?? 'User'}
                </NavLink>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 transition-colors focus:outline-none">
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
