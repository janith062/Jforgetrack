import React, { useState, useEffect, createContext, useContext } from 'react';
import { CheckCircle2, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (title, message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
};

const ToastItem = ({ toast, onRemove }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onRemove]);

  const Icon = toast.type === 'success' ? CheckCircle2 : XCircle;
  const iconColor = toast.type === 'success' ? 'text-success' : 'text-danger';

  return (
    <div className="w-[360px] bg-surface-raised border border-border-default rounded-lg p-4 flex gap-3 pointer-events-auto shadow-raised animate-in slide-in-from-right-8 fade-in duration-300">
      <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1">
        <h4 className="text-body font-semibold text-fg-primary">{toast.title}</h4>
        {toast.message && <p className="text-body-sm text-fg-secondary mt-1">{toast.message}</p>}
      </div>
      <button onClick={onRemove} className="text-fg-secondary hover:text-fg-primary flex-shrink-0 h-fit">
        <X size={16} />
      </button>
    </div>
  );
};
