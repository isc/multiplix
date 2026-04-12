import { useCallback, useRef, useEffect } from 'react';

const BASE = import.meta.env.BASE_URL;

export function useTTS(isMuted: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mutedRef = useRef(isMuted);

  useEffect(() => {
    mutedRef.current = isMuted;
    if (isMuted && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [isMuted]);

  // speak() takes an audio key (e.g. "q-3-7", "intro-2-5", "welcome-hello")
  // and plays the corresponding pre-generated file from public/audio/tts/.
  const speak = useCallback((key: string) => {
    if (mutedRef.current) return;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const audio = new Audio(`${BASE}audio/tts/${key}.mp3`);
    audioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return { speak, stop };
}
