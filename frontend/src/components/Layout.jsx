import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-canvas text-fg-primary overflow-hidden">
      {/* Sidebar - hidden on mobile by default */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 border-r border-border-subtle bg-canvas">
        <Sidebar />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden relative">
        <TopBar />
        
        {/* Cosmic Glow Background */}
        <div className="absolute inset-0 bg-cosmic-glow pointer-events-none z-0"></div>

        {/* Scrollable Main Area */}
        <main className="flex-1 overflow-y-auto z-10 p-6 md:p-8 lg:p-12 relative">
          <div className="max-w-[1440px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
