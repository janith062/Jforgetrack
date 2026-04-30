import React from 'react';

export const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  let btnClass = 'btn-primary';
  if (variant === 'secondary') {
    btnClass = 'btn-secondary';
  } else if (variant === 'destructive') {
    btnClass = 'btn-secondary !text-danger !border-danger-border hover:!bg-danger-bg';
  } else if (variant === 'icon') {
    btnClass = 'w-10 h-10 rounded-md bg-surface-raised flex items-center justify-center text-fg-secondary hover:text-fg-primary';
  }
  
  return (
    <button className={`${btnClass} ${className}`} {...props}>
      {children}
    </button>
  );
};
