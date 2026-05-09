import React from 'react';

export const Pill = ({ status, children, className = '' }) => {
  let pillClass = 'pill bg-surface-raised text-fg-tertiary border border-border-subtle';

  if (status === 'success' || status === 'present') {
    pillClass = 'pill pill-success';
  } else if (status === 'danger' || status === 'absent') {
    pillClass = 'pill pill-danger';
  } else if (status === 'warning') {
    pillClass = 'pill bg-warning-bg text-warning border border-warning-border shadow-[0_0_10px_rgba(245,158,11,0.1)]';
  } else if (status === 'accent') {
    pillClass = 'pill pill-accent';
  }

  return (
    <span className={`${pillClass} ${className}`}>
      {children}
    </span>
  );
};

export const StatusDot = ({ status, className = '' }) => {
  let colorClass = 'bg-fg-tertiary opacity-40';
  if (status === 'present' || status === 'success') colorClass = 'bg-success shadow-[0_0_6px_rgba(16,185,129,0.6)]';
  else if (status === 'absent' || status === 'danger') colorClass = 'bg-danger shadow-[0_0_6px_rgba(244,63,94,0.6)]';

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colorClass} ${className}`} />
  );
};
