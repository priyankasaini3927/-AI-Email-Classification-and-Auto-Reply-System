import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Inbox, 
  Send, 
  UserCheck, 
  ShieldAlert, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

export function MetricCards() {
  const { stats, emails } = useApp();

  const total = stats?.total_processed ?? emails.length;
  const autoReplies = stats?.auto_replies ?? emails.filter(e => e.route === 'auto_reply').length;
  const hrReviews = stats?.hr_reviews ?? emails.filter(e => e.route === 'human_review').length;
  const irrelevant = stats?.irrelevant ?? emails.filter(e => e.intent_type === 'irrelevant').length;

  const autoReplyPercent = total > 0 ? Math.round((autoReplies / total) * 100) : 0;
  const hrReviewPercent = total > 0 ? Math.round((hrReviews / total) * 100) : 0;

  const cards = [
    {
      id: 'total',
      title: 'Total Emails Processed',
      value: total,
      subtext: stats?.trends?.total || (total > 0 ? `${total} total records` : 'No data available'),
      trendIcon: TrendingUp,
      accentBorder: 'hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
      icon: Inbox,
      badge: 'All Pipeline',
      badgeClass: 'bg-indigo-950/60 text-indigo-300 border-indigo-500/20',
    },
    {
      id: 'auto_reply',
      title: 'Auto Replies',
      value: autoReplies,
      subtext: stats?.trends?.auto_replies || `${autoReplyPercent}% automation rate`,
      trendIcon: CheckCircle2,
      accentBorder: 'hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
      icon: Send,
      badge: 'Resolved',
      badgeClass: 'bg-emerald-950/60 text-emerald-300 border-emerald-500/20',
    },
    {
      id: 'hr_review',
      title: 'HR Review Required',
      value: hrReviews,
      subtext: stats?.trends?.hr_reviews || `${hrReviewPercent}% human escalation`,
      trendIcon: AlertTriangle,
      accentBorder: 'hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
      icon: UserCheck,
      badge: 'Pending Review',
      badgeClass: 'bg-amber-950/60 text-amber-300 border-amber-500/20',
    },
    {
      id: 'irrelevant',
      title: 'Irrelevant / Spam',
      value: irrelevant,
      subtext: stats?.trends?.irrelevant || 'Filtered & archived safely',
      trendIcon: ShieldAlert,
      accentBorder: 'hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
      icon: ShieldAlert,
      badge: 'Spam Filtered',
      badgeClass: 'bg-rose-950/60 text-rose-300 border-rose-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const TrendIcon = card.trendIcon;

        return (
          <div
            key={card.id}
            className={`relative p-5 rounded-2xl bg-[#0d1322] border border-slate-800 shadow-lg transition-all duration-200 ${card.accentBorder} group`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {card.title}
              </span>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.iconBg} transition-transform group-hover:scale-110`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div className="mt-4 flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-100 font-mono tracking-tight">
                {card.value}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${card.badgeClass}`}>
                {card.badge}
              </span>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
              <TrendIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-400">{card.subtext}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
