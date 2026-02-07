"use client";

import { useState, useCallback } from "react";
import { useAppStore } from "@/lib/state/useAppStore";

export default function DiceRoller() {
  const { currentRolls, rollAllDice } = useAppStore();
  const [isAnimating, setIsAnimating] = useState(false);
  const [displaySums, setDisplaySums] = useState<number[]>([]);

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

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={handleRoll}
        disabled={isAnimating}
        className="rounded-lg bg-amber-600 px-6 py-3 text-lg font-bold text-white transition-colors hover:bg-amber-500 disabled:opacity-50"
      >
        {isAnimating ? "Rolling..." : "Roll Dice"}
      </button>

      {isAnimating && displaySums.length > 0 && (
        <div className="grid grid-cols-8 gap-2">
          {displaySums.map((sum, i) => (
            <div
              key={i}
              className="flex h-10 w-10 animate-pulse items-center justify-center rounded-md bg-amber-500/30 text-sm font-bold text-amber-300"
            >
              {sum}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
