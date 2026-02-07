"use client";

import { useMemo } from "react";
import type { ExpectedNote } from "@/lib/domain/types";
import type { FeedbackColor } from "@/components/Keyboard/PianoKey";
import { midiToStaff, getLedgerLines, classifyDuration } from "@/lib/music/midiToStaff";
import type { StaffNote, Duration } from "@/lib/music/midiToStaff";

// --- Layout constants ---
const SVG_W = 520;
const SVG_H = 280;
const LINE_SP = 10;          // space between staff lines
const TREBLE_TOP_Y = 50;     // Y of treble top line (F5, position 10)
const BASS_TOP_Y = 170;      // Y of bass top line (A3, position -2)
const CLEF_X = 12;
const NOTE_AREA_LEFT = 70;
const NOTE_AREA_W = 430;
const NOTE_RX = 5.5;         // notehead horizontal radius
const NOTE_RY = 4;           // notehead vertical radius
const STEM_H = 30;
const MEASURE_MS = 3000;     // base duration of one measure at 60 BPM
const CUE_PROXIMITY_PX = 25; // how close a note must be to the cue bar to be "at" the cue

// --- Position → Y conversion ---
// Position 10 (F5) → TREBLE_TOP_Y, each step down = +LINE_SP/2
function positionToY(position: number): number {
  // Anchor: position 10 = TREBLE_TOP_Y for the treble region
  // position 0 (middle C) = TREBLE_TOP_Y + (10 - 0) * LINE_SP/2 = TREBLE_TOP_Y + 50
  // But for bass, we use BASS_TOP_Y as anchor for position -2
  // Unified formula: use treble anchor
  return TREBLE_TOP_Y + (10 - position) * (LINE_SP / 2);
}

// --- Determine clef for a note ---
function noteClef(position: number): "treble" | "bass" {
  return position >= 0 ? "treble" : "bass";
}

// --- Processed note for rendering ---
interface RenderNote {
  staffNote: StaffNote;
  duration: Duration;
  x: number;
  y: number;
  clef: "treble" | "bass";
  ledgerLines: number[];
  stemUp: boolean;
  fingering: number | null;
  hand: "right" | "left";
  startMs: number;
  midi: number;
  offsetX: number; // for second-interval collision avoidance
}

interface StaffNotationProps {
  rightHand: ExpectedNote[];
  leftHand: ExpectedNote[];
  fingeringRight: number[];
  fingeringLeft: number[];
  playbackPositionMs: number | null;
  tempoScale: number;
  feedbackMap?: Map<number, FeedbackColor>;
  pressedNotes?: Set<number>;
}

