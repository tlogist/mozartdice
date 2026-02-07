/**
 * Simple piano-like synthesizer using Web Audio API.
 * 3 oscillators per voice with ADSR envelope, velocity sensitivity,
 * and a DynamicsCompressor to prevent clipping on chords.
 */

interface Voice {
  oscillators: OscillatorNode[];
  gains: GainNode[];
  envelope: GainNode;
}

const ATTACK = 0.005; // 5ms
const DECAY = 0.3; // 300ms
const SUSTAIN = 0.4; // 40% of peak
const RELEASE = 0.8; // 800ms

function midiToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export class PianoSynth {
  private ctx: AudioContext | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private voices: Map<number, Voice> = new Map();

  private ensureContext(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;
      this.compressor.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
    return this.ctx;
  }

  noteOn(note: number, velocity: number): void {
    const ctx = this.ensureContext();
    const now = ctx.currentTime;

    // Kill existing voice on this note (retrigger)
    this.killVoice(note, now);

    const freq = midiToFreq(note);
    const amplitude = (velocity / 127) * 0.6;

    // Envelope gain node
    const envelope = ctx.createGain();
    envelope.gain.setValueAtTime(0, now);
    envelope.gain.linearRampToValueAtTime(amplitude, now + ATTACK);
    envelope.gain.linearRampToValueAtTime(amplitude * SUSTAIN, now + ATTACK + DECAY);
    envelope.connect(this.compressor!);

    // Oscillator 1: triangle fundamental
    const osc1 = ctx.createOscillator();
    osc1.type = "triangle";
    osc1.frequency.value = freq;
    const g1 = ctx.createGain();
    g1.gain.value = 0.6;
    osc1.connect(g1).connect(envelope);

    // Oscillator 2: detuned triangle for warmth
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = freq;
    osc2.detune.value = 6;
    const g2 = ctx.createGain();
    g2.gain.value = 0.3;
    osc2.connect(g2).connect(envelope);

    // Oscillator 3: sine at 2x freq (octave harmonic)
    const osc3 = ctx.createOscillator();
    osc3.type = "sine";
    osc3.frequency.value = freq * 2;
    const g3 = ctx.createGain();
    g3.gain.value = 0.1;
    osc3.connect(g3).connect(envelope);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    this.voices.set(note, {
      oscillators: [osc1, osc2, osc3],
      gains: [g1, g2, g3],
      envelope,
    });
  }

  noteOff(note: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.releaseVoice(note, now);
  }

  private killVoice(note: number, now: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(0, now);
    voice.oscillators.forEach((osc) => {
      try { osc.stop(now + 0.01); } catch { /* already stopped */ }
    });
    this.voices.delete(note);
  }

  private releaseVoice(note: number, now: number): void {
    const voice = this.voices.get(note);
    if (!voice) return;
    const current = voice.envelope.gain.value;
    voice.envelope.gain.cancelScheduledValues(now);
    voice.envelope.gain.setValueAtTime(current, now);
    voice.envelope.gain.linearRampToValueAtTime(0, now + RELEASE);
    voice.oscillators.forEach((osc) => {
      try { osc.stop(now + RELEASE + 0.05); } catch { /* already stopped */ }
    });
    this.voices.delete(note);
  }

  dispose(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.voices.forEach((_, note) => this.killVoice(note, now));
    this.ctx.close();
    this.ctx = null;
    this.compressor = null;
  }
}
