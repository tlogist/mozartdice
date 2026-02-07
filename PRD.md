# 🎹 Product Requirements Document  
## Mozart Dice → Agitato Piano Tutor

---

## Product Name (working)

**Dice & Discipline**  
_Subtitle: From Mozart’s Order to Beethoven’s Agitation_

---

## 1. Purpose & Vision

### Purpose

Build a piano-learning application that uses Mozart’s dice game principles to teach:

- harmonic literacy  
- pattern recognition  
- motor control  
- endurance under motion  

The app is **not** a song-learning tool.  
It is a **systems-based musical training environment** designed especially for analytical / technical learners.

### Long-Term Vision

Guide users from:

- structured classical harmony (Mozart)  
→ to  
- perpetual-motion intensity (Beethoven Moonlight 3 / agitato textures)

without brute-force repetition or romantic mysticism.

---

## 2. Target Users

### Primary

- Adults with technical / computational backgrounds  
- Beginners or late starters at piano  
- Users who value clear rules, visible structure, and progress metrics  

### Secondary

- Expressive musicians using the app as a pattern + endurance trainer  
- Composers interested in generative / algorithmic music  

---

## 3. Core Principles (Non-Negotiable)

1. Systems over songs  
2. Patterns over notes  
3. Visual + motor feedback always  
4. Tempo is locked until mastery  
5. Dice = motivation, not chaos  
6. Left hand is an engine  
7. Right hand is hierarchy (signal vs filler)  

---

## 4. Core Modes

### 4.1 Mozart Dice Mode (Foundational)

**Goal:** Harmonic literacy + phrase logic

#### Functionality

- Generate a 16-bar minuet using:
  - 2d6 dice
  - bar-indexed lookup tables (bar 1–16 × dice sum 2–12)
- Optional Trio generation
- Measures are modular assets (initially placeholders)

#### User Flow

1. User clicks **“Roll Dice”**  
2. Dice animate → sums displayed  
3. App selects measure IDs per bar  
4. Grid displays bars 1–16 with IDs  
5. User selects any bar to:
   - loop  
   - slow-play  
   - inspect  

#### Teaching Overlay (per bar)

- Hand shape (not individual notes first)  
- Chord / function label (plain language)  
- “Why this works” (1–2 sentences max)  

---

### 4.2 Practice Mode (Measure-Level Learning)

**Goal:** Transfer patterns into hands

#### Features

- Loop single measure  
- Loop 2-bar phrase  
- Tempo slider (locked ceiling)  
- Visual keyboard highlighting  
- Finger numbers prioritized over note names  

#### Mastery Rules

- Tempo unlocks only after:
  - X perfect repetitions  
  - no missed notes  
  - steady timing  

---

### 4.3 Agitato Engine Mode (Beethoven Prep)

**Goal:** Build Moonlight 3rd movement mechanics without learning the piece

#### Key Difference

Dice no longer select measures — they select **pattern mutations**.

#### Dice-Controlled Parameters

- Arpeggio inversion  
- Hand displacement  
- Accent shift  
- Rhythmic density  
- Register expansion  

#### Output

- Infinite Beethoven-like perpetual motion  
- No melody labeling  
- No composer references in UI  

---

## 5. Learning Progression (Built-In)

### Phase 1 (Weeks 1–4)

- Mozart Dice Mode  
- Single-measure mastery  
- Hands separate → hands together  
- Slow tempo only  

### Phase 2 (Weeks 5–8)

- Phrase chaining  
- Early Agitato Mode (slow)  
- Left-hand endurance patterns  

### Phase 3 (Months 3–6)

- Full Agitato Engine  
- Tempo endurance  
- Controlled intensity  

Moonlight 3 becomes **inevitable**, not aspirational.

---

## 6. Functional Requirements

### Must-Have (v1)

- Dice rolling (2d6)  
- Deterministic lookup tables  
- Measure grid UI  
- Looping playback  
- Tempo control  
- Visual keyboard  
- Pattern-focused teaching text  
- Modular data architecture  

### Nice-to-Have (v2)

- MIDI keyboard input detection  
- Performance scoring  
- Practice streaks  
- Export generated score (PDF / MIDI)  
- Custom dice weighting  

---

## 7. Data Model (High-Level)

```ts
Measure {
  id: string
  type: "mozart" | "agitato"
  rightHandPattern: Pattern
  leftHandPattern: Pattern
  harmonicFunction: string
  difficulty: number
}

Pattern {
  notes: number[] | intervals[]
  fingering: number[]
  shapeId: string
}
```

Tables:
- `mozartMinuetTable[16][11]`
- `mozartTrioTable[16][11]`
- `agitatoPatternTable`

---

## 8. Technical Stack (Recommended)

- Frontend: Next.js (React)
- Audio: Tone.js or WebAudio MIDI
- Notation (later): MusicXML + OpenSheetMusicDisplay
- State: Zustand or Redux
- Repo: Single mono-repo shared by Claude + Codex

---

## 10. Explicit Non-Goals

- Teaching pop songs
- Teaching sight-reading first
- Teaching theory vocabulary early
- Gamification via points/XP
- Romantic or motivational fluff

---

## 11. Success Metrics

- User can play:
  - calm arpeggios at speed
  - with relaxed hands
  - without panic
- User understands why music resolves
- User wants to practice again

---

## 12. Guiding Sentence (for the repo README)

“This app does not teach pieces.
It teaches the engines that make pieces inevitable.”