export default function StaffNotation({
  rightHand,
  leftHand,
  fingeringRight,
  fingeringLeft,
  playbackPositionMs,
  tempoScale,
  feedbackMap,
  pressedNotes,
}: StaffNotationProps) {
  const renderNotes = useMemo(() => {
    const notes: RenderNote[] = [];

    const processHand = (
      hand: "right" | "left",
      expectedNotes: ExpectedNote[],
      fingerings: number[],
    ) => {
      for (let i = 0; i < expectedNotes.length; i++) {
        const en = expectedNotes[i];
        const sn = midiToStaff(en.midi);
        const dur = classifyDuration(en.startMs, en.endMs);
        const x = NOTE_AREA_LEFT + (en.startMs / MEASURE_MS) * NOTE_AREA_W;
        const y = positionToY(sn.position);
        const clef = noteClef(sn.position);
        const ledgers = getLedgerLines(sn.position, clef);
        // Stem direction: notes below the middle line of their staff go stem-up
        const midLinePos = clef === "treble" ? 6 : -6; // B4 for treble, D3 for bass
        const stemUp = sn.position < midLinePos;
        const fing = fingerings[i] !== undefined ? fingerings[i] : null;

        notes.push({
          staffNote: sn,
          duration: dur,
          x,
          y,
          clef,
          ledgerLines: ledgers,
          stemUp,
          fingering: fing,
          hand,
          startMs: en.startMs,
          midi: en.midi,
          offsetX: 0,
        });
      }
    };

    processHand("right", rightHand, fingeringRight);
    processHand("left", leftHand, fingeringLeft);

    // Handle second-interval collisions: notes at same startMs that are 1 position apart
    const byTime = new Map<number, RenderNote[]>();
    for (const n of notes) {
      const group = byTime.get(n.startMs) ?? [];
      group.push(n);
      byTime.set(n.startMs, group);
    }
    for (const group of byTime.values()) {
      if (group.length < 2) continue;
      group.sort((a, b) => b.staffNote.position - a.staffNote.position);
      for (let i = 0; i < group.length - 1; i++) {
        const diff = Math.abs(group[i].staffNote.position - group[i + 1].staffNote.position);
        if (diff === 1) {
          // Offset the higher note to the right
          group[i].offsetX = NOTE_RX * 2;
        }
      }
    }

    return notes;
  }, [rightHand, leftHand, fingeringRight, fingeringLeft]);

  // Beat highlight X position
  const highlightX = useMemo(() => {
    if (playbackPositionMs === null) return null;
    return NOTE_AREA_LEFT + (playbackPositionMs / (MEASURE_MS * tempoScale)) * NOTE_AREA_W;
  }, [playbackPositionMs, tempoScale]);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full max-w-lg"
      role="img"
      aria-label="Musical staff notation"
    >
      {/* Staff lines */}
      <StaffLines />

      {/* Clef symbols */}
      <ClefSymbols />

      {/* Beat highlight */}
      {highlightX !== null && (
        <rect
          x={highlightX - 8}
          y={TREBLE_TOP_Y - 5}
          width={16}
          height={BASS_TOP_Y + 4 * LINE_SP - TREBLE_TOP_Y + 10}
          fill="#f59e0b"
          opacity={0.18}
          rx={3}
        />
      )}

      {/* Ledger lines */}
      {renderNotes.map((n, i) =>
        n.ledgerLines.map((lp) => (
          <line
            key={`ledger-${i}-${lp}`}
            x1={n.x + n.offsetX - NOTE_RX - 4}
            x2={n.x + n.offsetX + NOTE_RX + 4}
            y1={positionToY(lp)}
            y2={positionToY(lp)}
            stroke="currentColor"
            className="text-neutral-500"
            strokeWidth={1}
          />
        )),
      )}

      {/* Notes: accidental, notehead, stem, flag, fingering */}
      {renderNotes.map((n, i) => {
        const isNearCue = highlightX !== null
          ? Math.abs((n.x + n.offsetX) - highlightX) < CUE_PROXIMITY_PX
          : true;
        return (
          <NoteGlyph
            key={`note-${i}`}
            note={n}
            feedbackColor={isNearCue ? feedbackMap?.get(n.midi) : undefined}
            isPressed={isNearCue && (pressedNotes?.has(n.midi) ?? false)}
          />
        );
      })}

      {/* Ghost noteheads for wrong/unmatched presses at cue position */}
      {highlightX !== null && pressedNotes && pressedNotes.size > 0 && (() => {
        const nearCueMidis = new Set<number>();
        for (const n of renderNotes) {
          if (Math.abs((n.x + n.offsetX) - highlightX) < CUE_PROXIMITY_PX) {
            nearCueMidis.add(n.midi);
          }
        }
        const ghosts: React.ReactElement[] = [];
        pressedNotes.forEach((midi) => {
          if (nearCueMidis.has(midi)) return;
          const sn = midiToStaff(midi);
          const gy = positionToY(sn.position);
          const clef = noteClef(sn.position);
          const ledgers = getLedgerLines(sn.position, clef);
          ghosts.push(
            <g key={`ghost-${midi}`}>
              {ledgers.map((lp) => (
                <line
                  key={`ghost-ledger-${midi}-${lp}`}
                  x1={highlightX - NOTE_RX - 4}
                  x2={highlightX + NOTE_RX + 4}
                  y1={positionToY(lp)}
                  y2={positionToY(lp)}
                  stroke="#ef4444"
                  strokeWidth={1}
                  opacity={0.6}
                />
              ))}
              <ellipse
                cx={highlightX}
                cy={gy}
                rx={NOTE_RX}
                ry={NOTE_RY}
                fill="#ef4444"
                opacity={0.6}
                transform={`rotate(-15 ${highlightX} ${gy})`}
              />
            </g>,
          );
        });
        return ghosts;
      })()}
    </svg>
  );
}

// --- Sub-components ---

function StaffLines() {
  const lines: React.ReactElement[] = [];

  // Treble: 5 lines at positions 10, 8, 6, 4, 2
  for (let i = 0; i < 5; i++) {
    const y = TREBLE_TOP_Y + i * LINE_SP;
    lines.push(
      <line
        key={`t${i}`}
        x1={CLEF_X}
        x2={SVG_W - 10}
        y1={y}
        y2={y}
        stroke="currentColor"
        className="text-neutral-400 dark:text-neutral-600"
        strokeWidth={1}
      />,
    );
  }

  // Bass: 5 lines at positions -2, -4, -6, -8, -10
  for (let i = 0; i < 5; i++) {
    const y = BASS_TOP_Y + i * LINE_SP;
    lines.push(
      <line
        key={`b${i}`}
        x1={CLEF_X}
        x2={SVG_W - 10}
        y1={y}
        y2={y}
        stroke="currentColor"
        className="text-neutral-400 dark:text-neutral-600"
        strokeWidth={1}
      />,
    );
  }

  return <>{lines}</>;
}

