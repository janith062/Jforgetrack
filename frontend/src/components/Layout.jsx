import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const Layout = () => {
  return (
    <div className="flex h-screen bg-void text-fg-primary overflow-hidden relative">
      {/* Background Elements */}
      <div className="cosmic-background z-0"></div>
      <div className="grid-overlay z-0"></div>
      
      {/* Floating glowing orbs for extra premium feel */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-glow/10 blur-[120px] pointer-events-none z-0 animate-pulse-glow"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[30%] rounded-full bg-accent-purple/10 blur-[100px] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      {/* Sidebar - hidden on mobile by default */}
      <div className="hidden md:flex w-[260px] flex-shrink-0 border-r border-border-subtle bg-surface/30 backdrop-blur-md z-20">
        <Sidebar />
      </div>

      {/* Main Content Wrapper */}
      <div className="flex flex-col flex-1 overflow-hidden relative z-10">
        <TopBar />

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
