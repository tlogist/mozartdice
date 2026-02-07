"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface MidiInputState {
  pressedNotes: Set<number>;
  isConnected: boolean;
}

export function useMidiInput(): MidiInputState {
  const [pressedNotes, setPressedNotes] = useState<Set<number>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const pressedRef = useRef<Set<number>>(new Set());
  const accessRef = useRef<MIDIAccess | null>(null);

  const handleMidiMessage = useCallback((event: MIDIMessageEvent) => {
    const data = event.data;
    if (!data || data.length < 3) return;

    const status = data[0] & 0xf0;
    const note = data[1];
    const velocity = data[2];

    if (status === 0x90 && velocity > 0) {
      // Note On
      pressedRef.current = new Set(pressedRef.current);
      pressedRef.current.add(note);
      setPressedNotes(pressedRef.current);
    } else if (status === 0x80 || (status === 0x90 && velocity === 0)) {
      // Note Off
      pressedRef.current = new Set(pressedRef.current);
      pressedRef.current.delete(note);
      setPressedNotes(pressedRef.current);
    }
  }, []);

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

  useEffect(() => {
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
