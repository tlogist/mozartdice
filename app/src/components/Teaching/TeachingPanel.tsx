"use client";

import { useAppStore } from "@/lib/state/useAppStore";
import { getMeasureData } from "@/lib/mozart/measureData";

export default function TeachingPanel() {
  const { selectedBar, measureIds } = useAppStore();

  if (selectedBar === null) return null;

  const measureId = measureIds[selectedBar];
  const data = getMeasureData(measureId);

  if (!data) {
    return (
      <div className="rounded-lg border border-neutral-700 bg-neutral-800/50 px-4 py-3">
        <p className="text-sm text-neutral-500">
          Data not yet available for measure {measureId}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <span className="text-xs font-medium text-neutral-500">
          Bar {selectedBar + 1}
        </span>
        <span className="text-xs text-neutral-600">#{measureId}</span>
      </div>
      <span className="self-start rounded bg-amber-600/30 px-2 py-0.5 text-sm font-bold text-amber-400">
        {data.harmonicFunction}
      </span>
      <p className="text-xs leading-relaxed text-neutral-300">{data.teachingText}</p>
      <div className="flex flex-col gap-1 text-xs text-neutral-400">
        <div>
          <span className="font-semibold">RH: </span>
          {data.fingeringRight.join(" - ")}
        </div>
        <div>
          <span className="font-semibold">LH: </span>
          {data.fingeringLeft.join(" - ")}
        </div>
      </div>
    </div>
  );
}
