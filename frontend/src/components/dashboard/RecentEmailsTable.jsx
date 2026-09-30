import React from 'react';
import { useApp } from '../../context/AppContext';
import { IntentBadge, RouteBadge, ActionBadge } from '../common/Badge';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { 
  Search, 
  Filter, 
  RefreshCw, 
  Paperclip, 
  ChevronRight, 
  ArrowUpDown, 
  SlidersHorizontal,
  Mail
} from 'lucide-react';

export function RecentEmailsTable({ limit = 6 }) {
  const { 
    emails, 
    selectedEmail, 
    setSelectedEmail, 
    selectEmailById,
    searchQuery, 
    setSearchQuery,
    filterIntent, 
    setFilterIntent,
    filterStatus, 
    setFilterStatus,
    filterConfidence,
    setFilterConfidence,
    refreshData,
    isLoading
  } = useApp();

  // Filter & Search Logic
  const filteredEmails = emails.filter((email) => {
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSender = email.sender.toLowerCase().includes(q) || (email.sender_name && email.sender_name.toLowerCase().includes(q));
      const matchSubject = email.subject.toLowerCase().includes(q);
      const matchId = email.id.toLowerCase().includes(q);
      if (!matchSender && !matchSubject && !matchId) return false;
    }

    // Intent filter
    if (filterIntent !== 'all' && email.intent_type !== filterIntent) {
      return false;
    }

    // Status / Route filter
    if (filterStatus !== 'all' && email.route !== filterStatus) {
      return false;
    }

    // Confidence filter
    if (filterConfidence === 'high' && email.confidence < 0.75) return false;
    if (filterConfidence === 'medium' && (email.confidence < 0.45 || email.confidence >= 0.75)) return false;
    if (filterConfidence === 'low' && email.confidence >= 0.45) return false;

    return true;
  });

  const displayList = limit ? filteredEmails.slice(0, limit) : filteredEmails;

  return (
    <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden flex flex-col">
      {/* Table Header & Action Controls */}
      <div className="p-5 border-b border-slate-800/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-base font-bold text-slate-100 tracking-tight">Recent Emails</h2>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-slate-800 text-slate-400 border border-slate-700">
                {filteredEmails.length} messages
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live automated triage and decision routing feed
            </p>
          </div>

          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-semibold text-slate-300 hover:text-white transition-all self-start sm:self-auto"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Filter Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          {/* Search Input */}
          <div className="relative sm:col-span-2 lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by sender, subject, or ID..."
              className="w-full glass-input pl-9 pr-3 py-1.5 rounded-xl text-xs placeholder:text-slate-500"
            />
          </div>

          {/* Status Filter */}
          <div className="lg:col-span-3">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Statuses / Routes</option>
              <option value="auto_reply" className="bg-slate-900">Auto Reply (≥ 0.75)</option>
              <option value="clarification" className="bg-slate-900">Clarification (0.45 - 0.74)</option>
              <option value="human_review" className="bg-slate-900">HR Review (&lt; 0.45)</option>
            </select>
          </div>

          {/* Intent Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterIntent}
              onChange={(e) => setFilterIntent(e.target.value)}
              className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Intents</option>
              <option value="job_application" className="bg-slate-900">Job Application</option>
              <option value="interview_request" className="bg-slate-900">Interview Request</option>
              <option value="clarification" className="bg-slate-900">Clarification</option>
              <option value="irrelevant" className="bg-slate-900">Irrelevant / Spam</option>
            </select>
          </div>

          {/* Confidence Filter */}
          <div className="lg:col-span-2">
            <select
              value={filterConfidence}
              onChange={(e) => setFilterConfidence(e.target.value)}
              className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Confidence</option>
              <option value="high" className="bg-slate-900">High (≥ 0.75)</option>
              <option value="medium" className="bg-slate-900">Medium (0.45-0.74)</option>
              <option value="low" className="bg-slate-900">Low (&lt; 0.45)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table Container */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800/80 bg-slate-950/40 text-slate-400 font-semibold uppercase tracking-wider">
              <th className="py-3 px-4 w-20">ID</th>
              <th className="py-3 px-4 min-w-[180px]">From</th>
              <th className="py-3 px-4 min-w-[220px]">Subject</th>
              <th className="py-3 px-4 min-w-[140px]">Intent</th>
              <th className="py-3 px-4 min-w-[100px]">Confidence</th>
              <th className="py-3 px-4 min-w-[120px]">Status</th>
              <th className="py-3 px-4 min-w-[160px]">Action</th>
              <th className="py-3 px-4 text-right min-w-[90px]">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {displayList.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Mail className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-300">No matching emails found</p>
                    <p className="text-xs text-slate-500">Try adjusting search filters or parameters</p>
                  </div>
                </td>
              </tr>
            ) : (
              displayList.map((email) => {
                const isSelected = selectedEmail?.id === email.id;
                return (
                  <tr
                    key={email.id}
                    onClick={() => selectEmailById(email.id)}
                    className={`cursor-pointer transition-all duration-150 group ${
                      isSelected
                        ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500 text-slate-100'
                        : 'hover:bg-slate-900/60 text-slate-300'
                    }`}
                  >
                    {/* ID */}
                    <td className="py-3.5 px-4 font-mono font-semibold text-indigo-400 text-xs whitespace-nowrap">
                      {email.id}
                    </td>

                    {/* From */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-200 group-hover:text-white truncate max-w-[170px]">
                          {email.sender_name || email.sender.split('@')[0]}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono truncate max-w-[170px]">
                          {email.sender}
                        </span>
                      </div>
                    </td>

                    {/* Subject */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 max-w-[260px]">
                        <span className="font-medium text-slate-200 truncate group-hover:text-indigo-200">
                          {email.subject}
                        </span>
                        {email.attachment && (
                          <span title={`Attachment: ${email.attachment}`}>
                            <Paperclip className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Intent */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <IntentBadge intent={email.intent_type} size="sm" />
                    </td>

                    {/* Confidence */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ConfidenceMeter value={email.confidence} size="sm" showBar={true} />
                    </td>

                    {/* Status / Route */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <RouteBadge route={email.route} size="sm" />
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <ActionBadge action={email.action} size="sm" />
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 text-right text-slate-400 font-medium text-[11px] whitespace-nowrap">
                      {email.time_display || 'Recently'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
