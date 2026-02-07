"use client";

import { useState, useCallback } from "react";
import DiceRoller from "@/components/Dice/DiceRoller";
import MeasureGrid from "@/components/MeasureGrid/MeasureGrid";
import PianoKeyboard from "@/components/Keyboard/PianoKeyboard";
import TempoSlider from "@/components/Tempo/TempoSlider";
import PlaybackControls from "@/components/Playback/PlaybackControls";
import TeachingPanel from "@/components/Teaching/TeachingPanel";
import PracticeToolbar from "@/components/Practice/PracticeToolbar";
import FeedbackOverlay from "@/components/Practice/FeedbackOverlay";
import LoopControls from "@/components/Practice/LoopControls";
import RecordingTimeline from "@/components/Recording/RecordingTimeline";
import SightReadingView from "@/components/SightReading/SightReadingView";
import SessionDashboard from "@/components/Stats/SessionDashboard";
import { useMidiInput } from "@/lib/hooks/useMidiInput";
import { usePianoSynth } from "@/lib/hooks/usePianoSynth";
import { usePracticeSession } from "@/lib/hooks/usePracticeSession";
import { useSessionStats } from "@/lib/hooks/useSessionStats";
import { useSightReading } from "@/lib/hooks/useSightReading";
import { useAppStore } from "@/lib/state/useAppStore";
import type { FeedbackColor } from "@/components/Keyboard/PianoKey";

export default function Home() {
  const [activeNotes, setActiveNotes] = useState<Set<number>>(new Set());
  const [expectedNotes, setExpectedNotes] = useState<number[]>([]);
  const [fingeringMap, setFingeringMap] = useState<Map<number, number>>(new Map());
  const [leftHandMidis, setLeftHandMidis] = useState<Set<number>>(new Set());
  const [showStats, setShowStats] = useState(false);

  const { noteOn, noteOff } = usePianoSynth();
  const { allStats, recordAttempt, getWeakMeasures, getRecommended } = useSessionStats();
  const measureIds = useAppStore((s) => s.measureIds);
  const practiceMode = useAppStore((s) => s.practiceMode);
  const selectBar = useAppStore((s) => s.selectBar);

  const {
    feedbackMap,
    lastLoopResult,
    onPracticeNoteOn,
    onPracticeNoteOff,
    onPlaybackTick,
    onLoopComplete,
  } = usePracticeSession(noteOn, noteOff, recordAttempt);

  const {
    sightReadingSession,
    countdown,
    isActive: isSightReadingActive,
    startSightReading,
    clearSightReading,
    evaluateNote: sightReadingEvaluateNote,
    completeBar: sightReadingCompleteBar,
  } = useSightReading();

  // MIDI input uses practice note handlers for evaluation
  const handleMidiNoteOn = useCallback((note: number, velocity: number) => {
    onPracticeNoteOn(note, velocity);
    if (isSightReadingActive) sightReadingEvaluateNote(note);
  }, [onPracticeNoteOn, isSightReadingActive, sightReadingEvaluateNote]);

  const handleMidiNoteOff = useCallback((note: number) => {
    onPracticeNoteOff(note);
  }, [onPracticeNoteOff]);

  const { pressedNotes, isConnected } = useMidiInput({
    onNoteOn: handleMidiNoteOn,
    onNoteOff: handleMidiNoteOff,
  });

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

  const handleAutoNoteOn = useCallback((midi: number) => {
    noteOn(midi, 80);
  }, [noteOn]);

  const handleAutoNoteOff = useCallback((midi: number) => {
    noteOff(midi);
  }, [noteOff]);

  const handleLoopBoundary = useCallback((loopCount: number) => {
    onLoopComplete();
    if (isSightReadingActive) sightReadingCompleteBar();
  }, [onLoopComplete, isSightReadingActive, sightReadingCompleteBar]);

  const handleSelectMeasure = useCallback((measureId: number) => {
    const idx = measureIds.indexOf(measureId);
    if (idx >= 0) selectBar(idx);
    setShowStats(false);
  }, [measureIds, selectBar]);

  // Merge pressed notes with feedback coloring
  const mergedFeedbackMap: Map<number, FeedbackColor> = practiceMode !== "free" ? feedbackMap : new Map();

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

        {/* Sight-reading overlay */}
        {sightReadingSession && (
          <SightReadingView
            session={sightReadingSession}
            countdown={countdown}
            onRetry={startSightReading}
            onNewPiece={startSightReading}
            onClose={clearSightReading}
          />
        )}

        <TeachingPanel />

        {/* Practice toolbar */}
        <PracticeToolbar
          onStartSightReading={startSightReading}
          onOpenStats={() => setShowStats(true)}
        />

        {/* Loop controls */}
        <LoopControls />

        {/* Feedback overlay */}
        <FeedbackOverlay lastLoopResult={lastLoopResult} />

        {/* Recording timeline */}
        <RecordingTimeline onReplayNoteOn={noteOn} onReplayNoteOff={noteOff} />

        <div className="flex items-center gap-6">
          <PlaybackControls
            onActiveNotes={handleActiveNotes}
            onExpectedNotes={handleExpectedNotes}
            onFingeringMap={handleFingeringMap}
            onLeftHandMidis={handleLeftHandMidis}
            onPlaybackPosition={onPlaybackTick}
            onLoopBoundary={handleLoopBoundary}
            onAutoNoteOn={handleAutoNoteOn}
            onAutoNoteOff={handleAutoNoteOff}
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
            <PianoKeyboard activeNotes={pressedNotes} feedbackMap={mergedFeedbackMap} />
          ) : (
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-zinc-300 px-8 dark:border-zinc-700">
              <p className="text-sm text-zinc-400 dark:text-zinc-500">Connect a USB MIDI keyboard to play along</p>
            </div>
          )}
        </div>

        {/* Stats modal */}
        {showStats && (
          <SessionDashboard
            allStats={allStats}
            weakMeasures={getWeakMeasures()}
            recommended={getRecommended(measureIds)}
            onSelectMeasure={handleSelectMeasure}
            onClose={() => setShowStats(false)}
          />
        )}
      </main>
    </div>
  );
}
