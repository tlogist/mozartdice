"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface MidiCallbacks {
  onNoteOn?: (note: number, velocity: number) => void;
  onNoteOff?: (note: number) => void;
}

export interface MidiInputState {
  pressedNotes: Set<number>;
  isConnected: boolean;
}

/** Detect if running inside Tauri */
function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export function useMidiInput(callbacks?: MidiCallbacks): MidiInputState {
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const pressedRef = useRef<Set<number>>(new Set());
  const accessRef = useRef<MIDIAccess | null>(null);
  const callbacksRef = useRef<MidiCallbacks | undefined>(callbacks);
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const handleNoteOn = useCallback((note: number, velocity: number) => {
    callbacksRef.current?.onNoteOn?.(note, velocity);
    pressedRef.current = new Set(pressedRef.current);
    pressedRef.current.add(note);
    setPressedNotes(pressedRef.current);
  }, []);

  const handleNoteOff = useCallback((note: number) => {
    callbacksRef.current?.onNoteOff?.(note);
    pressedRef.current = new Set(pressedRef.current);
    pressedRef.current.delete(note);
    setPressedNotes(pressedRef.current);
  }, []);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;
    const note = data[1];
    const velocity = data[2];

    if (status === 0x90 && velocity > 0) {
      handleNoteOn(note, velocity);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      handleNoteOff(note);
    }
  }, [handleNoteOn, handleNoteOff]);

  const attachListeners = useCallback(
    (access: MIDIAccess) => {
      let hasInput = false;
      access.inputs.forEach((input) => {
        input.onmidimessage = handleMidiMessage;
        hasInput = true;
      });
      setIsConnected(hasInput);
    },
    [handleMidiMessage],
  );

  // Tauri MIDI path — listen for events from Rust backend
  useEffect(() => {
    if (!isTauri()) return;

    let cancelled = false;
    const unlisten: Array<() => void> = [];

    async function setup() {
      const [{ listen }, { invoke }] = await Promise.all([
        import("@tauri-apps/api/event"),
        import("@tauri-apps/api/core"),
      ]);

      if (cancelled) return;

      const u1 = await listen<{ note: number; velocity: number }>(
        "midi:note-on",
        (event) => {
          handleNoteOn(event.payload.note, event.payload.velocity);
        },
      );
      unlisten.push(u1);

      const u2 = await listen<{ note: number }>(
        "midi:note-off",
        (event) => {
          handleNoteOff(event.payload.note);
        },
      );
      unlisten.push(u2);

      const u3 = await listen<{ connected: boolean; port_name: string | null }>(
        "midi:connection",
        (event) => {
          setIsConnected(event.payload.connected);
        },
      );
      unlisten.push(u3);

      try {
        const status = await invoke<{ connected: boolean; port_name: string | null }>("midi_status");
        if (!cancelled) {
          setIsConnected(status.connected);
        }
      } catch {
        // Best-effort status sync; connection events will still update state.
      }
    }

    setup();

    return () => {
      cancelled = true;
      unlisten.forEach((fn) => fn());
    };
  }, [handleNoteOn, handleNoteOff]);

  // Web MIDI API path — used in browser (Chrome)
  useEffect(() => {
    if (isTauri()) return;
    if (typeof navigator === "undefined" || !navigator.requestMIDIAccess) {
      return;
    }

    let cancelled = false;

    navigator.requestMIDIAccess().then(
      (access) => {
        if (cancelled) return;
        accessRef.current = access;
        attachListeners(access);

        access.onstatechange = () => {
          attachListeners(access);
        };
      },
      () => {
        // MIDI access denied or unavailable
      },
    );

    return () => {
      cancelled = true;
      if (accessRef.current) {
        accessRef.current.inputs.forEach((input) => {
          input.onmidimessage = null;
        });
        accessRef.current.onstatechange = null;
      }
    };
  }, [attachListeners]);

  return { pressedNotes, isConnected };
}
