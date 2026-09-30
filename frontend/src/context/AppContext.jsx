import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';
import { calculateConfidenceDetails, determineRoute, determineAction } from '../services/scoringEngine';

const AppContext = createContext();

export function AppProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [settings, setSettings] = useState(null);
  const [status, setStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterIntent, setFilterIntent] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');

  // Modals & Drawers
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isFullEmailModalOpen, setIsFullEmailModalOpen] = useState(false);
  const [fullEmailData, setFullEmailData] = useState(null);
  const [confirmModalConfig, setConfirmModalConfig] = useState(null);

  // Notifications / Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch initial data
  const loadInitialData = useCallback(async (showToastNotice = false) => {
    setIsLoading(true);
    try {
      const [fetchedStats, fetchedEmails, fetchedLogs, fetchedSettings, fetchedStatus] = await Promise.all([
        api.getStats(),
        api.getEmails(),
        api.getLogs(),
        api.getSettings(),
        api.getStatus(),
      ]);

      setStats(fetchedStats);
      setEmails(fetchedEmails);
      setLogs(fetchedLogs);
      setSettings(fetchedSettings);
      setStatus(fetchedStatus);

      if (fetchedEmails.length > 0 && !selectedEmail) {
        setSelectedEmail(fetchedEmails[0]);
      }

      if (showToastNotice) {
        addToast('Dashboard data refreshed successfully', 'success');
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
      addToast('Failed to load data from system', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast, selectedEmail]);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated, loadInitialData]);

  // Process a new test / incoming email
  const handleProcessEmail = async (emailInput) => {
    try {
      const { confidence } = calculateConfidenceDetails({
        intent_type: emailInput.intent_type,
        clarity_level: emailInput.clarity_level,
        missing_information: emailInput.missing_information,
        needs_human_review: emailInput.needs_human_review,
      });

      const route = determineRoute(confidence);
      const action = determineAction(route, emailInput.intent_type);

      const nextIdNum = emails.length + 25;
      const newId = `MSG-0${nextIdNum}`;

      const newEmailRecord = {
        id: newId,
        sender: emailInput.sender,
        sender_name: emailInput.sender_name || emailInput.sender.split('@')[0],
        subject: emailInput.subject,
        body: emailInput.body,
        timestamp: new Date().toISOString(),
        time_display: 'Just now',
        intent_type: emailInput.intent_type,
        clarity_level: emailInput.clarity_level,
        missing_information: emailInput.missing_information,
        needs_human_review: emailInput.needs_human_review,
        confidence,
        route,
        action,
        processing_status: 'Success',
        attachment: emailInput.attachment || null,
        reason: emailInput.reason || 'Processed via live AI test pipeline.',
        response_preview: emailInput.response_preview || `[AUTOMATED ${route.toUpperCase()}]: Action dispatched -> ${action}`,
      };

      await api.processNewEmail(newEmailRecord);
      
      // Update local state
      setEmails((prev) => [newEmailRecord, ...prev]);
      setSelectedEmail(newEmailRecord);
      
      // Update stats
      setStats((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          total_processed: prev.total_processed + 1,
          auto_replies: route === 'auto_reply' ? prev.auto_replies + 1 : prev.auto_replies,
          hr_reviews: route === 'human_review' ? prev.hr_reviews + 1 : prev.hr_reviews,
          irrelevant: emailInput.intent_type === 'irrelevant' ? prev.irrelevant + 1 : prev.irrelevant,
        };
      });

      addToast(`Email ${newId} processed: Routed to ${route.replace('_', ' ').toUpperCase()}`, 'success');
      return newEmailRecord;
    } catch (err) {
      console.error('Error processing email:', err);
      addToast('Failed to process incoming email', 'error');
      throw err;
    }
  };

  const [isIngesting, setIsIngesting] = useState(false);

  // Trigger end-to-end backend ingestion pipeline
  const handleRunIngestion = async () => {
    setIsIngesting(true);
    try {
      addToast('Ingesting emails and running Gemini AI pipeline...', 'info');
      const res = await api.runIngestion();
      if (res && res.processed > 0) {
        addToast(
          `Pipeline complete: ${res.processed} email(s) processed (${res.auto_replies} auto-replies, ${res.clarifications} clarifications, ${res.hr_reviews} HR reviews)`,
          'success',
          6000
        );
      } else {
        addToast(res.message || 'No new unread emails found in inbox.', 'info');
      }
      // Automatically refresh Dashboard, Emails, Logs, and Stats from backend
      await loadInitialData(false);
      return res;
    } catch (err) {
      console.error('Ingestion error:', err);
      addToast(err.message || 'Failed to run inbox ingestion', 'error');
      throw err;
    } finally {
      setIsIngesting(false);
    }
  };

  // Switch execution mode (dry_run vs live)
  const handleUpdateExecutionMode = async (mode) => {
    try {
      const res = await api.updateExecutionMode(mode);
      setStatus((prev) => ({
        ...prev,
        executionMode: res.executionMode,
      }));
      setSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          automation: {
            ...prev.automation,
            executionMode: res.executionMode,
          }
        };
      });
      addToast(res.message || `Switched to ${res.executionMode.toUpperCase()} mode`, 'success');
      return res;
    } catch (err) {
      console.error('Failed to change execution mode:', err);
      addToast(err.message || 'Failed to update execution mode', 'error');
      throw err;
    }
  };

  // Select an email by ID with live backend verification
  const selectEmailById = async (id) => {
    const cached = emails.find((e) => e.id === id);
    if (cached) {
      setSelectedEmail(cached);
    }
    try {
      const fresh = await api.getEmailById(id);
      setSelectedEmail(fresh);
    } catch (e) {
      console.warn(`Could not refresh email ${id} from API:`, e);
    }
  };

  // Update Settings
  const handleUpdateSettings = async (newSettingsPartial) => {
    try {
      const updated = await api.updateSettings(newSettingsPartial);
      setSettings(updated);
      setStatus((prev) => ({
        ...prev,
        executionMode: updated.automation.executionMode,
      }));
      addToast('Settings updated successfully', 'success');
    } catch (err) {
      console.error('Failed to update settings:', err);
      addToast('Failed to save settings', 'error');
    }
  };

  const openFullEmailModal = (email) => {
    setFullEmailData(email);
    setIsFullEmailModalOpen(true);
  };

  return (
    <AppContext.Provider
      value={{
        activePage,
        setActivePage,
        emails,
        selectedEmail,
        setSelectedEmail,
        selectEmailById,
        stats,
        logs,
        settings,
        status,
        isLoading,
        isIngesting,
        searchQuery,
        setSearchQuery,
        filterIntent,
        setFilterIntent,
        filterStatus,
        setFilterStatus,
        filterConfidence,
        setFilterConfidence,
        isTestModalOpen,
        setIsTestModalOpen,
        isFullEmailModalOpen,
        setIsFullEmailModalOpen,
        fullEmailData,
        openFullEmailModal,
        confirmModalConfig,
        setConfirmModalConfig,
        toasts,
        addToast,
        removeToast,
        refreshData: () => loadInitialData(true),
        runIngestion: handleRunIngestion,
        updateExecutionMode: handleUpdateExecutionMode,
        processEmail: handleProcessEmail,
        updateSettings: handleUpdateSettings,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
