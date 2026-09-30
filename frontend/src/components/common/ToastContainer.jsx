import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-full pointer-events-none">
      {toasts.map((toast) => {
        let Icon = Info;
        let border = 'border-indigo-500/30';
        let bg = 'bg-slate-900/95';
        let text = 'text-indigo-300';

        if (toast.type === 'success') {
          Icon = CheckCircle2;
          border = 'border-emerald-500/40';
          text = 'text-emerald-400';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          border = 'border-amber-500/40';
          text = 'text-amber-400';
        } else if (toast.type === 'error') {
          Icon = AlertCircle;
          border = 'border-rose-500/40';
          text = 'text-rose-400';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border ${border} ${bg} shadow-2xl animate-fade-in transition-all`}
          >
            <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${text}`} />
            <div className="flex-1 text-sm text-slate-200 font-medium leading-snug">
              {toast.message}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-200 transition-colors p-0.5 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
