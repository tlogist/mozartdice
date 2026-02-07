"use client";

import PianoKey from "./PianoKey";

interface PianoKeyboardProps {
  activeNotes?: Set<number>;
  expectedNotes?: number[];
  fingeringMap?: Map<number, number>;
  leftHandMidis?: Set<number>;
  startMidi?: number;
  endMidi?: number;
}

function isBlackKey(midi: number): boolean {
  const n = midi % 12;
  return [1, 3, 6, 8, 10].includes(n);
}

export default function PianoKeyboard({
  activeNotes = new Set(),
  expectedNotes = [],
  fingeringMap,
  leftHandMidis,
  startMidi = 36,
  endMidi = 84,
}: PianoKeyboardProps) {
  const expectedSet = new Set(expectedNotes);
  const keys: { midi: number; isBlack: boolean }[] = [];

  for (let midi = startMidi; midi <= endMidi; midi++) {
    keys.push({ midi, isBlack: isBlackKey(midi) });
  }

  const whiteKeys = keys.filter((k) => !k.isBlack);
  const blackKeys = keys.filter((k) => k.isBlack);

  // Build a position map: for each white key index, track the midi
  const whiteKeyPositions = new Map<number, number>();
  whiteKeys.forEach((k, i) => {
    whiteKeyPositions.set(k.midi, i);
  });

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex">
        {/* White keys */}
        {whiteKeys.map((k) => (
          <PianoKey
            key={k.midi}
            midi={k.midi}
            isBlack={false}
            isActive={activeNotes.has(k.midi)}
            isExpected={expectedSet.has(k.midi)}
            fingering={fingeringMap?.get(k.midi)}
            hand={leftHandMidis?.has(k.midi) ? "left" : "right"}
          />
        ))}
        {/* Black keys positioned over white keys */}
        {blackKeys.map((k) => {
          // Find the white key just below this black key
          const prevWhiteMidi = k.midi - 1;
          const whiteIdx = whiteKeyPositions.get(prevWhiteMidi);
          if (whiteIdx === undefined) return null;
          const left = (whiteIdx + 1) * 40; // 40px = white key width
          return (
            <div
              key={k.midi}
              className="absolute"
              style={{ left: `${left}px` }}
            >
              <PianoKey
                midi={k.midi}
                isBlack={true}
                isActive={activeNotes.has(k.midi)}
                isExpected={expectedSet.has(k.midi)}
                fingering={fingeringMap?.get(k.midi)}
                hand={leftHandMidis?.has(k.midi) ? "left" : "right"}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
