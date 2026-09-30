import React from 'react';
import { useApp } from '../../context/AppContext';
import { MetricCards } from './MetricCards';
import { RecentEmailsTable } from './RecentEmailsTable';
import { EmailDetailPanel } from './EmailDetailPanel';
import { IntentDonutChart } from './IntentDonutChart';
import { RecentActivityFeed } from './RecentActivityFeed';
import { Sparkles, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

export function DashboardPage() {
  const { selectedEmail, setSelectedEmail, setIsTestModalOpen } = useApp();

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Top 4 Metrics Cards */}
      <MetricCards />

      {/* Main Email Table & Detail Panel Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left / Center Table (7 cols on XL/LG, full on tablet/mobile) */}
        <div className="lg:col-span-7 xl:col-span-8">
          <RecentEmailsTable limit={6} />
        </div>

        {/* Right Detail Panel (5 cols on XL/LG) */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-24">
          <EmailDetailPanel
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
          />
        </div>
      </div>

      {/* Bottom Analytics & Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Email Intent Distribution Donut */}
        <div className="lg:col-span-6">
          <IntentDonutChart />
        </div>

        {/* Right: Chronological Recent Activity Feed */}
        <div className="lg:col-span-6">
          <RecentActivityFeed />
        </div>
      </div>
    </div>
  );
}
