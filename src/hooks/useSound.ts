import { useState, useCallback } from 'react';
import { getAudioContext } from '../lib/audioContext';

const STORAGE_KEY = 'multiplix-muted';

// Note frequencies (Hz)
const NOTE = {
  C4: 261.63,
  C5: 523.25,
  E5: 659.25,
  G5: 783.99,
  C6: 1046.50,
  D6: 1174.66,
  E6: 1318.51,
} as const;

function getInitialMuted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function useSound() {
  const [isMuted, setIsMuted] = useState(getInitialMuted);

  const playNote = useCallback(
    (
      ctx: AudioContext,
      frequency: number,
      startTime: number,
      duration: number,
      volume: number,
      type: OscillatorType = 'triangle',
    ) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, startTime);

      // Smooth envelope to avoid clicks
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
      gainNode.gain.setValueAtTime(volume, startTime + duration - 0.02);
      gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    },
    [],
  );

  const playCorrect = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 0.1;
    const volume = 0.15;

    // Quick ascending notes: C5 -> E5 -> G5 (happy xylophone feel)
    playNote(ctx, NOTE.C5, now, noteDuration, volume, 'triangle');
    playNote(ctx, NOTE.E5, now + noteDuration, noteDuration, volume, 'triangle');
    playNote(ctx, NOTE.G5, now + noteDuration * 2, noteDuration * 1.5, volume, 'triangle');
  }, [isMuted, playNote]);

  const playIncorrect = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // Single soft low tone: C4, 200ms, low volume -- gentle, not a buzzer
    playNote(ctx, NOTE.C4, now, 0.2, 0.08, 'sine');
  }, [isMuted, playNote]);

  const playBadge = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 0.1;
    const volume = 0.18;

    // Ascending arpeggio: C5 -> E5 -> G5 -> C6 (little fanfare)
    playNote(ctx, NOTE.C5, now, noteDuration, volume, 'triangle');
    playNote(ctx, NOTE.E5, now + noteDuration, noteDuration, volume, 'triangle');
    playNote(ctx, NOTE.G5, now + noteDuration * 2, noteDuration, volume, 'triangle');
    playNote(ctx, NOTE.C6, now + noteDuration * 3, noteDuration * 2, volume, 'triangle');
  }, [isMuted, playNote]);

  const playTableComplete = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 0.12;
    const volume = 0.18;

    // Longer ascending melody: C5 -> E5 -> G5 -> C6 -> D6 -> E6 -> C6 (table complete)
    const notes = [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6, NOTE.D6, NOTE.E6, NOTE.C6];
    notes.forEach((freq, i) => {
      const isLast = i === notes.length - 1;
      const dur = isLast ? noteDuration * 3 : noteDuration;
      playNote(ctx, freq, now + i * noteDuration, dur, volume, 'triangle');
    });
  }, [isMuted, playNote]);

  // Fuller completion melody for when the whole mystery image is revealed
  // (all 36 facts reach box 5). Played on the final table-complete event
  // that flips the last fact, via the RecapScreen.
  const playImageComplete = useCallback(() => {
    if (isMuted) return;
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const noteDuration = 0.15;
    const volume = 0.2;

    // Two ascending arpeggios ending on a held high note
    const notes = [
      NOTE.C5, NOTE.E5, NOTE.G5, NOTE.C6,
      NOTE.E6, NOTE.G5, NOTE.C6, NOTE.E6,
    ];
    notes.forEach((freq, i) => {
      const isLast = i === notes.length - 1;
      const dur = isLast ? noteDuration * 4 : noteDuration;
      playNote(ctx, freq, now + i * noteDuration, dur, volume, 'triangle');
    });
  }, [isMuted, playNote]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // localStorage might be full or unavailable
      }
      return next;
    });
  }, []);

  return {
    isMuted,
    toggleMute,
    playCorrect,
    playIncorrect,
    playBadge,
    playTableComplete,
    playImageComplete,
  };
}
