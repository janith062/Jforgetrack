import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

const Login = () => {
  const [activeTab, setActiveTab] = useState('mentor');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    let email = identifier;

    // For students, the identifier is their USN. We map it to the generated email.
    if (activeTab === 'student') {
      email = `${identifier.toLowerCase()}@forge.local`;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // AuthContext and App.jsx handle the redirect automatically via onAuthStateChange
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-void text-fg-primary relative p-4 overflow-hidden">
      {/* Cosmic Glow */}
      <div className="absolute inset-0 bg-cosmic-glow pointer-events-none z-0"></div>

      <div className="card w-full max-w-[440px] z-10 p-12 relative shadow-raised">
        <div className="flex flex-col items-center mb-8">
          <div className="w-10 h-10 rounded-lg bg-accent-glow flex items-center justify-center mb-4">
            <span className="text-white font-bold font-display text-xl">F</span>
          </div>
          <h1 className="text-h2 tracking-tight text-fg-primary">ForgeTrack</h1>
        </div>

        {/* Tab Toggle */}
        <div className="flex bg-surface-inset rounded-lg p-1 mb-8 border border-border-subtle">
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'mentor' ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-subtle' : 'text-fg-secondary hover:text-fg-primary'}`}
            onClick={() => { setActiveTab('mentor'); setError(null); }}
          >
            Mentor Login
          </button>
          <button
            type="button"
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'student' ? 'bg-surface-raised text-fg-primary shadow-sm border border-border-subtle' : 'text-fg-secondary hover:text-fg-primary'}`}
            onClick={() => { setActiveTab('student'); setError(null); }}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {error && (
            <div className="text-caption text-danger-fg bg-danger-bg p-3 rounded-md border border-danger-border text-center">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-label text-fg-secondary">
              {activeTab === 'mentor' ? 'EMAIL ADDRESS' : 'USN'}
            </label>
            <input
              type={activeTab === 'mentor' ? 'email' : 'text'}
              className="input"
              placeholder={activeTab === 'mentor' ? 'name@example.com' : '4SH24CS...'}
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label text-fg-secondary">PASSWORD</label>
            <input
              type="password"
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-2"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
