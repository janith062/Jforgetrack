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
    return `flex items-center h-[44px] px-4 rounded-lg transition-colors group relative ${
      isActive
        ? 'bg-surface-raised text-fg-primary'
        : 'text-fg-secondary hover:bg-surface hover:text-fg-primary'
    }`;
  };

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink to={to} className={navItemClass}>
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-accent-glow rounded-l-lg"></div>
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
      <div className="flex items-center px-4 mb-8">
        <div className="w-8 h-8 rounded-lg bg-accent-glow flex items-center justify-center mr-3">
          <span className="text-white font-bold font-display">F</span>
        </div>
        <span className="text-h2 text-fg-primary tracking-tight">ForgeTrack</span>
      </div>

      {/* Welcome Block */}
      <div className="px-4 mb-6">
        <div className="text-body-sm text-fg-secondary">Welcome Back</div>
        <div className="text-body font-medium truncate">{user?.email}</div>
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
        <button onClick={handleLogout} className="flex w-full items-center h-[44px] px-4 rounded-lg text-fg-secondary hover:bg-surface hover:text-fg-primary transition-colors">
          <LogOut className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-body font-normal">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
