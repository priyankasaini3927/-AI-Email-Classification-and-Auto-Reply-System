import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { IntentBadge, RouteBadge, ActionBadge } from '../common/Badge';
import { ConfidenceMeter } from '../common/ConfidenceMeter';
import { EmailDetailPanel } from '../dashboard/EmailDetailPanel';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  Mail, 
  Sparkles, 
  Paperclip, 
  SlidersHorizontal,
  RefreshCw,
  Eye
} from 'lucide-react';

export function EmailsPage() {
  const { id } = useParams();
  const { 
    emails, 
    selectedEmail, 
    setSelectedEmail, 
    selectEmailById,
    refreshData, 
    isLoading, 
    setIsTestModalOpen 
  } = useApp();

  useEffect(() => {
    if (id) {
      if (selectEmailById) {
        selectEmailById(id);
      }
    }
  }, [id, selectEmailById]);

  const [search, setSearch] = useState('');
  const [intentFilter, setIntentFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest' | 'highest_conf' | 'lowest_conf'
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filter emails
  const filtered = emails.filter((email) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchSender = email.sender.toLowerCase().includes(q) || (email.sender_name && email.sender_name.toLowerCase().includes(q));
      const matchSubject = email.subject.toLowerCase().includes(q);
      const matchBody = email.body.toLowerCase().includes(q);
      const matchId = email.id.toLowerCase().includes(q);
      if (!matchSender && !matchSubject && !matchBody && !matchId) return false;
    }

    if (intentFilter !== 'all' && email.intent_type !== intentFilter) return false;
    if (statusFilter !== 'all' && email.route !== statusFilter) return false;

    if (confidenceFilter === 'high' && email.confidence < 0.75) return false;
    if (confidenceFilter === 'medium' && (email.confidence < 0.45 || email.confidence >= 0.75)) return false;
    if (confidenceFilter === 'low' && email.confidence >= 0.45) return false;

    return true;
  });

  // Sort emails
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.timestamp) - new Date(a.timestamp);
    if (sortBy === 'oldest') return new Date(a.timestamp) - new Date(b.timestamp);
    if (sortBy === 'highest_conf') return b.confidence - a.confidence;
    if (sortBy === 'lowest_conf') return a.confidence - b.confidence;
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(sorted.length / itemsPerPage) || 1;
  const paginatedEmails = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-100 tracking-tight flex items-center gap-2">
            <Mail className="w-5 h-5 text-indigo-400" />
            <span>Processed Email Repository</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of ingested recruitment messages, classifications, and routing audits
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTestModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-900/30 transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ingest Test Email</span>
          </button>
          <button
            onClick={() => refreshData()}
            disabled={isLoading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Content Layout with Table and Inspection Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Table Column */}
        <div className="lg:col-span-8 space-y-4">
          {/* Controls & Filter Bar */}
          <div className="p-4 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search across all messages, sender names, content, or ID..."
                className="w-full glass-input pl-10 pr-4 py-2 rounded-xl text-xs placeholder:text-slate-500"
              />
            </div>

            {/* Filter Pickers */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <select
                value={intentFilter}
                onChange={(e) => {
                  setIntentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Intents</option>
                <option value="job_application" className="bg-slate-900">Job Application</option>
                <option value="interview_request" className="bg-slate-900">Interview Request</option>
                <option value="clarification" className="bg-slate-900">Clarification</option>
                <option value="irrelevant" className="bg-slate-900">Irrelevant / Spam</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Routes</option>
                <option value="auto_reply" className="bg-slate-900">Auto Reply (≥ 0.75)</option>
                <option value="clarification" className="bg-slate-900">Clarification (0.45-0.74)</option>
                <option value="human_review" className="bg-slate-900">HR Review (&lt; 0.45)</option>
              </select>

              <select
                value={confidenceFilter}
                onChange={(e) => {
                  setConfidenceFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Confidence</option>
                <option value="high" className="bg-slate-900">High Score (≥ 0.75)</option>
                <option value="medium" className="bg-slate-900">Medium Score (0.45-0.74)</option>
                <option value="low" className="bg-slate-900">Low Score (&lt; 0.45)</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="glass-input px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer"
              >
                <option value="newest" className="bg-slate-900">Sort: Newest First</option>
                <option value="oldest" className="bg-slate-900">Sort: Oldest First</option>
                <option value="highest_conf" className="bg-slate-900">Sort: Highest Score</option>
                <option value="lowest_conf" className="bg-slate-900">Sort: Lowest Score</option>
              </select>
            </div>
          </div>

          {/* Emails Table */}
          <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800/80 bg-slate-950/50 text-slate-400 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Sender</th>
                    <th className="py-3 px-4">Subject</th>
                    <th className="py-3 px-4">Intent</th>
                    <th className="py-3 px-4">Confidence</th>
                    <th className="py-3 px-4">Route</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4 text-right">View</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {paginatedEmails.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No emails matched your criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedEmails.map((email) => {
                      const isSelected = selectedEmail?.id === email.id;
                      return (
                        <tr
                          key={email.id}
                          onClick={() => selectEmailById ? selectEmailById(email.id) : setSelectedEmail(email)}
                          className={`cursor-pointer transition-all duration-150 ${
                            isSelected
                              ? 'bg-indigo-950/40 border-l-4 border-l-indigo-500 text-slate-100'
                              : 'hover:bg-slate-900/60 text-slate-300'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                            {email.id}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col">
                              <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                                {email.sender_name || email.sender.split('@')[0]}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono truncate max-w-[150px]">
                                {email.sender}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 max-w-[200px] truncate font-medium text-slate-200">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="truncate">{email.subject}</span>
                              {email.attachment && <Paperclip className="w-3 h-3 text-indigo-400 flex-shrink-0" />}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <IntentBadge intent={email.intent_type} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <ConfidenceMeter value={email.confidence} size="badge" />
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <RouteBadge route={email.route} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <ActionBadge action={email.action} size="sm" />
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button className="p-1 text-slate-400 hover:text-indigo-300 transition-colors">
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
              <span>
                Showing {Math.min((currentPage - 1) * itemsPerPage + 1, sorted.length)} -{' '}
                {Math.min(currentPage * itemsPerPage, sorted.length)} of {sorted.length} entries
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono text-slate-300 font-semibold px-2">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-40"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Inspection Column */}
        <div className="lg:col-span-4 sticky top-24">
          <EmailDetailPanel email={selectedEmail} onClose={() => setSelectedEmail(null)} />
        </div>
      </div>
    </div>
  );
}
