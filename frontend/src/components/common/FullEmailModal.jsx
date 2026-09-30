import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IntentBadge, RouteBadge, ActionBadge, ClarityBadge } from './Badge';
import { ConfidenceMeter } from './ConfidenceMeter';
import { 
  X, 
  Mail, 
  Paperclip, 
  Clock, 
  User, 
  FileText, 
  Copy, 
  Check, 
  BrainCircuit, 
  ShieldCheck, 
  ArrowRight,
  ExternalLink 
} from 'lucide-react';

export function FullEmailModal() {
  const { isFullEmailModalOpen, setIsFullEmailModalOpen, fullEmailData, addToast } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('formatted'); // 'formatted' | 'raw' | 'ai_audit'

  if (!isFullEmailModalOpen || !fullEmailData) return null;

  const handleCopyBody = () => {
    navigator.clipboard.writeText(fullEmailData.body || '');
    setCopied(true);
    addToast('Email body copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 animate-fade-in">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0d1322] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-indigo-400 font-semibold">{fullEmailData.id}</span>
                <span className="text-xs text-slate-500">•</span>
                <span className="text-xs text-slate-400">{fullEmailData.time_display || 'Recent'}</span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 truncate max-w-md sm:max-w-xl">
                {fullEmailData.subject}
              </h2>
            </div>
          </div>
          <button
            onClick={() => setIsFullEmailModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Meta Ribbon */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <IntentBadge intent={fullEmailData.intent_type} size="sm" />
            <RouteBadge route={fullEmailData.route} size="sm" />
            <ConfidenceMeter value={fullEmailData.confidence} size="badge" />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-900/80 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setActiveTab('formatted')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'formatted' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Formatted Email
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'raw' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw Body
              </button>
              <button
                onClick={() => setActiveTab('ai_audit')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'ai_audit' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Audit JSON
              </button>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'formatted' && (
            <div className="space-y-6">
              {/* Sender & Recipient Box */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-300">
                    <span className="text-slate-500 font-medium w-16">From:</span>
                    <span className="font-semibold text-slate-200">{fullEmailData.sender_name || fullEmailData.sender}</span>
                    <span className="text-slate-400 font-mono text-xs">&lt;{fullEmailData.sender}&gt;</span>
                  </div>
                  <span className="text-xs text-slate-500">{new Date(fullEmailData.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500 font-medium w-16">To:</span>
                  <span className="text-slate-300 font-mono text-xs">recruitment@example.com (sainipriyanka3927@gmail.com)</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span className="text-slate-500 font-medium w-16">Subject:</span>
                  <span className="text-slate-200 font-medium">{fullEmailData.subject}</span>
                </div>
              </div>

              {/* Email Content */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-slate-500">Email Message</span>
                  <button
                    onClick={handleCopyBody}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs border border-slate-700 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="p-5 rounded-xl bg-slate-950/60 border border-slate-800/90 text-sm text-slate-200 font-sans whitespace-pre-line leading-relaxed">
                  {fullEmailData.body}
                </div>
              </div>

              {/* Attachment if present */}
              {fullEmailData.attachment && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Verified Attachment</span>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/20 max-w-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-200">{fullEmailData.attachment}</p>
                        <p className="text-[11px] text-indigo-300">Candidate Document • Verified Safe</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Prepared Response Preview */}
              {fullEmailData.response_preview && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    <Check className="w-3.5 h-3.5" />
                    <span>Dispatched System Action / Response Preview</span>
                  </div>
                  <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-200/90 font-mono whitespace-pre-line">
                    {fullEmailData.response_preview}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'raw' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
              {fullEmailData.body}
            </div>
          )}

          {activeTab === 'ai_audit' && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 whitespace-pre-wrap leading-relaxed">
              {JSON.stringify(
                {
                  id: fullEmailData.id,
                  sender: fullEmailData.sender,
                  subject: fullEmailData.subject,
                  classification: {
                    intent_type: fullEmailData.intent_type,
                    clarity_level: fullEmailData.clarity_level,
                    missing_information: fullEmailData.missing_information,
                    needs_human_review: fullEmailData.needs_human_review,
                    reason: fullEmailData.reason,
                  },
                  confidence: fullEmailData.confidence,
                  routing: {
                    route: fullEmailData.route,
                    action: fullEmailData.action,
                    recipient: fullEmailData.route === 'auto_reply' ? fullEmailData.sender : 'hr@example.com',
                  },
                  dispatch_status: fullEmailData.processing_status,
                },
                null,
                2
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <div className="text-xs text-slate-400">
            Action: <span className="text-slate-200 font-medium">{fullEmailData.action}</span>
          </div>
          <button
            onClick={() => setIsFullEmailModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
