"use client";

import type { MeasureStats } from "@/lib/domain/types";

interface SessionDashboardProps {
  allStats: MeasureStats[];
  weakMeasures: MeasureStats[];
  recommended: number[];
  onSelectMeasure: (measureId: number) => void;
  onClose: () => void;
}

function AccuracyChart({ history }: { history: number[] }) {
  if (history.length < 2) return null;
  const width = 200;
  const height = 60;
  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width;
    const y = height - (v / 100) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="mt-1">
      <polyline
        points={points}
        fill="none"
        stroke="#f59e0b"
        strokeWidth={2}
      />
    </svg>
  );
}

export default function SessionDashboard({ allStats, weakMeasures, recommended, onSelectMeasure, onClose }: SessionDashboardProps) {
  const totalAttempts = allStats.reduce((s, m) => s + m.attempts, 0);
  const avgAccuracy = allStats.length > 0
    ? Math.round(allStats.reduce((s, m) => s + m.lastAccuracy, 0) / allStats.length)
    : 0;

  // Merge all accuracy histories for the chart
  const recentHistory = allStats
    .flatMap((s) => s.accuracyHistory.map((a, i) => ({ a, t: s.lastPracticedAt - (s.accuracyHistory.length - i) * 60000 })))
    .sort((a, b) => a.t - b.t)
    .slice(-20)
    .map((x) => x.a);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-700 bg-neutral-900 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-neutral-200">Session Stats</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-300 text-lg">&times;</button>
        </div>

        {/* Summary */}
        <div className="flex gap-6 mb-4">
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-amber-400">{allStats.length}</span>
            <span className="text-[10px] text-neutral-500">Measures</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-amber-400">{avgAccuracy}%</span>
            <span className="text-[10px] text-neutral-500">Avg Accuracy</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-2xl font-bold text-amber-400">{totalAttempts}</span>
            <span className="text-[10px] text-neutral-500">Total Attempts</span>
          </div>
        </div>

        {/* Accuracy trend */}
        {recentHistory.length >= 2 && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-neutral-400 mb-1">Accuracy Trend</h3>
            <AccuracyChart history={recentHistory} />
          </div>
        )}

        {/* Weak measures */}
        {weakMeasures.length > 0 && (
          <div className="mb-4">
            <h3 className="text-xs font-medium text-neutral-400 mb-1">Weak Measures (below 70%)</h3>
            <div className="space-y-1">
              {weakMeasures.slice(0, 5).map((s) => (
                <button
                  key={s.measureId}
                  onClick={() => onSelectMeasure(s.measureId)}
                  className="flex w-full items-center justify-between rounded bg-neutral-800 px-3 py-1.5 text-xs hover:bg-neutral-700"
                >
                  <span className="text-neutral-300">Measure {s.measureId}</span>
                  <span className="text-red-400">{s.lastAccuracy}%</span>
                  <span className="text-neutral-500">{s.highestTempo} BPM</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Recommendations */}
        {recommended.length > 0 && (
          <div>
            <h3 className="text-xs font-medium text-neutral-400 mb-1">Recommended Next</h3>
            <div className="flex flex-wrap gap-2">
              {recommended.map((id) => (
                <button
                  key={id}
                  onClick={() => onSelectMeasure(id)}
                  className="rounded bg-amber-900/50 border border-amber-700 px-3 py-1 text-xs text-amber-300 hover:bg-amber-800/50"
                >
                  {id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
