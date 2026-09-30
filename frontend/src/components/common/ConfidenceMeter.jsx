import React from 'react';

export function ConfidenceMeter({ value, showBar = true, size = 'md' }) {
  const numericValue = typeof value === 'number' ? value : parseFloat(value) || 0;
  const percentage = Math.round(numericValue * 100);

  // Color logic according to backend thresholds
  let colorClass = 'text-rose-400';
  let barBg = 'bg-rose-500';
  let badgeBg = 'bg-rose-950/60 border-rose-500/30 text-rose-300';
  let label = 'Low Confidence';

  if (numericValue >= 0.75) {
    colorClass = 'text-emerald-400';
    barBg = 'bg-emerald-500';
    badgeBg = 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300';
    label = 'High Confidence';
  } else if (numericValue >= 0.45) {
    colorClass = 'text-amber-400';
    barBg = 'bg-amber-500';
    badgeBg = 'bg-amber-950/60 border-amber-500/30 text-amber-300';
    label = 'Medium Confidence';
  }

  if (size === 'sm') {
    return (
      <div className="flex items-center gap-2">
        <span className={`font-mono text-xs font-semibold ${colorClass}`}>
          {numericValue.toFixed(2)}
        </span>
        {showBar && (
          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${barBg} transition-all duration-300`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (size === 'badge') {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium border ${badgeBg}`}>
        <span className={`w-1.5 h-1.5 rounded-full ${barBg}`}></span>
        <span>{numericValue.toFixed(2)}</span>
      </span>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Confidence Score</span>
        <div className="flex items-center gap-1.5">
          <span className={`font-mono font-bold text-sm ${colorClass}`}>
            {numericValue.toFixed(2)}
          </span>
          <span className="text-slate-500 text-[11px]">({percentage}%)</span>
        </div>
      </div>
      {showBar && (
        <div className="w-full h-2 rounded-full bg-slate-800/90 overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className={`h-full rounded-full ${barBg} transition-all duration-500 shadow-sm`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
