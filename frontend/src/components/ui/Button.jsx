import React from 'react';

export const Button = ({ children, variant = 'primary', size, className = '', ...props }) => {
  let btnClass = 'btn-accent';
  if (variant === 'secondary') {
    btnClass = 'btn-secondary';
  } else if (variant === 'ghost') {
    btnClass = 'text-fg-secondary hover:text-white text-sm font-medium transition-colors duration-200 px-4 py-2 rounded-xl hover:bg-surface';
  } else if (variant === 'destructive') {
    btnClass = 'btn-secondary !text-danger !border-danger-border hover:!bg-danger-bg hover:!text-danger';
  } else if (variant === 'icon') {
    btnClass = 'w-10 h-10 rounded-xl bg-surface-raised border border-border-default flex items-center justify-center text-fg-secondary hover:text-white hover:border-accent-glow transition-all duration-200';
  }

  const sizeClass = size === 'sm' ? '!px-3 !py-1.5 !text-xs' : '';

  return (
    <button className={`${btnClass} ${sizeClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
