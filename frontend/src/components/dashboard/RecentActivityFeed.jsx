import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Send, 
  UserCheck, 
  HelpCircle, 
  ShieldAlert, 
  Sparkles, 
  ArrowRight, 
  Clock, 
  Activity 
} from 'lucide-react';

export function RecentActivityFeed() {
  const { emails, setSelectedEmail } = useApp();

  // Generate activities dynamically from emails or recent logs
  const activities = emails.slice(0, 5).map((email) => {
    let actionDescription = 'Forwarded to HR';
    let icon = UserCheck;
    let iconColor = 'text-rose-400';
    let iconBg = 'bg-rose-500/10 border-rose-500/20';

    if (email.intent_type === 'job_application' && email.route === 'auto_reply') {
      actionDescription = 'Auto reply prepared (Acknowledgement)';
      icon = Send;
      iconColor = 'text-emerald-400';
      iconBg = 'bg-emerald-500/10 border-emerald-500/20';
    } else if (email.intent_type === 'interview_request' && email.route === 'auto_reply') {
      actionDescription = 'Interview response prepared';
      icon = Sparkles;
      iconColor = 'text-cyan-400';
      iconBg = 'bg-cyan-500/10 border-cyan-500/20';
    } else if (email.intent_type === 'clarification') {
      actionDescription = email.route === 'clarification' ? 'Missing details request prepared' : 'Forwarded to HR';
      icon = HelpCircle;
      iconColor = 'text-amber-400';
      iconBg = 'bg-amber-500/10 border-amber-500/20';
    } else if (email.intent_type === 'irrelevant') {
      actionDescription = 'Marked as Irrelevant → Forwarded to HR';
      icon = ShieldAlert;
      iconColor = 'text-rose-400';
      iconBg = 'bg-rose-500/10 border-rose-500/20';
    }

    return {
      id: email.id,
      emailRef: email,
      title: `Email #${email.id.replace('MSG-', '')} classified as ${email.intent_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      action: actionDescription,
      time: email.time_display || 'Recent',
      confidence: email.confidence,
      icon,
      iconColor,
      iconBg,
    };
  });

  return (
    <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Recent Activity</span>
          </h3>
          <p className="text-xs text-slate-400">Live deterministic execution audit log</p>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
      </div>

      <div className="divide-y divide-slate-800/50 my-2">
        {activities.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs">
            No processed emails yet. Ingest unread Gmail messages to view pipeline activity.
          </div>
        ) : (
          activities.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                onClick={() => setSelectedEmail(item.emailRef)}
                className="py-2.5 flex items-start gap-3 hover:bg-slate-900/50 p-2 rounded-xl transition-all cursor-pointer group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${item.iconBg} ${item.iconColor} flex-shrink-0 mt-0.5`}>
                  <Icon className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 truncate">
                      {item.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 flex-shrink-0">{item.time}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs">
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-300 text-[11px] font-medium truncate">{item.action}</span>
                    <span className="text-[10px] font-mono text-slate-500 ml-auto">(score: {item.confidence.toFixed(2)})</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
