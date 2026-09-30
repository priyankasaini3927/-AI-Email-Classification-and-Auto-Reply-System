import React from 'react';
import { formatIntent, formatRoute, formatAction } from '../../services/scoringEngine';
import { 
  FileText, 
  Calendar, 
  HelpCircle, 
  AlertTriangle, 
  Send, 
  UserCheck, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Sparkles 
} from 'lucide-react';

export function IntentBadge({ intent, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';
  
  switch (intent) {
    case 'job_application':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-indigo-950/70 border border-indigo-500/30 text-indigo-300 ${sizeClasses}`}>
          <FileText className="w-3.5 h-3.5 text-indigo-400" />
          <span>Job Application</span>
        </span>
      );
    case 'interview_request':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-cyan-950/70 border border-cyan-500/30 text-cyan-300 ${sizeClasses}`}>
          <Calendar className="w-3.5 h-3.5 text-cyan-400" />
          <span>Interview Request</span>
        </span>
      );
    case 'clarification':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-950/70 border border-amber-500/30 text-amber-300 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Clarification</span>
        </span>
      );
    case 'irrelevant':
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-950/70 border border-rose-500/30 text-rose-300 ${sizeClasses}`}>
          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
          <span>Irrelevant / Spam</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${sizeClasses}`}>
          <span>{formatIntent(intent)}</span>
        </span>
      );
  }
}

export function RouteBadge({ route, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (route) {
    case 'auto_reply':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 shadow-sm ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Auto Reply</span>
        </span>
      );
    case 'clarification':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-amber-950/60 border border-amber-500/30 text-amber-300 shadow-sm ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
          <span>Clarification</span>
        </span>
      );
    case 'human_review':
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-rose-950/60 border border-rose-500/30 text-rose-300 shadow-sm ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          <span>HR Review</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 font-semibold rounded-full bg-slate-800 border border-slate-700 text-slate-300 ${sizeClasses}`}>
          <span>{formatRoute(route)}</span>
        </span>
      );
  }
}

export function ActionBadge({ action, size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  switch (action) {
    case 'send_acknowledgement':
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-300 ${sizeClasses}`}>
          <Send className="w-3.5 h-3.5 text-emerald-400" />
          <span>Send Acknowledgement</span>
        </span>
      );
    case 'send_interview_info':
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-300 ${sizeClasses}`}>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Send Interview Info</span>
        </span>
      );
    case 'request_clarification':
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-300 ${sizeClasses}`}>
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Request Information</span>
        </span>
      );
    case 'forward_to_hr':
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-300 ${sizeClasses}`}>
          <UserCheck className="w-3.5 h-3.5 text-rose-400" />
          <span>Forward to HR</span>
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 text-slate-300 ${sizeClasses}`}>
          <span>{formatAction(action)}</span>
        </span>
      );
  }
}

export function ClarityBadge({ clarity }) {
  switch (clarity) {
    case 'high':
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          High
        </span>
      );
    case 'medium':
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          Medium
        </span>
      );
    case 'low':
      return (
        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          Low
        </span>
      );
    default:
      return <span className="text-xs text-slate-400">{clarity}</span>;
  }
}
