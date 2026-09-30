import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import api from '../../services/api';
import { 
  Settings as SettingsIcon, 
  Mail, 
  Bot, 
  Sliders, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle,
  Lock, 
  Sparkles, 
  RefreshCw,
  Info,
  Key,
  Send
} from 'lucide-react';

export function SettingsPage() {
  const { settings, status, updateSettings, updateExecutionMode, setConfirmModalConfig, addToast } = useApp();

  const [testingGmail, setTestingGmail] = useState(false);
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [testingGemini, setTestingGemini] = useState(false);

  const [gmailResult, setGmailResult] = useState(null);
  const [smtpResult, setSmtpResult] = useState(null);
  const [geminiResult, setGeminiResult] = useState(null);

  const [autoThreshold, setAutoThreshold] = useState(
    settings?.automation?.autoReplyThreshold || 0.75
  );
  const [clarificationThreshold, setClarificationThreshold] = useState(
    settings?.automation?.clarificationThreshold || 0.45
  );

  const executionMode = status?.executionMode || settings?.automation?.executionMode || 'dry_run';
  const isDryRun = executionMode === 'dry_run';

  const handleToggleExecutionMode = (targetMode) => {
    if (targetMode === executionMode) return;

    if (targetMode === 'live') {
      // Require explicit modal confirmation
      setConfirmModalConfig({
        title: 'Activate Live Automation Mode?',
        message: 'Live mode can send automated emails to real recipients. Are you sure you want to continue?',
        confirmText: 'Activate Live Mode',
        type: 'warning',
        onConfirm: async () => {
          await updateExecutionMode('live');
        }
      });
    } else {
      updateExecutionMode('dry_run');
    }
  };

  const handleTestGmail = async () => {
    setTestingGmail(true);
    setGmailResult(null);
    try {
      const res = await api.testGmail();
      setGmailResult(res);
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err) {
      setGmailResult({ success: false, message: err.message || 'Connection test failed' });
      addToast(err.message || 'Gmail test failed', 'error');
    } finally {
      setTestingGmail(false);
    }
  };

  const handleTestSmtp = async () => {
    setTestingSmtp(true);
    setSmtpResult(null);
    try {
      const res = await api.testSMTP();
      setSmtpResult(res);
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err) {
      setSmtpResult({ success: false, message: err.message || 'Connection test failed' });
      addToast(err.message || 'SMTP test failed', 'error');
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiResult(null);
    try {
      const res = await api.testGemini();
      setGeminiResult(res);
      if (res.success) {
        addToast(res.message, 'success');
      } else {
        addToast(res.message, 'error');
      }
    } catch (err) {
      setGeminiResult({ success: false, message: err.message || 'Gemini test failed' });
      addToast(err.message || 'Gemini connection failed', 'error');
    } finally {
      setTestingGemini(false);
    }
  };

  const handleSaveThresholds = () => {
    updateSettings({
      automation: {
        ...settings?.automation,
        autoReplyThreshold: autoThreshold,
        clarificationThreshold: clarificationThreshold,
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-indigo-400" />
          <span>System Settings &amp; Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure mail ingestion, Gemini AI model parameters, and deterministic routing thresholds
        </p>
      </div>

      {/* Security Note Alert */}
      <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-start gap-3 text-xs text-indigo-200">
        <ShieldCheck className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-100">Enterprise Security Compliant</p>
          <p className="text-slate-400 leading-relaxed">
            All Gmail application passwords, SMTP credentials, and Gemini API keys are loaded strictly from server-side environment variables and are masked across the interface.
          </p>
        </div>
      </div>

      {/* Top 2 Columns: Mail Connection & AI Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: Email Server Connection */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-100">1. Email Ingestion &amp; Dispatch</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              status?.imapConnected
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                : 'bg-rose-950 text-rose-300 border-rose-500/30'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status?.imapConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
              <span>{status?.imapConnected ? 'Connected' : 'Disconnected'}</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Target Ingestion Account</label>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800">
                <span className="font-mono text-slate-200">
                  {settings?.emailConnection?.gmailAccount || 'Configured via .env'}
                </span>
                <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Configured
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">IMAP Protocol (Ingestion)</label>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <p className="font-mono text-slate-200">{settings?.emailConnection?.imapServer || 'imap.gmail.com'}</p>
                  <p className="text-[10px] text-slate-400">Port {settings?.emailConnection?.imapPort || 993} • SSL</p>
                  <p className={`text-[10px] font-semibold ${status?.imapConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {status?.imapConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">SMTP Protocol (Dispatch)</label>
                <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-0.5">
                  <p className="font-mono text-slate-200">{settings?.emailConnection?.smtpServer || 'smtp.gmail.com'}</p>
                  <p className="text-[10px] text-slate-400">Port {settings?.emailConnection?.smtpPort || 587} • STARTTLS</p>
                  <p className={`text-[10px] font-semibold ${status?.smtpConnected ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {status?.smtpConnected ? 'Connected' : 'Disconnected'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">Credentials Status</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
                <div className="flex items-center gap-2 text-slate-300">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">GMAIL_APP_PASSWORD: ••••••••••••••••</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Masked (.env)</span>
              </div>
            </div>
          </div>

          {/* Test Buttons for Gmail and SMTP */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              onClick={handleTestGmail}
              disabled={testingGmail}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingGmail ? 'animate-spin text-indigo-400' : ''}`} />
              <span>{testingGmail ? 'Testing...' : 'Test Gmail'}</span>
            </button>

            <button
              onClick={handleTestSmtp}
              disabled={testingSmtp}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Send className={`w-3.5 h-3.5 ${testingSmtp ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{testingSmtp ? 'Testing...' : 'Test SMTP'}</span>
            </button>
          </div>

          {/* Test feedback */}
          {gmailResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              gmailResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {gmailResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{gmailResult.message}</span>
            </div>
          )}

          {smtpResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              smtpResult.success ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {smtpResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{smtpResult.message}</span>
            </div>
          )}
        </div>

        {/* SECTION 2: AI Configuration */}
        <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2.5">
              <Bot className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-slate-100">2. AI Model Configuration</h3>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
              status?.aiModelAvailable
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                : 'bg-rose-950 text-rose-300 border-rose-500/30'
            }`}>
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{status?.aiModelAvailable ? 'Operational' : 'Unavailable'}</span>
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1">Active LLM Classifier</label>
              <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-100 font-mono">
                    {status?.activeModel || settings?.aiConfiguration?.modelName || 'gemini-2.5-flash-lite'}
                  </p>
                  <p className="text-[11px] text-slate-400">Google Gemini Developer API</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 text-[10px] font-mono border border-indigo-500/20">
                  Temperature: 0.0
                </span>
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">API Key Integration</label>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/90">
                <div className="flex items-center gap-2 text-slate-300">
                  <Key className="w-4 h-4 text-indigo-400" />
                  <span className="font-mono">GEMINI_API_KEY: ••••••••••••••••</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-semibold">Configured</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1 text-slate-400 leading-relaxed text-[11px]">
              <p className="font-semibold text-slate-200">Qualitative-Only Constraint:</p>
              <p>
                The LLM prompt is strictly forbidden from estimating arbitrary numeric scores. It only outputs validated JSON schema (<span className="font-mono text-cyan-300">intent_type</span>, <span className="font-mono text-cyan-300">clarity_level</span>, <span className="font-mono text-cyan-300">missing_information</span>, <span className="font-mono text-cyan-300">needs_human_review</span>, <span className="font-mono text-cyan-300">reason</span>).
              </p>
            </div>
          </div>

          {/* Test Gemini Button */}
          <button
            onClick={handleTestGemini}
            disabled={testingGemini}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-200 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${testingGemini ? 'animate-spin' : ''}`} />
            <span>{testingGemini ? 'Testing AI connection...' : 'Test Gemini'}</span>
          </button>

          {/* Gemini Test Feedback */}
          {geminiResult && (
            <div className={`p-2.5 rounded-xl text-xs flex items-start gap-2 border ${
              geminiResult.success ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300' : 'bg-rose-950/40 border-rose-500/30 text-rose-300'
            }`}>
              {geminiResult.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-cyan-400" /> : <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />}
              <span>{geminiResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: Automation & Threshold Settings */}
      <div className="p-6 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-100">3. Automation Mode &amp; Routing Thresholds</h3>
          </div>
        </div>

        {/* Execution Mode Selector */}
        <div className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            System Execution Mode
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Dry Run Card */}
            <div
              onClick={() => handleToggleExecutionMode('dry_run')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isDryRun
                  ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  <span>Dry Run Mode</span>
                </span>
                {isDryRun && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-indigo-300 font-medium">
                Dry Run — Safe Mode
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Generates full classifications, confidence scores, and mock logs without sending live emails.
              </p>
            </div>

            {/* Live Mode Card */}
            <div
              onClick={() => handleToggleExecutionMode('live')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                !isDryRun
                  ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-900/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-slate-100 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-emerald-400" />
                  <span>Live Execution Mode</span>
                </span>
                {!isDryRun && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-300 font-medium">
                Live — Automated responses may be sent.
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Dispatches templated acknowledgements &amp; interview schedules via Gmail SMTP. Requires user confirmation.
              </p>
            </div>
          </div>
        </div>

        {/* Threshold Controls */}
        <div className="pt-2 border-t border-slate-800/80 space-y-4">
          <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Deterministic Routing Cutoffs
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Auto Reply Cutoff */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-emerald-400">AUTO_REPLY Threshold</span>
                <span className="font-mono text-sm font-bold text-slate-100">{autoThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.50"
                max="0.95"
                step="0.05"
                value={autoThreshold}
                onChange={(e) => setAutoThreshold(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Scores ≥ {autoThreshold.toFixed(2)} automatically trigger acknowledgement or interview dispatch.
              </p>
            </div>

            {/* Clarification Cutoff */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-amber-400">CLARIFICATION Threshold</span>
                <span className="font-mono text-sm font-bold text-slate-100">{clarificationThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.20"
                max="0.70"
                step="0.05"
                value={clarificationThreshold}
                onChange={(e) => setClarificationThreshold(parseFloat(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <p className="text-[11px] text-slate-400">
                Scores between {clarificationThreshold.toFixed(2)} and {(autoThreshold - 0.01).toFixed(2)} trigger clarification queries. Scores &lt; {clarificationThreshold.toFixed(2)} escalate to HR.
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveThresholds}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer"
            >
              Save Threshold Configuration
            </button>
          </div>
        </div>

        {/* Deterministic Scoring Matrix Reference Card */}
        <div className="pt-4 border-t border-slate-800/80">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Deterministic Mathematical Scoring Matrix
            </h4>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60 text-xs font-mono">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/50 text-slate-400 text-[11px]">
                  <th className="py-2 px-3">Factor</th>
                  <th className="py-2 px-3">Condition</th>
                  <th className="py-2 px-3 text-right">Adjustment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Base</td>
                  <td className="py-2 px-3">Starting Value</td>
                  <td className="py-2 px-3 text-right text-slate-400">0.00</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Intent</td>
                  <td className="py-2 px-3">job_application / interview_request</td>
                  <td className="py-2 px-3 text-right text-emerald-400">+0.40</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Clarity</td>
                  <td className="py-2 px-3">high (+0.30) / medium (+0.15)</td>
                  <td className="py-2 px-3 text-right text-emerald-400">+0.30 / +0.15</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Completeness</td>
                  <td className="py-2 px-3">missing_information = false (+0.10) / true (-0.20)</td>
                  <td className="py-2 px-3 text-right text-indigo-300">+0.10 / -0.20</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Escalation</td>
                  <td className="py-2 px-3">needs_human_review = false (+0.10) / true (-0.30)</td>
                  <td className="py-2 px-3 text-right text-rose-400">+0.10 / -0.30</td>
                </tr>
                <tr>
                  <td className="py-2 px-3 font-semibold text-slate-200">Clamping</td>
                  <td className="py-2 px-3">Max(0.00, Min(1.00, score))</td>
                  <td className="py-2 px-3 text-right text-cyan-400">[0.00, 1.00]</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
