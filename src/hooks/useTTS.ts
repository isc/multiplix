import { useCallback, useRef, useEffect, useState } from 'react';

const BASE = import.meta.env.BASE_URL;

export function useTTS(isMuted: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(isMuted);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    mutedRef.current = isMuted;
    if (isMuted && audioRef.current) {
      const audio = audioRef.current;
      audio.pause();
      audio.currentTime = 0;
      audioRef.current = null;
    }
  }, [isMuted]);

  // onEnd fires only on natural end — not on interrupt, pause, or mute.
  const speak = useCallback((key: string, onEnd?: () => void) => {
    if (mutedRef.current) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`${BASE}audio/tts/${key}.mp3`);
    audioRef.current = audio;
    setIsSpeaking(true);
    const clearIfCurrent = () => {
      if (audioRef.current === audio) {
        setIsSpeaking(false);
      }
    };
    audio.addEventListener('ended', () => {
      clearIfCurrent();
      if (audioRef.current === audio && onEnd) onEnd();
    }, { once: true });
    audio.addEventListener('error', clearIfCurrent, { once: true });
    audio.addEventListener('pause', clearIfCurrent, { once: true });
    audio.play().catch(() => {
      clearIfCurrent();
    });
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { speak, stop, isSpeaking };
}
