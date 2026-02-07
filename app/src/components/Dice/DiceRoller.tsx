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
    <button
      onClick={handleRoll}
      disabled={isAnimating}
      className={`w-full rounded-lg bg-amber-600 px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-500 disabled:opacity-50 ${isAnimating ? "animate-pulse" : ""}`}
    >
      {isAnimating ? "Rolling..." : "Roll Dice"}
    </button>
  );
}
