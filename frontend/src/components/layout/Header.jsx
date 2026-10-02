import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Sparkles, 
  RefreshCw, 
  ShieldCheck, 
  AlertTriangle, 
  Menu, 
  Clock, 
  Calendar,
  Send,
  Zap,
  LogOut
} from 'lucide-react';

export function Header({ setMobileOpen }) {
  const { settings, status, refreshData, isLoading, runIngestion, isIngesting } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const executionMode = status?.executionMode || settings?.automation?.executionMode || 'dry_run';
  const isDryRun = executionMode === 'dry_run';

  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <header className="sticky top-0 z-30 bg-[#080c14] border-b border-slate-800 px-4 sm:px-8 py-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left: Greeting & Subtitle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Right: Date/Time, Status Badge & Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Live Clock / Date */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-mono text-slate-400">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>{formattedDate}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-200 font-medium">{formattedTime}</span>
          </div>

          {/* Execution Mode Status Badge */}
          <div className="flex items-center">
            {isDryRun ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                <span>Dry Run — Safe Mode</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Execution</span>
              </div>
            )}
          </div>

          {/* Test Ingestion Pipeline Button */}
          <button
            onClick={() => runIngestion()}
            disabled={isIngesting || isLoading}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Fetches Gmail inbox, executes Gemini classification, deterministic confidence & routing"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
            <span>{isIngesting ? 'Processing inbox...' : 'Test Ingestion'}</span>
          </button>

          {/* Refresh Data Button */}
          <button
            onClick={() => refreshData()}
            disabled={isLoading || isIngesting}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
            title="Refresh dashboard data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Quick Sign Out Button */}
          <button
            id="header-logout-button"
            onClick={async () => {
              await logout();
              navigate('/login', { replace: true });
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 transition-all cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
