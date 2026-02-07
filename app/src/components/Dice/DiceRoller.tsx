"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";

export default function DiceRoller() {
  const { currentRolls, rollAllDice, rollWithFixedMeasure } = useAppStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySums, setDisplaySums] = useState<number[]>([]);
  const [measureInput, setMeasureInput] = useState("");

  const handleRoll = useCallback(() => {
    setIsAnimating(true);

    // Animate random numbers for 600ms
    const interval = setInterval(() => {
      setDisplaySums(
        Array.from({ length: 16 }, () => Math.floor(Math.random() * 11) + 2)
      );
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
      rollAllDice();
      setIsAnimating(false);
    }, 600);
  }, [rollAllDice]);

  const handleMeasureSubmit = useCallback(() => {
    const n = parseInt(measureInput, 10);
    if (isNaN(n) || n < 1 || n > 176) return;
    rollWithFixedMeasure(n);
    setMeasureInput("");
  }, [measureInput, rollWithFixedMeasure]);

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleRoll}
        disabled={isAnimating}
        className={`w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-500 disabled:opacity-50 ${isAnimating ? "animate-pulse" : ""}`}
      >
        {isAnimating ? "Rolling..." : "Roll Dice"}
      </button>
      <input
        type="text"
        inputMode="numeric"
        value={measureInput}
        onChange={(e) => setMeasureInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") handleMeasureSubmit(); }}
        placeholder="Measure # (1–176)"
        className="w-full rounded-md border border-neutral-600 bg-neutral-800 px-2 py-1 text-center text-xs text-neutral-200 placeholder:text-neutral-500 focus:border-amber-500 focus:outline-none"
      />
    </div>
  );
}
