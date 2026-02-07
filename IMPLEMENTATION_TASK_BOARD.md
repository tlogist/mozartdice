# Dice & Discipline - Implementation Task Board

Status legend: `[ ]` not started, `[~]` in progress, `[x]` done, `[!]` blocked

## 0) Review Gate (Do before implementation)

- [ ] Approve this task board structure and scope
- [ ] Confirm naming conventions for new files/folders
- [ ] Confirm testing baseline (Vitest/Jest, RTL, Playwright)
- [ ] Confirm whether to add feature flags for unfinished modes

## 1) Foundations: Domain + Contracts

### 1.1 Core Types

- [ ] Create `/lib/domain/types.ts` with:
  - [ ] `Measure`
  - [ ] `Pattern`
  - [ ] `ExpectedNote`
  - [ ] `Exercise`
  - [ ] `PracticeResult`
  - [ ] `DiceRoll`
- [ ] Add `Readonly`-friendly and serializable type shapes
- [ ] Add concise type-level docs/comments for each exported type

### 1.2 Shared Utilities

- [ ] Create `/lib/domain/time.ts` for app time helpers (`performance.now` wrapper)
- [ ] Create `/lib/domain/ids.ts` for deterministic IDs where needed
- [ ] Create `/lib/domain/validation.ts` for lightweight invariant checks

### 1.3 Tests

- [ ] Add unit tests for domain validators and utilities
- [ ] Add fixture data for measures/patterns in `/test/fixtures/`

## 2) Mozart Dice Engine (Deterministic)

### 2.1 Data Tables

- [ ] Create `/lib/mozart/mozartTables.ts`
- [ ] Add `mozartMinuetTable[16][11]`
- [ ] Add `mozartTrioTable[16][11]`
- [ ] Encode mapping comments (bar 1-16, dice sum 2-12 => index 0-10)

### 2.2 Generator

- [ ] Create `/lib/mozart/generateMinuet.ts`
- [ ] Implement 2d6 roll input contract
- [ ] Map dice sums to measure IDs deterministically
- [ ] Return normalized `Exercise` + `ExpectedNote[]` output contract

### 2.3 Tests

- [ ] Unit test table index conversion (`sum -> index`)
- [ ] Unit test deterministic output for fixed dice rolls
- [ ] Unit test invalid dice input handling

## 3) Agitato Engine (Pattern Mutation)

### 3.1 Pattern Table

- [ ] Create `/lib/agitato/agitatoPatternTable.ts`
- [ ] Add initial mutation descriptors:
  - [ ] inversion
  - [ ] displacement
  - [ ] accent shift
  - [ ] density
  - [ ] register expansion

### 3.2 Generator

- [ ] Create `/lib/agitato/generateAgitato.ts`
- [ ] Implement dice-driven mutation selection (deterministic)
- [ ] Output `Exercise` + `ExpectedNote[]` in same shape as Mozart mode

### 3.3 Tests

- [ ] Unit test mutation selection determinism
- [ ] Unit test boundaries for density/register
- [ ] Unit test output contract parity with Mozart generator

## 4) MIDI Integration (Feature PRD Scope)

### 4.1 MIDI Core

- [ ] Create `/lib/midi/midiTypes.ts`
- [ ] Create `/lib/midi/midiUtils.ts`
- [ ] Create `/lib/midi/midiManager.ts`
- [ ] Implement `navigator.requestMIDIAccess()` flow
- [ ] Enumerate and normalize input devices
- [ ] Parse note-on/note-off + velocity
- [ ] Parse sustain pedal (`CC 64`)

### 4.2 MIDI State

- [ ] Create `/state/midiStore.ts`
- [ ] Store:
  - [ ] `connected`
  - [ ] `availableInputs`
  - [ ] `selectedInputId`
  - [ ] `activeNotes` (Set<number> or serializable equivalent)
  - [ ] note velocity map
  - [ ] sustain state
  - [ ] `lastNoteOn`

### 4.3 Hook API

- [ ] Create `/hooks/useMidiInput.ts`
- [ ] Expose API contract:
  - [ ] `connected`
  - [ ] `availableInputs`
  - [ ] `selectedInputId`
  - [ ] `activeNotes`
  - [ ] `lastNoteOn`
  - [ ] `enableMidi()`
  - [ ] `selectInput()`
- [ ] Ensure proper cleanup of listeners on unmount/switch

### 4.4 Tests

- [ ] Unit test MIDI message parsing
- [ ] Hook test for connect/select lifecycle
- [ ] Hook test for note-on/off state transitions

