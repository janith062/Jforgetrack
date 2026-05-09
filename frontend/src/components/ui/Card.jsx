import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-surface/60 backdrop-blur-xl border border-border-subtle rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:border-border-default hover:-translate-y-px hover:shadow-xl hover:shadow-accent-glow/5 ${className}`}
      {...props}
    >
      {/* Gradient shimmer on top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

export const HeroCard = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`bg-surface/50 backdrop-blur-xl border border-border-default rounded-2xl p-10 relative overflow-hidden transition-all duration-300 hover:border-accent-glow/30 hover:shadow-xl hover:shadow-accent-glow/10 ${className}`}
      {...props}
    >
      {/* Gradient shimmer on top */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent-glow/40 to-transparent pointer-events-none" />
      {children}
    </div>
  );
};

export const CardHeader = ({ label, icon: Icon, title, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {(label || Icon) && (
      <div className="flex items-center gap-2 mb-3 text-[10px] font-semibold text-fg-tertiary uppercase tracking-[0.12em]">
        {Icon && <Icon size={13} className="text-accent-glow" />}
        {label}
      </div>
    )}
    {title && <h2 className="text-xl font-display font-bold text-white tracking-tight">{title}</h2>}
  </div>
);
