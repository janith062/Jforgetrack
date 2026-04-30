import React, { useEffect } from 'react';
import { Button } from './Button';

export const Modal = ({ isOpen, onClose, title, children, actions }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-[#07070B]/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-surface-raised border border-border-default rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.4)] p-10 max-w-[560px] w-[calc(100%-32px)] z-10">
        <h2 className="text-h2 text-fg-primary mb-4">{title}</h2>
        <div className="text-body-lg text-fg-secondary mb-8">
          {children}
        </div>
        {actions && (
          <div className="flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDestructive = false }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant={isDestructive ? 'destructive' : 'primary'} onClick={onConfirm}>{confirmText}</Button>
        </>
      }
    >
      {message}
    </Modal>
  );
};
