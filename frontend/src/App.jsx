import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LoginPage } from './components/auth/LoginPage';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { EmailsPage } from './components/emails/EmailsPage';
import { AuditLogsPage } from './components/logs/AuditLogsPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ToastContainer } from './components/common/ToastContainer';
import { FullEmailModal } from './components/common/FullEmailModal';
import { TestEmailModal } from './components/common/TestEmailModal';
import { ConfirmationModal } from './components/common/ConfirmationModal';

function AuthenticatedLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex flex-col lg:flex-row font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Mobile Sidebar Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden transition-opacity"
        />
      )}

      {/* Fixed Left Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-y-auto">
        <Header setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/emails" element={<EmailsPage />} />
            <Route path="/emails/:id" element={<EmailsPage />} />
            <Route path="/logs" element={<AuditLogsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

      {/* Global Modals & Notifications */}
      <FullEmailModal />
      <TestEmailModal />
      <ConfirmationModal />
      <ToastContainer />
    </div>
  );
}

export default function App() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  return (
    <Routes>
      {/* Root Entrypoint */}
      <Route
        path="/"
        element={
          isLoadingAuth ? (
            <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400 font-mono text-xs">
              Loading AI Email Assistant...
            </div>
          ) : isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />

      {/* Login Page Route */}
      <Route
        path="/login"
        element={
          !isLoadingAuth && isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginPage />
          )
        }
      />

      {/* Protected Admin Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AuthenticatedLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