function ClefSymbols() {
  return (
    <>
      {/* Treble clef — 𝄞 positioned so the curl centers on G4 line (position 4) */}
      <text
        x={CLEF_X + 4}
        y={positionToY(4) + 8}
        fontSize={42}
        className="fill-neutral-600 dark:fill-neutral-400"
        style={{ fontFamily: "serif" }}
      >
        {"\uD834\uDD1E"}
      </text>
      {/* Bass clef — 𝄢 positioned so the dots straddle F3 line (position -6) */}
      <text
        x={CLEF_X + 4}
        y={positionToY(-6) + 6}
        fontSize={34}
        className="fill-neutral-600 dark:fill-neutral-400"
        style={{ fontFamily: "serif" }}
      >
        {"\uD834\uDD22"}
      </text>
    </>
  );
}

function feedbackToColor(fb?: FeedbackColor): string | undefined {
  switch (fb) {
    case "correct": return "#10b981";
    case "wrong": return "#ef4444";
    case "early": return "#f97316";
    case "late": return "#f59e0b";
    default: return undefined;
  }
}

function NoteGlyph({
  note,
  feedbackColor,
  isPressed,
}: {
  note: RenderNote;
  feedbackColor?: FeedbackColor;
  isPressed: boolean;
}) {
  const nx = note.x + note.offsetX;
  const ny = note.y;
  const filled = note.duration === "quarter" || note.duration === "eighth";
  const hollow = note.duration === "half" || note.duration === "whole";
  const hasStem = note.duration !== "whole";
  const hasFlag = note.duration === "eighth";

  const fbColor = feedbackToColor(feedbackColor);
  const headColor = fbColor
    ?? (note.hand === "right" ? "#3b82f6" : "#a855f7"); // blue RH, purple LH
  const pressedGlow = isPressed;

  return (
    <g>
      {/* Accidental */}
      {note.staffNote.accidental !== "" && (
        <text
          x={nx - NOTE_RX - 8}
          y={ny + 4}
          fontSize={13}
          fontWeight="bold"
          fill={headColor}
          textAnchor="end"
        >
          {note.staffNote.accidental === "#" ? "♯" : "♭"}
        </text>
      )}

      {/* Notehead */}
      <ellipse
        cx={nx}
        cy={ny}
        rx={NOTE_RX}
        ry={NOTE_RY}
        fill={filled ? headColor : "none"}
        stroke={headColor}
        strokeWidth={hollow ? 1.5 : 0}
        transform={`rotate(-15 ${nx} ${ny})`}
        opacity={pressedGlow ? 1 : 0.85}
      />
      {pressedGlow && (
        <ellipse
          cx={nx}
          cy={ny}
          rx={NOTE_RX + 3}
          ry={NOTE_RY + 2}
          fill="none"
          stroke={headColor}
          strokeWidth={1.5}
          opacity={0.4}
          transform={`rotate(-15 ${nx} ${ny})`}
        />
      )}

      {/* Stem */}
      {hasStem && (
        <line
          x1={note.stemUp ? nx + NOTE_RX - 0.5 : nx - NOTE_RX + 0.5}
          y1={ny}
          x2={note.stemUp ? nx + NOTE_RX - 0.5 : nx - NOTE_RX + 0.5}
          y2={note.stemUp ? ny - STEM_H : ny + STEM_H}
          stroke={headColor}
          strokeWidth={1.2}
        />
      )}

      {/* Eighth flag */}
      {hasFlag && (
        <path
          d={
            note.stemUp
              ? `M${nx + NOTE_RX - 0.5},${ny - STEM_H} q8,10 2,20`
              : `M${nx - NOTE_RX + 0.5},${ny + STEM_H} q-8,-10 -2,-20`
          }
          fill="none"
          stroke={headColor}
          strokeWidth={1.5}
        />
      )}

      {/* Fingering number */}
      {note.fingering !== null && (
        <text
          x={nx}
          y={note.hand === "right" ? ny - (hasStem && note.stemUp ? STEM_H + 4 : NOTE_RY + 10) : ny + (hasStem && !note.stemUp ? STEM_H + 12 : NOTE_RY + 14)}
          fontSize={9}
          fontWeight="bold"
          textAnchor="middle"
          className="fill-neutral-500 dark:fill-neutral-400"
        >
          {note.fingering}
        </text>
      )}
    </g>
  );
}
