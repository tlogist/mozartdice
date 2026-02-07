"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { SessionStatsManager } from "@/lib/engine/SessionStatsManager";
import type { MeasureStats } from "@/lib/domain/types";

export function useSessionStats() {
  const managerRef = useRef<SessionStatsManager | null>(null);
  const [allStats, setAllStats] = useState<MeasureStats[]>([]);

  useEffect(() => {
    const mgr = new SessionStatsManager();
    mgr.load();
    managerRef.current = mgr;
    setAllStats(mgr.getAllStats());
  }, []);

  const recordAttempt = useCallback((measureId: number, accuracy: number, tempo: number) => {
    managerRef.current?.recordAttempt(measureId, accuracy, tempo);
    setAllStats(managerRef.current?.getAllStats() ?? []);
  }, []);

  const getStats = useCallback((measureId: number) => {
    return managerRef.current?.getStats(measureId);
  }, []);

  const getWeakMeasures = useCallback((threshold = 70) => {
    return managerRef.current?.getWeakMeasures(threshold) ?? [];
  }, []);

  const getRecommended = useCallback((allMeasureIds: number[], limit = 5) => {
    return managerRef.current?.getRecommended(allMeasureIds, limit) ?? [];
  }, []);

  return { allStats, recordAttempt, getStats, getWeakMeasures, getRecommended };
}
