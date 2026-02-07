"use client";

import { useAppStore } from "@/lib/state/useAppStore";

export default function MetronomePanel() {
  const metronomeEnabled = useAppStore((s) => s.metronomeEnabled);
  const metronomeSubdivision = useAppStore((s) => s.metronomeSubdivision);
  const metronomeVolume = useAppStore((s) => s.metronomeVolume);
  const toggleMetronome = useAppStore((s) => s.toggleMetronome);
  const setMetronomeSubdivision = useAppStore((s) => s.setMetronomeSubdivision);
  const setMetronomeVolume = useAppStore((s) => s.setMetronomeVolume);

  const volumePercent = Math.round(metronomeVolume * 100);

  const densityOptions: Array<{ value: 1 | 2 | 3 | 4; label: string }> = [
    { value: 1, label: "1x" },
    { value: 2, label: "2x" },
    { value: 3, label: "3x" },
    { value: 4, label: "4x" },
  ];

  return (
    <div className="w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-3 text-xs">
      <button
        onClick={toggleMetronome}
        className={`w-full rounded px-2 py-1.5 font-medium transition-colors ${
          metronomeEnabled
            ? "bg-emerald-600 text-white hover:bg-emerald-500"
            : "bg-neutral-800 text-neutral-300 hover:text-white"
        }`}
      >
        Metronome {metronomeEnabled ? "ON" : "OFF"}
      </button>

      <div className="mt-3 flex flex-col gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
          Beat Density
        </span>
        <div className="grid grid-cols-4 gap-1">
          {densityOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setMetronomeSubdivision(opt.value)}
              disabled={!metronomeEnabled}
              className={`rounded px-1 py-1 font-medium transition-colors ${
                metronomeSubdivision === opt.value
                  ? "bg-amber-500 text-black"
                  : "bg-neutral-800 text-neutral-400 hover:text-neutral-200"
              } disabled:cursor-not-allowed disabled:opacity-40`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
            Volume
          </span>
          <span className="text-[11px] font-medium text-neutral-300">{volumePercent}%</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={volumePercent}
          disabled={!metronomeEnabled}
          onChange={(e) => setMetronomeVolume(Number(e.target.value) / 100)}
          className="tempo-slider w-full disabled:cursor-not-allowed disabled:opacity-40"
        />
      </div>
    </div>
  );
}

