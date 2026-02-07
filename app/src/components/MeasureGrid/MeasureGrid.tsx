"use client";

import { useAppStore } from "@/lib/state/useAppStore";

export default function MeasureGrid() {
  const { measureIds, selectedBar, selectBar, selectedBars, toggleBarSelection, selectBarRange } = useAppStore();

  if (measureIds.length === 0) return null;

  const handleClick = (i: number, e: React.MouseEvent) => {
    if (e.metaKey || e.ctrlKey) {
      toggleBarSelection(i);
    } else if (e.shiftKey && selectedBar !== null) {
      selectBarRange(i);
    } else {
      selectBar(selectedBar === i ? null : i);
    }
  };

  const isSelected = (i: number) => selectedBars.includes(i);

  return (
    <div className="flex flex-col items-center gap-2">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
        16-Bar Minuet
      </h2>
      <div className="grid grid-cols-8 gap-2">
        {measureIds.map((id, i) => (
          <button
            key={i}
            onClick={(e) => handleClick(i, e)}
            className={`flex flex-col items-center rounded-lg border px-3 py-2 transition-colors ${
              isSelected(i)
                ? selectedBar === i
                  ? "border-amber-500 bg-amber-500/20 text-amber-300"
                  : "border-blue-500 bg-blue-500/10 text-blue-300"
                : "border-neutral-700 bg-neutral-800/50 text-neutral-300 hover:border-neutral-500"
            }`}
          >
            <span className="text-[10px] text-neutral-500">Bar {i + 1}</span>
            <span className="text-lg font-bold">{id}</span>
          </button>
        ))}
      </div>
      {selectedBars.length > 1 && (
        <p className="text-xs text-blue-400">
          {selectedBars.length} bars selected
        </p>
      )}
    </div>
  );
}
