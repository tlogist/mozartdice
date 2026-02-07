"use client";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

interface PianoKeyProps {
  midi: number;
  isBlack: boolean;
  isActive: boolean;
  isExpected: boolean;
}

function noteName(midi: number): string {
  return NOTE_NAMES[midi % 12];
}

export default function PianoKey({ midi, isBlack, isActive, isExpected }: PianoKeyProps) {
  let bg: string;
  if (isActive) {
    bg = "bg-blue-500";
  } else if (isExpected) {
    bg = isBlack ? "bg-green-600" : "bg-green-400";
  } else {
    bg = isBlack ? "bg-neutral-900" : "bg-white";
  }

  const textColor = isActive || isExpected || isBlack ? "text-white" : "text-neutral-600";

  if (isBlack) {
    return (
      <div
        className={`absolute z-10 flex h-20 w-6 items-end justify-center rounded-b pb-1 text-[9px] ${bg} ${textColor} border border-neutral-700`}
        style={{ marginLeft: "-12px" }}
      >
        {noteName(midi)}
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-32 w-10 items-end justify-center rounded-b border border-neutral-300 pb-1 text-xs ${bg} ${textColor}`}
    >
      {noteName(midi)}
    </div>
  );
}
