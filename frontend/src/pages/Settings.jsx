import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import { Card, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { User, Bell, Shield, Palette, Database } from 'lucide-react';

const Settings = () => {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'database', label: 'Database', icon: Database }
  ];

  return (
    <div className="max-w-[1000px] mx-auto py-8 px-4 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-display-sm text-fg-primary mb-2">Settings</h1>
        <p className="text-body text-fg-secondary">Manage your account preferences and system configuration</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="flex flex-col gap-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                    activeTab === tab.id 
                      ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-subtle' 
                      : 'text-fg-secondary hover:text-fg-primary hover:bg-surface'
                  }`}
                >
                  <Icon size={18} />
                  <span className="font-medium text-body-sm">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <Card className="p-8">
              <CardHeader label="ACCOUNT" title="Profile Information" icon={User} />
              <div className="space-y-6 mt-8">
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase">Email Address</label>
                  <div className="p-3 bg-surface-inset rounded-lg border border-border-subtle text-fg-primary text-body-sm">
                    {user?.email}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase">Current Role</label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-accent-glow/10 text-accent-glow rounded-full text-caption font-semibold uppercase border border-accent-glow/20">
                      {role}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase">Display Name</label>
                  <input 
                    type="text" 
                    defaultValue={user?.display_name || user?.email?.split('@')[0]}
                    className="input max-w-md"
                  />
                </div>
                <div className="pt-4">
                  <Button disabled>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab !== 'profile' && (
            <Card className="p-12 text-center">
              <div className="w-16 h-16 rounded-full bg-surface flex items-center justify-center mx-auto mb-6">
                <Settings size={24} className="text-fg-tertiary" />
              </div>
              <h3 className="text-h3 text-fg-primary mb-2">Under Construction</h3>
              <p className="text-body text-fg-secondary max-w-sm mx-auto">
                The {activeTab} settings are currently being optimized for the next update.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
