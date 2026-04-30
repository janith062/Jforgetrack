import React from 'react';

const DevTokens = () => {
  return (
    <div className="p-12 min-h-screen bg-void text-fg-primary relative">
      <div className="absolute inset-0 bg-cosmic-glow pointer-events-none z-0"></div>

      <div className="max-w-4xl mx-auto z-10 relative">
        <h1 className="text-display-lg mb-12">Design System Tokens</h1>
        
        <div className="grid gap-12">
          {/* Card Component */}
          <section>
            <h2 className="text-label text-fg-tertiary mb-4">CARD & TYPOGRAPHY</h2>
            <div className="card">
              <h3 className="text-display-sm mb-2">Market Overview</h3>
              <p className="text-body text-fg-secondary mb-6">
                This card uses <code>bg-surface</code>, <code>card-gradient</code>, and <code>shadow-card</code>.
              </p>
              
              <div className="text-display-hero tabular-nums">76.4%</div>
            </div>
          </section>

          {/* Buttons */}
          <section>
            <h2 className="text-label text-fg-tertiary mb-4">BUTTONS</h2>
            <div className="flex gap-4">
              <button className="btn-primary">Primary Button</button>
              <button className="btn-secondary">Secondary Ghost</button>
            </div>
          </section>

          {/* Input */}
          <section>
            <h2 className="text-label text-fg-tertiary mb-4">INPUTS</h2>
            <div className="max-w-sm">
              <input type="text" className="input" placeholder="Enter session topic..." />
            </div>
          </section>

          {/* Pills */}
          <section>
            <h2 className="text-label text-fg-tertiary mb-4">STATUS PILLS</h2>
            <div className="flex gap-4">
              <span className="pill pill-success">+ 85% Present</span>
              <span className="pill pill-danger">- 15% Absent</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DevTokens;
