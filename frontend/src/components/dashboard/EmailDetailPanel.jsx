import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IntentBadge, RouteBadge, ActionBadge, ClarityBadge } from '../common/Badge';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { calculateConfidenceDetails } from '../../services/scoringEngine';
import { 
  X, 
  Mail, 
  Paperclip, 
  Sparkles, 
  BrainCircuit, 
  CheckCircle2, 
  AlertTriangle, 
  UserCheck, 
  Send, 
  ExternalLink, 
  ShieldCheck,
  FileText,
  Clock,
  ArrowRight
} from 'lucide-react';

export function EmailDetailPanel({ email, onClose }) {
  const { openFullEmailModal } = useApp();
  const [activeTab, setActiveTab] = useState('original'); // 'original' | 'analysis'

  if (!email) {
    return (
      <div className="h-full min-h-[350px] rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl p-6 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-3">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-300">No Email Selected</h3>
        <p className="text-xs text-slate-500 max-w-[200px] mt-1">
          Click any email row from the table to inspect details and AI triage telemetry.
        </p>
      </div>
    );
  }

  // Calculate deterministic mathematical breakdown for this email
  const mathBreakdown = calculateConfidenceDetails({
    intent_type: email.intent_type,
    clarity_level: email.clarity_level,
    missing_information: email.missing_information,
    needs_human_review: email.needs_human_review,
  });

  return (
    <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden flex flex-col h-full animate-fade-in">
      {/* Detail Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs font-bold text-indigo-400">{email.id}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] text-slate-400">{email.time_display || 'Recent'}</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                {email.processing_status || 'Processed'}
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-100 leading-snug break-words">
              {email.subject}
            </h3>
            <p className="text-xs text-slate-400 truncate mt-1">
              From: <span className="text-slate-200 font-medium">{email.sender_name || email.sender}</span> &lt;{email.sender}&gt;
            </p>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quick Triage Summary Bar */}
        <div className="mt-4 p-3 rounded-xl bg-slate-900/80 border border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Detected Intent</span>
            <IntentBadge intent={email.intent_type} size="sm" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">Routing Decision</span>
            <RouteBadge route={email.route} size="sm" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="px-5 pt-3 border-b border-slate-800/80 flex items-center gap-4">
        <button
          onClick={() => setActiveTab('original')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'original'
              ? 'border-indigo-500 text-indigo-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Original Email</span>
        </button>

        <button
          onClick={() => setActiveTab('analysis')}
          className={`pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'analysis'
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BrainCircuit className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI Analysis</span>
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-5 flex-1 overflow-y-auto space-y-4">
        {activeTab === 'original' ? (
          <div className="space-y-4">
            {/* Email Body Content */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Message Body
              </span>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/90 text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
                {email.body}
              </div>
            </div>

            {/* Attachment Indicator */}
            {email.attachment && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Attached Files
                </span>
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-200 truncate">{email.attachment}</p>
                    <p className="text-[10px] text-indigo-300">Verified HR Attachment</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Action Preview */}
            <div className="space-y-2 pt-2 border-t border-slate-800/80">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Selected Action &amp; Routing
              </span>
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <ActionBadge action={email.action} />
                <span className="text-[11px] text-slate-400 font-mono">
                  {email.route === 'auto_reply' ? 'Auto Dispatched' : 'Escalated'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* AI Exact Schema Fields */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Qualitative Schema
                </span>
                <span className="text-[10px] font-mono text-cyan-400">LLM Structured</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">intent_type</span>
                  <span className="font-semibold text-slate-200 font-mono text-xs">{email.intent_type}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">clarity_level</span>
                  <ClarityBadge clarity={email.clarity_level} />
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">missing_information</span>
                  <span className={`font-mono font-semibold text-xs ${email.missing_information ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {email.missing_information ? 'true' : 'false'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">needs_human_review</span>
                  <span className={`font-mono font-semibold text-xs ${email.needs_human_review ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {email.needs_human_review ? 'true' : 'false'}
                  </span>
                </div>
              </div>

              {/* Reason */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-400 text-[11px] block mb-1">reason</span>
                <p className="text-xs text-slate-300 font-sans italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  "{email.reason}"
                </p>
              </div>
            </div>

            {/* Deterministic Confidence Breakdown */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-indigo-500/20 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-bold text-slate-200">
                  Deterministic Math Calculation
                </span>
                <span className="font-mono text-xs text-indigo-400">Score: {email.confidence}</span>
              </div>

              <div className="space-y-1 text-xs font-mono">
                {mathBreakdown.breakdowns.map((step, idx) => (
                  <div key={idx} className="flex items-center justify-between py-0.5 text-[11px]">
                    <span className="text-slate-400">{step.factor}</span>
                    <span className={step.delta > 0 ? 'text-emerald-400' : step.delta < 0 ? 'text-rose-400' : 'text-slate-500'}>
                      {step.delta > 0 ? `+${step.delta.toFixed(2)}` : step.delta.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <ConfidenceMeter value={email.confidence} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Detail Footer with View Full Email Button */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/60 flex items-center justify-between gap-3">
        <button
          onClick={() => openFullEmailModal(email)}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          <span>View Full Email &amp; Raw JSON</span>
        </button>
      </div>
    </div>
  );
}
