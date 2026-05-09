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

    // #region agent log
    fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '5347d3'
      },
      body: JSON.stringify({
        sessionId: '5347d3',
        runId: 'initial',
        hypothesisId: 'H4',
        location: 'src/pages/Login.jsx:handleLogin:beforeSignIn',
        message: 'Login attempt started',
        data: {
          activeTab,
          identifierLength: identifier.length,
          derivedEmailDomain: email.includes('@') ? email.split('@')[1] : null
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // #region agent log
    fetch('http://127.0.0.1:7662/ingest/ff34898f-315f-4614-860e-a1a3f01603a4', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': '5347d3'
      },
      body: JSON.stringify({
        sessionId: '5347d3',
        runId: 'initial',
        hypothesisId: 'H2',
        location: 'src/pages/Login.jsx:handleLogin:afterSignIn',
        message: 'signInWithPassword completed',
        data: error
          ? {
              hasError: true,
              errorMessage: error.message,
              errorStatus: error.status ?? null,
              errorCode: error.code ?? null,
              errorName: error.name ?? null
            }
          : { hasError: false },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // AuthContext and App.jsx handle the redirect automatically via onAuthStateChange
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-void text-fg-primary relative p-4 overflow-hidden">
      {/* Background Elements */}
      <div className="cosmic-background z-0"></div>
      <div className="grid-overlay z-0"></div>
      
      {/* Floating glowing orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-accent-glow/20 blur-[120px] pointer-events-none z-0 animate-pulse-glow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-accent-purple/20 blur-[100px] pointer-events-none z-0 animate-pulse-glow" style={{ animationDelay: '2s' }}></div>

      <div className="card glass-panel w-full max-w-[440px] z-10 p-12 relative shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-btn-gradient flex items-center justify-center mb-6 shadow-lg shadow-accent-glow/20">
            <span className="text-white font-bold font-display text-2xl">F</span>
          </div>
          <h1 className="text-display-sm tracking-tight text-fg-primary font-display">ForgeTrack</h1>
          <p className="text-fg-secondary mt-2 text-sm">Enter your credentials to access the portal</p>
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
            className="btn-accent w-full mt-4 h-12 text-base"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
