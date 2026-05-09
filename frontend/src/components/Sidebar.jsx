import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CheckSquare, Users, BookOpen, Upload, UserCheck, Calendar, Settings, LogOut } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

const Sidebar = () => {
  const { role, user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItemClass = ({ isActive }) => {
    return `flex items-center h-[44px] px-4 rounded-xl transition-all duration-300 group relative ${
      isActive
        ? 'bg-surface-raised text-white shadow-md border border-border-default'
        : 'text-fg-secondary hover:bg-surface hover:text-white hover:-translate-y-px'
    }`;
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={navItemClass}>
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-[-1px] top-1/2 -translate-y-1/2 w-[3px] h-[60%] bg-accent-glow rounded-r-full shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
          )}
          <Icon className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-body font-normal">{label}</span>
        </>
      )}
    </NavLink>
  );

  const Label = ({ children }) => (
    <div className="text-label text-fg-tertiary mb-3 px-4 mt-6">{children}</div>
  );

  return (
    <div className="flex flex-col w-full h-full py-6 px-4">
      {/* Logo Area */}
      <div className="flex items-center px-4 mb-8 mt-2">
        <div className="w-10 h-10 rounded-xl bg-btn-gradient flex items-center justify-center mr-3 shadow-lg shadow-accent-glow/20">
          <span className="text-white font-bold font-display text-xl">F</span>
        </div>
        <span className="text-2xl font-display font-bold tracking-tight text-white">ForgeTrack</span>
      </div>

      {/* Welcome Block */}
      <div className="px-4 mb-6">
        <div className="text-micro text-fg-secondary uppercase tracking-wider mb-1">Welcome Back</div>
        <div className="text-sm font-medium text-white truncate">{user?.email}</div>
      </div>

      <div className="h-px bg-border-subtle mx-4 mb-2"></div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        {role === 'mentor' && (
          <>
            <Label>Overview</Label>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />

            <Label>Activity</Label>
            <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
            <NavItem to="/history" icon={Users} label="Student History" />
            <NavItem to="/materials" icon={BookOpen} label="Materials" />

            <Label>Data</Label>
            <NavItem to="/upload" icon={Upload} label="Upload CSV" />
          </>
        )}

        {role === 'student' && (
          <>
            <Label>Overview</Label>
            <NavItem to="/me/attendance" icon={UserCheck} label="My Attendance" />
            <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
            
            <Label>Resources</Label>
            <NavItem to="/me/materials" icon={BookOpen} label="Materials" />
          </>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto pt-4 border-t border-border-subtle">
        <Label>Account</Label>
        <NavLink to="/settings" className={navItemClass}>
          <Settings className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-body font-normal">Settings</span>
        </NavLink>
        <button onClick={handleLogout} className="flex w-full items-center h-[44px] px-4 mt-1 rounded-xl text-fg-secondary hover:bg-danger-bg hover:text-danger hover:border hover:border-danger-border transition-all duration-300">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-body font-normal">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
