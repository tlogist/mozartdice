"use client";

import { useState, useCallback } from "react";
import DiceRoller from "@/components/Dice/DiceRoller";
import MeasureGrid from "@/components/MeasureGrid/MeasureGrid";
import PianoKeyboard from "@/components/Keyboard/PianoKeyboard";
import TempoSlider from "@/components/Tempo/TempoSlider";
import PlaybackControls from "@/components/Playback/PlaybackControls";
import TeachingPanel from "@/components/Teaching/TeachingPanel";

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [expectedNotes, setExpectedNotes] = useState<number[]>([]);

  const handleActiveNotes = useCallback((notes: Set<number>) => {
    setActiveNotes(notes);
  }, []);

  const handleExpectedNotes = useCallback((notes: number[]) => {
    setExpectedNotes(notes);
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 px-4 py-8 dark:bg-black">
      <main className="flex w-full max-w-4xl flex-col items-center gap-6">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dice &amp; Discipline
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          From Mozart&apos;s Order to Beethoven&apos;s Agitation
        </p>

        <DiceRoller />
        <MeasureGrid />
        <TeachingPanel />

        <div className="flex items-center gap-6">
          <PlaybackControls
            onActiveNotes={handleActiveNotes}
            onExpectedNotes={handleExpectedNotes}
          />
          <TempoSlider />
        </div>

        <PianoKeyboard activeNotes={activeNotes} expectedNotes={expectedNotes} />
      </main>
    </div>
  );
}
