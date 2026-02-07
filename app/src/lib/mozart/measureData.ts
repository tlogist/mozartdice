import type { ExpectedNote } from "@/lib/domain/types";

export interface MeasureData {
  rightHand: ExpectedNote[];
  leftHand: ExpectedNote[];
  harmonicFunction: string;
  teachingText: string;
  fingeringRight: number[];
}

/** Quarter-note duration at 60 BPM in ms */
const Q = 1000;

function notes(
  midis: number[],
  fingering: number[],
  startBeat: number = 0,
  division: number = 1
): { notes: ExpectedNote[]; fingering: number[] } {
  const dur = Q / division;
  return {
    notes: midis.map((midi, i) => ({
      midi,
      startMs: (startBeat + i / division) * Q,
      endMs: (startBeat + i / division) * Q + dur * 0.9,
    })),
    fingering,
  };
}

// Measure data keyed by measure ID from the Mozart tables.
// These are sample measures for a subset of IDs that appear in the minuet table.
const data: Record<number, MeasureData> = {
  // Bar patterns from the minuet table — C major, 3/4 time
  96: {
    ...(() => {
      const rh = notes([72, 74, 76, 77, 79, 72], [1, 2, 3, 4, 5, 1], 0, 2);
      return {
        rightHand: rh.notes,
        fingeringRight: rh.fingering,
      };
    })(),
    leftHand: notes([48, 52, 55], [5, 3, 1], 0).notes,
    harmonicFunction: "I",
    teachingText: "Tonic arpeggio in C major. The right hand climbs a scale fragment while the left anchors on the root chord.",
  },
  32: {
    ...(() => {
      const rh = notes([76, 74, 72, 71, 72], [3, 2, 1, 2, 1], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([55, 52, 48], [1, 3, 5], 0).notes,
    harmonicFunction: "V - I",
    teachingText: "Descending stepwise motion resolving to the tonic. The left hand mirrors with a descending bass.",
  },
  69: {
    ...(() => {
      const rh = notes([79, 77, 76, 74, 72], [5, 4, 3, 2, 1], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([55, 59, 55], [1, 3, 1], 0).notes,
    harmonicFunction: "V",
    teachingText: "Dominant function — the G in the bass creates tension that wants to resolve back to C.",
  },
  40: {
    ...(() => {
      const rh = notes([72, 76, 79], [1, 3, 5], 0);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([48, 48, 48], [5, 5, 5], 0).notes,
    harmonicFunction: "I",
    teachingText: "Simple C major arpeggio. Feel the hand shape — this is the 'home' position.",
  },
  141: {
    ...(() => {
      const rh = notes([77, 76, 74, 76], [4, 3, 2, 3], 0, 1.5);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([53, 48, 52], [2, 5, 3], 0).notes,
    harmonicFunction: "IV",
    teachingText: "Subdominant (F major) gives a 'floating' feeling before returning to the tonic.",
  },
  104: {
    ...(() => {
      const rh = notes([74, 72, 71, 72, 74, 76], [2, 1, 1, 1, 2, 3], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([50, 55, 50], [4, 1, 4], 0).notes,
    harmonicFunction: "ii",
    teachingText: "D minor color — the ii chord adds sophistication. Notice how it pulls toward V.",
  },
  152: {
    ...(() => {
      const rh = notes([76, 79, 83, 79, 76, 72], [1, 3, 5, 3, 1, 1], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([48, 52, 55], [5, 3, 1], 0).notes,
    harmonicFunction: "I",
    teachingText: "Rising and falling arpeggio. Keep the hand relaxed — let gravity help on the way down.",
  },
  119: {
    ...(() => {
      const rh = notes([71, 72, 74, 76, 77, 79], [1, 1, 2, 3, 4, 5], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([55, 52, 48], [1, 3, 5], 0).notes,
    harmonicFunction: "V - I",
    teachingText: "Leading tone (B) resolves up to C. This is the strongest pull in tonal music.",
  },
  78: {
    ...(() => {
      const rh = notes([72, 72, 74], [1, 1, 2], 0);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([48, 55, 52], [5, 1, 3], 0).notes,
    harmonicFunction: "I",
    teachingText: "Simple repeated tonic — a moment of stability in the phrase.",
  },
  29: {
    ...(() => {
      const rh = notes([76, 74, 76, 79, 76, 74], [3, 2, 3, 5, 3, 2], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([52, 48, 55], [3, 5, 1], 0).notes,
    harmonicFunction: "I - V",
    teachingText: "Neighbor tone ornament around E. The melody decorates the third of the chord.",
  },
  127: {
    ...(() => {
      const rh = notes([79, 77, 76, 74, 72, 71], [5, 4, 3, 2, 1, 1], 0, 2);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([55, 55, 48], [1, 1, 5], 0).notes,
    harmonicFunction: "V - I",
    teachingText: "Full descending scale from G to B resolving to C. Classic cadential figure.",
  },
  1: {
    ...(() => {
      const rh = notes([72, 74, 76], [1, 2, 3], 0);
      return { rightHand: rh.notes, fingeringRight: rh.fingering };
    })(),
    leftHand: notes([48, 52, 55], [5, 3, 1], 0).notes,
    harmonicFunction: "I",
    teachingText: "Opening C major triad. Set your hand shape here — this is your foundation.",
  },
};

export function getMeasureData(measureId: number): MeasureData | null {
  return data[measureId] ?? null;
}

export const availableMeasureIds = Object.keys(data).map(Number);
