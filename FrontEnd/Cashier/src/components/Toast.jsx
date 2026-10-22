import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const styles = {
    success: 'bg-emerald-900/90 border-emerald-500/50 text-emerald-100',
    error: 'bg-rose-900/90 border-rose-500/50 text-rose-100',
    warning: 'bg-amber-900/90 border-amber-500/50 text-amber-100',
    info: 'bg-indigo-900/90 border-indigo-500/50 text-indigo-100',
  }[type];

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-400 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
    info: <Info className="w-5 h-5 text-indigo-400 shrink-0" />,
  }[type];

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 max-w-md ${styles}`}>
      {icons}
      <p className="text-sm font-medium pr-2">{message}</p>
      <button 
        onClick={onClose}
        className="p-1 rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
