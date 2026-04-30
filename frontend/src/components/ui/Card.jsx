import React from 'react';

export const Card = ({ children, className = '', ...props }) => {
  return (
    <div className={`card ${className}`} {...props}>
      {children}
    </div>
  );
};

export const HeroCard = ({ children, className = '', ...props }) => {
  return (
    <div className={`bg-surface bg-card-gradient rounded-2xl shadow-card p-10 border border-border-subtle ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader = ({ label, icon: Icon, title, className = '' }) => (
  <div className={`mb-6 ${className}`}>
    {(label || Icon) && (
      <div className="flex items-center gap-2 mb-2 text-label text-fg-tertiary uppercase tracking-wider">
        {Icon && <Icon size={16} />}
        {label}
      </div>
    )}
    {title && <h2 className="text-h2 text-fg-primary">{title}</h2>}
  </div>
);
