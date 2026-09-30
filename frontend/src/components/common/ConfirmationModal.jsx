import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, ShieldCheck, X } from 'lucide-react';

export function ConfirmationModal() {
  const { confirmModalConfig, setConfirmModalConfig } = useApp();

  if (!confirmModalConfig) return null;

  const {
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'warning', // 'warning' | 'danger' | 'info'
    onConfirm,
  } = confirmModalConfig;

  const handleClose = () => {
    setConfirmModalConfig(null);
  };

  const handleConfirm = async () => {
    if (onConfirm) {
      await onConfirm();
    }
    handleClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 animate-fade-in">
      <div className="w-full max-w-md bg-[#0e1424] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-5">
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
            type === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
            type === 'danger' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
            'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
          }`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition-all ${
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-900/40' :
              type === 'danger' ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/40' :
              'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/40'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
