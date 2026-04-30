import React from 'react';

export const Input = ({ label, helperText, error, className = '', ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="text-label text-fg-secondary mb-2 tracking-wider">{label}</label>}
      <input 
        className={`input ${error ? 'border-danger-border' : ''}`}
        {...props}
      />
      {error && <span className="text-caption text-danger mt-1">{error}</span>}
      {helperText && !error && <span className="text-caption text-fg-tertiary mt-1">{helperText}</span>}
    </div>
  );
};

export const Select = ({ label, options, className = '', ...props }) => {
  return (
    <div className={`flex flex-col mb-4 ${className}`}>
      {label && <label className="text-label text-fg-secondary mb-2 tracking-wider">{label}</label>}
      <select className="input appearance-none bg-surface-inset" {...props}>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};
