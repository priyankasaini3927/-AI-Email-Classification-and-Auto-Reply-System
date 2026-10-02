import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Mail, 
  ScrollText, 
  Settings, 
  Bot, 
  ChevronDown, 
  CheckCircle2, 
  Zap, 
  ShieldCheck,
  User,
  Sparkles,
  ExternalLink,
  LogOut,
  Sliders,
  Loader2
} from 'lucide-react';

export function Sidebar({ mobileOpen, setMobileOpen }) {
  const { emails, settings, status, setIsTestModalOpen } = useApp();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const navItems = [
    {
      id: 'dashboard',
      path: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'emails',
      path: '/emails',
      label: 'Emails',
      icon: Mail,
      badge: emails.length,
    },
    {
      id: 'logs',
      path: '/logs',
      label: 'Logs',
      icon: ScrollText,
      badge: null,
    },
    {
      id: 'settings',
      path: '/settings',
      label: 'Settings',
      icon: Settings,
      badge: null,
    },
  ];

  const handleNavClick = (path) => {
    navigate(path);
    if (setMobileOpen) setMobileOpen(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Determine current active page from location pathname
  const currentPath = location.pathname;

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex-shrink-0 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-transform duration-300 ease-in-out ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}
    >
      {/* Top Brand / Logo */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[1px] shadow-glow-indigo flex-shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-1.5 truncate">
              AI Email Assistant
            </h1>
            <p className="text-[10px] text-indigo-400/90 font-medium tracking-wide uppercase">
              Automate • Classify • Respond
            </p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <div className="px-3 pb-2 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
          Main Navigation
        </div>
        
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path || (item.path === '/emails' && currentPath.startsWith('/emails'));
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.path)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== null && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-indigo-700/80 text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick Test Simulator Button */}
        <div className="pt-4">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-indigo-950/80 to-cyan-950/80 hover:from-indigo-900/90 hover:to-cyan-900/90 border border-indigo-500/30 text-indigo-200 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Test Ingestion Simulator</span>
          </button>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="p-3 border-t border-slate-800/80 space-y-3 bg-[#090d16]">
        {/* System Status Card */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">System Online</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono border border-emerald-500/20">
              v1.0.0
            </span>
          </div>

          <div className="space-y-1 text-[11px] text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Gmail:</span>
              <span className={`font-medium flex items-center gap-1 ${status?.gmailConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                {status?.gmailConnected && <CheckCircle2 className="w-3 h-3 inline" />}
                {status?.gmailConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Protocol:</span>
              <span className="text-slate-300">IMAP (993) + SMTP (587)</span>
            </div>
          </div>
        </div>

        {/* User Profile & Direct Logout Button */}
        <div className="space-y-2">
          <div className="relative">
            <div
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-900/80 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-inner flex-shrink-0">
                  AD
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-200 truncate leading-tight">
                    {user?.email || 'admin@example.com'}
                  </p>
                  <p className="text-[10px] text-indigo-400 truncate uppercase tracking-wider font-semibold">
                    Administrator
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </div>

            {/* Profile Dropdown */}
            {profileDropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl space-y-1 text-xs z-50 animate-fade-in">
                <div className="px-2.5 py-1.5 border-b border-slate-800 text-[11px] text-slate-400 truncate">
                  Signed in as <span className="text-slate-200 font-medium">{user?.email || 'admin@example.com'}</span>
                </div>
                <button
                  onClick={() => {
                    navigate('/settings');
                    setProfileDropdownOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors text-left cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Automation Settings</span>
                </button>
                <button
                  id="profile-logout-button"
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Dedicated Logout Button */}
          <button
            id="sidebar-logout-button"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-red-400 hover:bg-red-950/20 border border-slate-800/80 hover:border-red-500/30 transition-all cursor-pointer disabled:opacity-50"
            title="Log out of admin session"
          >
            {isLoggingOut ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Signing out...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-400" />
                <span>Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
