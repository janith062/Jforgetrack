import React, { useState, useRef, useEffect } from 'react';
import { Search, LogOut, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

const TopBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  
  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Create a simple breadcrumb from the path
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentPath = pathParts.length > 0 
    ? pathParts[pathParts.length - 1].charAt(0).toUpperCase() + pathParts[pathParts.length - 1].slice(1)
    : 'Overview';

  return (
    <header className="h-[72px] flex-shrink-0 border-b border-border-subtle bg-canvas/80 backdrop-blur-md flex items-center justify-between px-6 md:px-8 z-30">
      <div className="flex items-center text-fg-secondary text-body-sm">
        <span>Overview</span>
        <span className="mx-2">/</span>
        <span className="text-fg-primary font-medium">{currentPath}</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-fg-tertiary" />
          <input 
            type="text" 
            placeholder="Search students, topics..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
            className="input !h-[36px] !pl-9 !py-1 !text-body-sm bg-surface w-[240px]"
          />
        </div>
        
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          <div className="text-right hidden sm:block">
            <div className="text-body-sm font-medium text-fg-primary">
              {user?.display_name || user?.email?.split('@')[0]}
            </div>
            <div className="text-[10px] text-fg-tertiary uppercase tracking-wider">
              {user?.email === 'shreyas@gmail.com' ? 'Lead Mentor' : 'User'}
            </div>
          </div>
          
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-9 h-9 rounded-full bg-surface-raised border border-border-default flex items-center justify-center text-fg-primary font-medium hover:border-accent-glow transition-all active:scale-95"
          >
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-surface-raised border border-border-subtle rounded-lg shadow-raised p-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-3 py-2 border-b border-border-subtle mb-1">
                <div className="text-xs font-semibold text-fg-primary truncate">{user?.email}</div>
              </div>
              
              <button 
                onClick={signOut}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger-fg hover:bg-danger-bg/20 rounded-md transition-colors"
              >
                <LogOut size={16} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
