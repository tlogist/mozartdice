"use client";

import { useAppStore } from "@/lib/state/useAppStore";

export default function TempoSlider() {
  const { tempo, setTempo } = useAppStore();

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm text-neutral-400" htmlFor="tempo">
        Tempo
      </label>
      <input
        id="tempo"
        type="range"
        min={40}
        max={120}
        value={tempo}
        onChange={(e) => setTempo(Number(e.target.value))}
        className="w-48 accent-amber-500"
      />
      <span className="min-w-[4ch] text-right font-mono text-sm text-amber-400">
        {tempo}
      </span>
      <span className="text-xs text-neutral-500">BPM</span>
    </div>
  );
}
