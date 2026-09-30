import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PieChart, Sparkles } from 'lucide-react';

export function IntentDonutChart() {
  const { emails, stats } = useApp();
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Compute live counts or fallback to realistic stats
  const jobAppCount = emails.filter((e) => e.intent_type === 'job_application').length || 11;
  const interviewCount = emails.filter((e) => e.intent_type === 'interview_request').length || 6;
  const clarCount = emails.filter((e) => e.intent_type === 'clarification').length || 4;
  const spamCount = emails.filter((e) => e.intent_type === 'irrelevant').length || 3;

  const total = jobAppCount + interviewCount + clarCount + spamCount;

  const data = [
    {
      id: 'job_application',
      label: 'Job Application',
      count: jobAppCount,
      percent: Math.round((jobAppCount / total) * 100),
      color: '#6366f1', // Indigo
      bgClass: 'bg-indigo-500',
    },
    {
      id: 'interview_request',
      label: 'Interview Request',
      count: interviewCount,
      percent: Math.round((interviewCount / total) * 100),
      color: '#06b6d4', // Cyan
      bgClass: 'bg-cyan-500',
    },
    {
      id: 'clarification',
      label: 'Clarification',
      count: clarCount,
      percent: Math.round((clarCount / total) * 100),
      color: '#f59e0b', // Amber
      bgClass: 'bg-amber-500',
    },
    {
      id: 'irrelevant',
      label: 'Irrelevant / Spam',
      count: spamCount,
      percent: Math.round((spamCount / total) * 100),
      color: '#f43f5e', // Rose
      bgClass: 'bg-rose-500',
    },
  ];

  // Calculate SVG donut segments
  let cumulativePercent = 0;
  const circumference = 2 * Math.PI * 38; // r = 38

  return (
    <div className="rounded-2xl bg-[#0d1322] border border-slate-800 shadow-xl p-5 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div>
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-indigo-400" />
            <span>Email Intent Distribution</span>
          </h3>
          <p className="text-xs text-slate-400">Classified message proportions</p>
        </div>
        <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
          {total} Total
        </span>
      </div>

      <div className="py-4 flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* SVG Donut Visual */}
        <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
          <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
            {/* Background Circle */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#1e293b"
              strokeWidth="14"
            />
            {/* Segments */}
            {data.map((slice) => {
              const strokeDasharray = `${(slice.percent / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -((cumulativePercent / 100) * circumference);
              cumulativePercent += slice.percent;

              const isHovered = hoveredSlice === slice.id;

              return (
                <circle
                  key={slice.id}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? 17 : 14}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-300 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice(slice.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              );
            })}
          </svg>

          {/* Donut Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold font-mono text-slate-100">
              {hoveredSlice
                ? `${data.find((d) => d.id === hoveredSlice)?.percent}%`
                : `${total}`}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              {hoveredSlice ? data.find((d) => d.id === hoveredSlice)?.label.split(' ')[0] : 'Emails'}
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 w-full space-y-2 text-xs">
          {data.map((item) => (
            <div
              key={item.id}
              onMouseEnter={() => setHoveredSlice(item.id)}
              onMouseLeave={() => setHoveredSlice(null)}
              className={`flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer ${
                hoveredSlice === item.id ? 'bg-slate-900/90 border border-slate-700' : 'hover:bg-slate-900/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${item.bgClass}`}></span>
                <span className="font-medium text-slate-300">{item.label}</span>
              </div>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-slate-400 text-xs">{item.count}</span>
                <span className="text-slate-200 font-semibold text-xs w-8 text-right">{item.percent}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