## 5) Visual Keyboard

### 5.1 Components

- [ ] Create `/components/Keyboard/PianoKey.tsx`
- [ ] Create `/components/Keyboard/PianoKeyboard.tsx`
- [ ] Create `/components/Keyboard/keyboardUtils.ts`
- [ ] Render MIDI range `36-96` by default
- [ ] Support key states:
  - [ ] idle
  - [ ] pressed
  - [ ] expected

### 5.2 Expected Notes

- [ ] Add prop contract:
  - [ ] `activeNotes`
  - [ ] `expectedNotes?`
  - [ ] `lowestMidi?`
  - [ ] `highestMidi?`
- [ ] Implement ghost highlight before `startMs`
- [ ] Use `performance.now()` timing path

### 5.3 Tests

- [ ] Component test for pressed highlighting
- [ ] Component test for expected highlight
- [ ] Component test for ghost pre-highlight timing behavior

## 6) Practice Mode MVP

### 6.1 Playback + Looping

- [ ] Add single-measure loop
- [ ] Add 2-bar phrase loop
- [ ] Integrate expected-note timeline with keyboard rendering

### 6.2 Tempo Lock Rules

- [ ] Implement locked tempo ceiling
- [ ] Unlock only after:
  - [ ] X perfect reps
  - [ ] no misses
  - [ ] timing stability threshold
- [ ] Keep rule parameters configurable in one file

### 6.3 UI

- [ ] Add tempo slider with lock indicator
- [ ] Add loop controls
- [ ] Add mode status (hands separate / together if applicable)

### 6.4 Tests

- [ ] Unit test tempo unlock rules
- [ ] Integration test loop + expected notes + active notes pipeline

## 7) Mozart Dice Mode UI

### 7.1 Dice + Grid

- [ ] Add "Roll Dice" action
- [ ] Add dice animation + displayed sums
- [ ] Render bars 1-16 grid with selected measure IDs

### 7.2 Bar Interaction

- [ ] Click bar => loop / slow-play / inspect actions
- [ ] Connect selected bar(s) to Practice Mode pipeline

### 7.3 Teaching Overlay

- [ ] Hand shape hint
- [ ] Harmonic function label
- [ ] "Why this works" short explanation

### 7.4 Tests

- [ ] Integration test fixed dice rolls => stable grid output
- [ ] Integration test bar selection updates practice target

## 8) Agitato Engine Mode UI

- [ ] Add dice-driven mutation controls
- [ ] Display current mutation parameters
- [ ] Stream generated expected notes into Practice pipeline
- [ ] Ensure no direct composer/piece labeling in UI
- [ ] Integration test continuity and bounded parameter behavior

## 9) Observability + Future Scoring Hooks

- [ ] Create event log shape for note events:
  - [ ] timestamp (`performance.now()`)
  - [ ] midi note
  - [ ] velocity
  - [ ] note-on/off
- [ ] Add expected-vs-actual alignment helper API (no scoring)
- [ ] Add session replay fixture format

## 10) QA, Hardening, and Docs

### 10.1 Cross-Browser Constraints

- [ ] Verify on desktop Chrome
- [ ] Verify on desktop Edge
- [ ] Show explicit unsupported message for non-Web-MIDI browsers

### 10.2 Reliability

- [ ] Handle device hot-plug/disconnect gracefully
- [ ] Handle "note-on with velocity 0" as note-off
- [ ] Prevent stuck notes on input switch/disconnect

### 10.3 Developer Docs

- [ ] Add setup docs for MIDI permissions/browser constraints
- [ ] Add architecture diagram + data flow summary
- [ ] Add contribution notes for extending generators

## 11) Release Slices (Ship Order)

- [ ] Slice A: Domain + Mozart deterministic engine + tests
- [ ] Slice B: MIDI core + hook + live visual keyboard
- [ ] Slice C: Expected notes + Practice loop + tempo lock
- [ ] Slice D: Mozart mode UI integration
- [ ] Slice E: Agitato mode integration

## 12) Acceptance Criteria (MVP)

- [ ] User can enable MIDI and select a USB keyboard
- [ ] Pressed keys on physical keyboard highlight instantly in UI
- [ ] Expected notes render and ghost-highlight before start
- [ ] Practice loop runs with deterministic expected note data
- [ ] Mozart dice generation is deterministic and test-covered
- [ ] Code is modular with clean boundaries between:
  - [ ] generator logic
  - [ ] MIDI I/O
  - [ ] rendering
  - [ ] state
