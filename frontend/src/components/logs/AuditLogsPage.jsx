import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IntentBadge, RouteBadge, ActionBadge } from '../common/Badge';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { 
  ScrollText, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Check, 
  FileCode, 
  X,
  ExternalLink,
  Download
} from 'lucide-react';

export function AuditLogsPage() {
  const { logs, addToast } = useApp();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'success' | 'failed' | 'auto_reply' | 'human_review' | 'clarification'
  const [inspectedLog, setInspectedLog] = useState(null);
  const [copied, setCopied] = useState(false);

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSender = log.sender.toLowerCase().includes(q);
      const matchId = log.email_id.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      if (!matchSender && !matchId && !matchAction) return false;
    }

    if (filterType === 'success' && log.status !== 'Success') return false;
    if (filterType === 'failed' && log.status !== 'Failed') return false;
    if (filterType === 'auto_reply' && log.route !== 'auto_reply') return false;
    if (filterType === 'human_review' && log.route !== 'human_review') return false;
    if (filterType === 'clarification' && log.route !== 'clarification') return false;

    return true;
  });

  const handleCopyJson = (record) => {
    navigator.clipboard.writeText(JSON.stringify(record, null, 2));
    setCopied(true);
    addToast('Audit log JSON copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportLogs = () => {
    const jsonlData = filteredLogs
      .map((l) => JSON.stringify(l))
      .join('\n');
    const blob = new Blob([jsonlData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().substring(0, 10)}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Exported audit.jsonl successfully', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <ScrollText className="w-5 h-5 text-indigo-400" />
            <span>System Audit &amp; Processing Logs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable structured audit trail written to <span className="font-mono text-slate-300">logs/audit.jsonl</span>
          </p>
        </div>

        <button
          onClick={handleExportLogs}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-indigo-400" />
          <span>Export audit.jsonl</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by email, ID, or action..."
            className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs placeholder:text-slate-500"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 text-xs font-medium">
          {[
            { id: 'all', label: 'All Logs' },
            { id: 'success', label: 'Success' },
            { id: 'auto_reply', label: 'Auto Reply' },
            { id: 'human_review', label: 'HR Review' },
            { id: 'clarification', label: 'Clarification' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all ${
                filterType === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4 min-w-[140px]">Timestamp</th>
                <th className="py-3 px-4">Email ID</th>
                <th className="py-3 px-4 min-w-[180px]">Sender</th>
                <th className="py-3 px-4">Intent</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                    No log records match your filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log, index) => (
                  <tr
                    key={index}
                    onClick={() => setInspectedLog(log)}
                    className="hover:bg-slate-900/60 cursor-pointer transition-colors group text-slate-300"
                  >
                    {/* Timestamp */}
                    <td className="py-3 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* Email ID */}
                    <td className="py-3 px-4 font-bold text-indigo-400 whitespace-nowrap">
                      {log.email_id}
                    </td>

                    {/* Sender */}
                    <td className="py-3 px-4 font-sans text-slate-200 truncate max-w-[180px]">
                      {log.sender}
                    </td>

                    {/* Intent */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <IntentBadge intent={log.intent} size="sm" />
                    </td>

                    {/* Confidence */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <ConfidenceMeter value={log.confidence} size="badge" />
                    </td>

                    {/* Route */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <RouteBadge route={log.route} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      <ActionBadge action={log.action} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 font-sans whitespace-nowrap">
                      {log.status === 'Success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Success</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-semibold text-xs">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Failed</span>
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInspectedLog(log);
                        }}
                        className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
                        title="View raw audit JSON"
                      >
                        <FileCode className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Audit JSON Drawer / Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 animate-fade-in">
          <div className="w-full max-w-2xl bg-[#0c111e] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <FileCode className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100 font-mono">
                  Audit Transaction Record: {inspectedLog.email_id}
                </h3>
              </div>
              <button
                onClick={() => setInspectedLog(null)}
                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Structured JSON (logs/audit.jsonl entry)</span>
                <button
                  onClick={() => handleCopyJson(inspectedLog)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-xs"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-cyan-300 overflow-x-auto max-h-96 leading-relaxed">
                <pre>{JSON.stringify(inspectedLog, null, 2)}</pre>
              </div>
            </div>

            <div className="flex items-center justify-end pt-2">
              <button
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
