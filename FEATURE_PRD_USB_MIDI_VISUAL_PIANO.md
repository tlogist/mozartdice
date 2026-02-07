# Feature PRD: USB MIDI + Visual Piano Integration

## Context

You are working in an existing Next.js (React, TypeScript) monorepo for a piano-learning app called “Dice & Discipline”.

This feature implements USB MIDI keyboard input and a visual piano keyboard that integrates with the app’s practice and dice-generated exercises.

## Goals

1. Detect and connect to USB MIDI keyboards via the Web MIDI API.
2. Visually render a piano keyboard in React.
3. Highlight keys in real time when the user presses keys on their physical keyboard.
4. Support “expected notes” highlighting for practice mode (target notes).
5. Expose clean, modular APIs so other parts of the app can score accuracy later.

## Constraints

- Desktop Chrome / Edge only (Web MIDI).
- No mobile support required.
- No external MIDI libraries; use the Web MIDI API directly.
- Keep logic deterministic and readable.
- Prioritize modularity over cleverness.

## Architecture Requirements

Create the following structure:

```txt
/lib/midi/
  midiManager.ts
  midiTypes.ts
  midiUtils.ts

/hooks/
  useMidiInput.ts

/components/Keyboard/
  PianoKeyboard.tsx
  PianoKey.tsx
  keyboardUtils.ts

/state/
  midiStore.ts
```

## Functional Requirements

### 1) MIDI Connection

- Add an “Enable MIDI” button.
- Request MIDI access via `navigator.requestMIDIAccess()`.
- Enumerate available MIDI input devices.
- Allow selecting an active input device.
- Show connection status.

### 2) MIDI Event Handling

- Listen for note-on and note-off messages.
- Track currently pressed notes as a `Set<number>`.
- Track velocity per note.
- Expose sustain pedal (`CC 64`) state if available.

### 3) Visual Keyboard

- Render a piano keyboard covering MIDI notes `36–96`.
- Keys support:
  - Idle
  - Pressed
  - Expected

### 4) Expected Notes Support

`PianoKeyboard` accepts:

```ts
expectedNotes: Array<{ midi: number; startMs: number; endMs: number }>
```

Ghost-highlight expected notes before `startMs`.

### 5) Timing

- Use `performance.now()`.
- Design APIs for future scoring.

## API Contracts

### `useMidiInput()`

- `connected`
- `availableInputs`
- `selectedInputId`
- `activeNotes`
- `lastNoteOn`
- `enableMidi()`
- `selectInput()`

### `PianoKeyboard` props

- `activeNotes`
- `expectedNotes?`
- `lowestMidi?`
- `highestMidi?`

## Non-Goals

- No sound synthesis
- No scoring logic
- No MusicXML rendering

## Deliverables

- Working MIDI detection
- Live keyboard visualization
- Clean separation of concerns
- Clear inline comments
