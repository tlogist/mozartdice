"use client";

import { useState, useCallback } from "react";
import DiceRoller from "@/components/Dice/DiceRoller";
import MeasureGrid from "@/components/MeasureGrid/MeasureGrid";
import PianoKeyboard from "@/components/Keyboard/PianoKeyboard";
import TempoSlider from "@/components/Tempo/TempoSlider";
import PlaybackControls from "@/components/Playback/PlaybackControls";
import TeachingPanel from "@/components/Teaching/TeachingPanel";
import { useMidiInput } from "@/lib/hooks/useMidiInput";
import { usePianoSynth } from "@/lib/hooks/usePianoSynth";

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [expectedNotes, setExpectedNotes] = useState<number[]>([]);
  const [fingeringMap, setFingeringMap] = useState<Map<number, number>>(new Map());
  const [leftHandMidis, setLeftHandMidis] = useState<Set<number>>(new Set());
  const { noteOn, noteOff } = usePianoSynth();
  const { pressedNotes, isConnected } = useMidiInput({ onNoteOn: noteOn, onNoteOff: noteOff });

  const handleActiveNotes = useCallback((notes: Set<number>) => {
    setActiveNotes(notes);
  }, []);

  const handleExpectedNotes = useCallback((notes: number[]) => {
    setExpectedNotes(notes);
  }, []);

  const handleFingeringMap = useCallback((map: Map<number, number>) => {
    setFingeringMap(map);
  }, []);

  const handleLeftHandMidis = useCallback((midis: Set<number>) => {
    setLeftHandMidis(midis);
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
            onFingeringMap={handleFingeringMap}
            onLeftHandMidis={handleLeftHandMidis}
          />
          <TempoSlider />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Teaching</span>
          <PianoKeyboard activeNotes={activeNotes} expectedNotes={expectedNotes} fingeringMap={fingeringMap} leftHandMidis={leftHandMidis} />
        </div>

        <div className="flex flex-col items-center gap-1">
          <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Your playing</span>
          {isConnected ? (
            <PianoKeyboard activeNotes={pressedNotes} />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 px-8 dark:border-zinc-700">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Connect a USB MIDI keyboard to play along</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
