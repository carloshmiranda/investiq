import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < 1024 : false
  );
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = (e) => setIsMobile(!e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);
  return isMobile;
}

export default function Layout() {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(false);
  // On mobile, sidebar is open/closed (drawer). On desktop, collapsed/expanded.
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Desktop: margin based on collapsed state. Mobile: no margin (full-width).
  const marginLeft = isMobile ? '0' : collapsed ? '4rem' : '15rem';

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#050505] transition-colors duration-300">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isMobile={isMobile}
      />
      <Header
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        isMobile={isMobile}
      />

      {/* Main content area */}
      <main
        className="min-h-screen w-full overflow-x-hidden transition-all duration-300"
        style={{ marginLeft, paddingTop: 'calc(var(--safe-top) + 4rem)', paddingBottom: 'var(--safe-bottom)' }}
      >
        <div className="p-3 sm:p-4 md:p-6 animate-fadeIn min-w-0">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
