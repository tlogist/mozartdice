/**
 * Sample-based piano using Salamander Grand Piano recordings (Yamaha C5).
 * Downloads samples from the Tone.js CDN and caches them via the Cache API
 * so subsequent visits load instantly from disk.
 */

const BASE_URL = "https://tonejs.github.io/audio/salamander/";
const CACHE_NAME = "salamander-piano-v1";

// Samples to load — every minor 3rd from A1 to Ds6 (covers our C2–C6 range
// with enough headroom for pitch-shifting at the edges).
// Format: [noteName for URL, MIDI note number]
const SAMPLE_MAP: [string, number][] = [
  ["A1", 33],
  ["C2", 36],
  ["Ds2", 39],
  ["Fs2", 42],
  ["A2", 45],
  ["C3", 48],
  ["Ds3", 51],
  ["Fs3", 54],
  ["A3", 57],
  ["C4", 60],
  ["Ds4", 63],
  ["Fs4", 66],
  ["A4", 69],
  ["C5", 72],
  ["Ds5", 75],
  ["Fs5", 78],
  ["A5", 81],
  ["C6", 84],
  ["Ds6", 87],
];

// Pre-sorted MIDI note numbers of available samples (for binary search)
const SAMPLE_NOTES = SAMPLE_MAP.map(([, midi]) => midi);

interface Voice {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

function findNearestSampleNote(midiNote: number): number {
  let lo = 0;
  let hi = SAMPLE_NOTES.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (SAMPLE_NOTES[mid] < midiNote) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }
  // lo is the first sample >= midiNote; check if lo-1 is closer
  if (lo > 0) {
    const diffLo = Math.abs(SAMPLE_NOTES[lo] - midiNote);
    const diffPrev = Math.abs(SAMPLE_NOTES[lo - 1] - midiNote);
    if (diffPrev < diffLo) return SAMPLE_NOTES[lo - 1];
  }
  return SAMPLE_NOTES[lo];
}

export class SampledPiano {
  private buffers: Map<number, AudioBuffer> = new Map();
  private voices: Map<number, Voice> = new Map();
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private _isLoaded = false;

  get isLoaded(): boolean {
    return this._isLoaded;
  }

  /**
   * Download (or retrieve from cache) and decode all piano samples.
   * Call once after AudioContext is created.
   */
  async load(ctx: AudioContext): Promise<void> {
    if (this._isLoaded) return;
    this.ctx = ctx;

    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -24;
    this.compressor.knee.value = 30;
    this.compressor.ratio.value = 12;
    this.compressor.attack.value = 0.003;
    this.compressor.release.value = 0.25;
    this.compressor.connect(ctx.destination);

    const cache =
      typeof caches !== "undefined" ? await caches.open(CACHE_NAME) : null;

    await Promise.all(
      SAMPLE_MAP.map(async ([name, midi]) => {
        const url = `${BASE_URL}${name}.mp3`;
        let arrayBuffer: ArrayBuffer;

        if (cache) {
          const cached = await cache.match(url);
          if (cached) {
            arrayBuffer = await cached.arrayBuffer();
          } else {
            const response = await fetch(url);
            await cache.put(url, response.clone());
            arrayBuffer = await response.arrayBuffer();
          }
        } else {
          const response = await fetch(url);
          arrayBuffer = await response.arrayBuffer();
        }

        const audioBuffer = await ctx.decodeAudioData(arrayBuffer);
        this.buffers.set(midi, audioBuffer);
      })
    );

    this._isLoaded = true;
  }

  noteOn(note: number, velocity: number): void {
    if (!this.ctx || !this.compressor || !this._isLoaded) return;
    const ctx = this.ctx;
    const now = ctx.currentTime;

    // Kill existing voice on retrigger
    this.killVoice(note, now);

    const sampleNote = findNearestSampleNote(note);
    const buffer = this.buffers.get(sampleNote);
    if (!buffer) return;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    // Pitch-shift: semitone difference → playback rate
    source.playbackRate.value = Math.pow(2, (note - sampleNote) / 12);

    const gain = ctx.createGain();
    gain.gain.value = (velocity / 127) * 0.8;

    source.connect(gain).connect(this.compressor);
    source.start(now);

    this.voices.set(note, { source, gain });
  }

  noteOff(note: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.releaseVoice(note, now);
  }

  private killVoice(note: number, now: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(0, now);
    try {
      voice.source.stop(now + 0.01);
    } catch {
      /* already stopped */
    }
    this.voices.delete(note);
  }

  private releaseVoice(note: number, now: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    const current = voice.gain.gain.value;
    voice.gain.gain.cancelScheduledValues(now);
    voice.gain.gain.setValueAtTime(current, now);
    voice.gain.gain.linearRampToValueAtTime(0, now + 0.5);
    try {
      voice.source.stop(now + 0.55);
    } catch {
      /* already stopped */
    }
    this.voices.delete(note);
  }

  dispose(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.voices.forEach((_, note) => this.killVoice(note, now));
    this.buffers.clear();
    this.compressor = null;
    this.ctx = null;
    this._isLoaded = false;
  }
}
