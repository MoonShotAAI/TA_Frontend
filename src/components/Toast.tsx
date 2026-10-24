'use client';

import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'info' | 'warning';
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success', onClose }) => {
  if (!message) return null;
  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 animate-in slide-in-from-bottom-5 duration-200">
      {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />}
      {type === 'warning' && <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />}
      {type === 'info' && <Info className="w-5 h-5 text-blue-400 flex-shrink-0" />}
      <span className="text-xs font-semibold text-slate-100">{message}</span>
      <button
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 rounded transition-colors ml-1"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
