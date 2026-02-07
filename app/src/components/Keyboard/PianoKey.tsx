"use client";

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export type FeedbackColor = "correct" | "wrong" | "early" | "late";

interface PianoKeyProps {
  midi: number;
  isBlack: boolean;
  isActive: boolean;
  isExpected: boolean;
  fingering?: number;
  hand?: "left" | "right";
  feedbackColor?: FeedbackColor;
}

function noteName(midi: number): string {
  return NOTE_NAMES[midi % 12];
}

const FEEDBACK_BG: Record<FeedbackColor, string> = {
  correct: "bg-emerald-400",
  wrong: "bg-red-500",
  early: "bg-orange-400",
  late: "bg-amber-500",
};

export default function PianoKey({ midi, isBlack, isActive, isExpected, fingering, hand, feedbackColor }: PianoKeyProps) {
  const isLeft = hand === "left";

  let bg: string;
  if (feedbackColor) {
    bg = FEEDBACK_BG[feedbackColor];
  } else if (isActive) {
    bg = isLeft ? "bg-red-500" : "bg-blue-500";
  } else if (isExpected) {
    if (isLeft) {
      bg = isBlack ? "bg-yellow-600" : "bg-yellow-400";
    } else {
      bg = isBlack ? "bg-green-600" : "bg-green-400";
    }
  } else {
    bg = isBlack ? "bg-neutral-900" : "bg-white";
  }

  const textColor =
    feedbackColor
      ? "text-white"
      : isExpected && isLeft && !isActive
        ? "text-neutral-900"
        : isActive || isExpected || isBlack
          ? "text-white"
          : "text-neutral-600";
  const showFingering = fingering !== undefined && (isActive || isExpected || !!feedbackColor);

  if (isBlack) {
    return (
      <div
        className={`absolute z-10 flex h-20 w-6 flex-col items-center justify-end rounded-b pb-1 ${bg} ${textColor} border border-neutral-700`}
        style={{ marginLeft: "-12px" }}
      >
        {showFingering && (
          <span className="mb-1 text-sm font-bold drop-shadow">{fingering}</span>
        )}
        <span className="text-[9px]">{noteName(midi)}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-32 w-10 flex-col items-center justify-end rounded-b border border-neutral-300 pb-1 ${bg} ${textColor}`}
    >
      {showFingering && (
        <span className="mb-1 text-lg font-bold drop-shadow">{fingering}</span>
      )}
      <span className="text-xs">{noteName(midi)}</span>
    </div>
  );
}
