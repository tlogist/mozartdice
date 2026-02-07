"use client";

import { useState, useCallback } from "react";
import { SessionStatsManager } from "@/lib/engine/SessionStatsManager";
import type { MeasureStats } from "@/lib/domain/types";

export function useSessionStats() {
  const [manager] = useState(() => {
    const mgr = new SessionStatsManager();
    mgr.load();
    return mgr;
  });
  const [allStats, setAllStats] = useState<MeasureStats[]>(() => manager.getAllStats());

  const recordAttempt = useCallback((measureId: number, accuracy: number, tempo: number) => {
    manager.recordAttempt(measureId, accuracy, tempo);
    setAllStats(manager.getAllStats());
  }, [manager]);

  const getStats = useCallback((measureId: number) => {
    return manager.getStats(measureId);
  }, [manager]);

  const getWeakMeasures = useCallback((threshold = 70) => {
    return manager.getWeakMeasures(threshold);
  }, [manager]);

  const getRecommended = useCallback((allMeasureIds: number[], limit = 5) => {
    return manager.getRecommended(allMeasureIds, limit);
  }, [manager]);

  return { allStats, recordAttempt, getStats, getWeakMeasures, getRecommended };
}
