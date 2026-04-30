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
        <div className="flex-1 space-y-6">
          {activeTab === 'profile' && (
            <Card className="p-8">
              <CardHeader label="ACCOUNT" title="Profile Information" icon={User} />
              <div className="space-y-6 mt-8">
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase tracking-widest">Email Address</label>
                  <div className="p-3 bg-surface-inset rounded-lg border border-border-subtle text-fg-primary text-body-sm w-full max-w-md">
                    {user?.email}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase tracking-widest">Current Role</label>
                  <div className="flex items-center gap-2">
                    <div className="px-3 py-1 bg-accent-glow/10 text-accent-glow rounded-full text-caption font-semibold uppercase border border-accent-glow/20">
                      {role}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-label text-fg-tertiary uppercase tracking-widest">Display Name</label>
                  <input 
                    type="text" 
                    placeholder="Enter your name"
                    defaultValue={user?.display_name || user?.email?.split('@')[0]}
                    className="input max-w-md bg-surface-inset"
                  />
                </div>
                <div className="pt-4">
                  <Button onClick={() => alert('Profile updated!')}>Save Changes</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <Card className="p-8">
              <CardHeader label="PREFERENCES" title="Notification Settings" icon={Bell} />
              <div className="space-y-4 mt-8">
                {[
                  { title: 'Email Alerts', desc: 'Receive daily attendance summaries via email.' },
                  { title: 'New Materials', desc: 'Notify students when new course materials are uploaded.' },
                  { title: 'Session Reminders', desc: 'Send automated reminders 30 mins before sessions.' }
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-surface-inset rounded-xl border border-border-subtle hover:border-border-default transition-all max-w-2xl">
                    <div className="pr-8">
                      <div className="text-body font-medium text-fg-primary">{item.title}</div>
                      <div className="text-caption text-fg-tertiary">{item.desc}</div>
                    </div>
                    <div className="w-12 h-6 bg-accent-glow/20 rounded-full relative cursor-pointer border border-accent-glow/30 flex-shrink-0">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-accent-glow rounded-full shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="p-8">
              <CardHeader label="SECURITY" title="Account Security" icon={Shield} />
              <div className="space-y-6 mt-8">
                <div className="p-4 bg-surface-inset rounded-xl border border-border-subtle max-w-2xl">
                  <div className="text-body font-medium text-fg-primary mb-1">Two-Factor Authentication</div>
                  <p className="text-caption text-fg-tertiary mb-4">Add an extra layer of security to your account.</p>
                  <Button variant="secondary" size="sm">Enable 2FA</Button>
                </div>
                <div className="p-4 bg-surface-inset rounded-xl border border-border-subtle max-w-2xl">
                  <div className="text-body font-medium text-fg-primary mb-1">Active Sessions</div>
                  <p className="text-caption text-fg-tertiary mb-4">You are currently logged in from this device (Windows Chrome).</p>
                  <Button variant="ghost" size="sm" className="text-danger-fg !px-0">Logout of all other sessions</Button>
                </div>
                <div className="pt-2">
                  <Button variant="secondary">Change Password</Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === 'appearance' && (
            <Card className="p-8">
              <CardHeader label="DESIGN" title="System Appearance" icon={Palette} />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 max-w-3xl">
                {[
                  { name: 'Dark Void', bg: 'bg-void', border: 'border-accent-glow' },
                  { name: 'Pure Dark', bg: 'bg-zinc-950', border: 'border-border-subtle' },
                  { name: 'Cosmic Blue', bg: 'bg-slate-950', border: 'border-border-subtle' }
                ].map(theme => (
                  <div key={theme.name} className={`p-4 rounded-xl border-2 cursor-pointer transition-all hover:scale-[1.02] ${theme.bg} ${theme.border}`}>
                    <div className="h-24 rounded-lg bg-surface-raised/30 mb-3 border border-white/5" />
                    <div className="text-caption font-semibold text-white uppercase">{theme.name}</div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === 'database' && (
            <Card className="p-8">
              <CardHeader label="SYSTEM" title="Database Health" icon={Database} />
              <div className="space-y-6 mt-8 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-surface-inset rounded-xl border border-border-subtle">
                    <div className="text-caption text-fg-tertiary uppercase mb-1 tracking-wider">Connection</div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-body font-semibold text-fg-primary uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <div className="p-4 bg-surface-inset rounded-xl border border-border-subtle">
                    <div className="text-caption text-fg-tertiary uppercase mb-1 tracking-wider">Latency</div>
                    <div className="text-body font-semibold text-fg-primary uppercase tracking-wider">24ms</div>
                  </div>
                </div>
                <div className="p-4 bg-surface-inset rounded-xl border border-border-subtle">
                  <div className="text-body font-medium text-fg-primary mb-4 uppercase tracking-widest text-[11px]">Table Statistics</div>
                  <div className="space-y-2">
                    {[
                      { name: 'Students', count: 124 },
                      { name: 'Attendance Records', count: 1452 },
                      { name: 'Materials', count: 32 }
                    ].map(stat => (
                      <div key={stat.name} className="flex justify-between items-center py-2 border-b border-border-subtle last:border-0">
                        <span className="text-body-sm text-fg-secondary">{stat.name}</span>
                        <span className="text-body-sm font-semibold text-fg-primary tabular-nums">{stat.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-2">
                  <Button variant="secondary">Export Full Database (.json)</Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
