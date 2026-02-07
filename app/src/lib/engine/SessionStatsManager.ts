import type { MeasureStats } from "@/lib/domain/types";

const STORAGE_KEY = "mozartdice-session-stats";
const MAX_HISTORY = 20;

export class SessionStatsManager {
  private stats: Map<number, MeasureStats> = new Map();

  load(): void {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const arr: MeasureStats[] = JSON.parse(raw);
        this.stats = new Map(arr.map((s) => [s.measureId, s]));
      }
    } catch {
      // corrupt data, start fresh
      this.stats = new Map();
    }
  }

  save(): void {
    if (typeof window === "undefined") return;
    const arr = Array.from(this.stats.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  }

  recordAttempt(measureId: number, accuracy: number, tempo: number): void {
    const existing = this.stats.get(measureId);
    if (existing) {
      existing.attempts++;
      existing.lastAccuracy = accuracy;
      existing.bestAccuracy = Math.max(existing.bestAccuracy, accuracy);
      existing.highestTempo = Math.max(existing.highestTempo, tempo);
      existing.lastPracticedAt = Date.now();
      existing.accuracyHistory.push(accuracy);
      if (existing.accuracyHistory.length > MAX_HISTORY) {
        existing.accuracyHistory = existing.accuracyHistory.slice(-MAX_HISTORY);
      }
    } else {
      this.stats.set(measureId, {
        measureId,
        attempts: 1,
        bestAccuracy: accuracy,
        lastAccuracy: accuracy,
        highestTempo: tempo,
        lastPracticedAt: Date.now(),
        accuracyHistory: [accuracy],
      });
    }
    this.save();
  }

  getStats(measureId: number): MeasureStats | undefined {
    return this.stats.get(measureId);
  }

  getAllStats(): MeasureStats[] {
    return Array.from(this.stats.values());
  }

  getWeakMeasures(threshold = 70): MeasureStats[] {
    return this.getAllStats()
      .filter((s) => s.lastAccuracy < threshold)
      .sort((a, b) => a.lastAccuracy - b.lastAccuracy);
  }

  getRecommended(allMeasureIds: number[], limit = 5): number[] {
    const now = Date.now();
    const scored: { id: number; priority: number }[] = allMeasureIds.map((id) => {
      const s = this.stats.get(id);
      if (!s) return { id, priority: 200 }; // unpracticed = highest priority
      const daysSince = (now - s.lastPracticedAt) / (1000 * 60 * 60 * 24);
      const priority = (100 - s.lastAccuracy) + daysSince * 5;
      return { id, priority };
    });
    scored.sort((a, b) => b.priority - a.priority);
    return scored.slice(0, limit).map((s) => s.id);
  }
}
