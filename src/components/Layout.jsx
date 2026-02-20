import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorBoundary from './ErrorBoundary';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0f1e]">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Header collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content area */}
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: collapsed ? '4rem' : '15rem' }}
      >
        <div className="p-4 md:p-6 animate-fadeIn">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}
