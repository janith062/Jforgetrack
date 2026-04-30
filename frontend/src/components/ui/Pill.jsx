import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export const Pill = ({ status, children, className = '' }) => {
  let pillClass = 'pill text-fg-tertiary bg-surface-inset';
  
  if (status === 'success' || status === 'present') {
    pillClass = 'pill-success';
  } else if (status === 'danger' || status === 'absent') {
    pillClass = 'pill-danger';
  } else if (status === 'warning') {
    pillClass = 'pill text-warning border-warning-border bg-warning-bg border';
  }

  return (
    <span className={`${pillClass} ${className}`}>
      {children}
    </span>
  );
};

export const StatusDot = ({ status, className = '' }) => {
  let colorClass = 'bg-fg-tertiary opacity-40';
  if (status === 'present' || status === 'success') colorClass = 'bg-success';
  else if (status === 'absent' || status === 'danger') colorClass = 'bg-danger';

  return (
    <span className={`inline-block w-2 h-2 rounded-full ${colorClass} ${className}`} />
  );
};
