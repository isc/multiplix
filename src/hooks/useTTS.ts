import { useCallback, useRef, useEffect } from 'react';

const HAS_SPEECH = typeof speechSynthesis !== 'undefined';

/**
 * Select the best available French voice.
 * Prefers a voice whose lang starts with "fr". Returns undefined if none found
 * (speechSynthesis will fall back to the system default).
 */
function pickFrenchVoice(): SpeechSynthesisVoice | undefined {
  if (!HAS_SPEECH) return undefined;
  const voices = speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'fr-FR') ??
    voices.find((v) => v.lang.startsWith('fr'))
  );
}

export function useTTS(isMuted: boolean) {
  const voiceRef = useRef<SpeechSynthesisVoice | undefined>(undefined);

  // Voices may load asynchronously — listen for the event
  useEffect(() => {
    if (!HAS_SPEECH) return;
    const update = () => {
      voiceRef.current = pickFrenchVoice();
    };
    update();
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (isMuted || !HAS_SPEECH) return;

      // Cancel any ongoing speech before starting a new one
      speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fr-FR';
      utterance.rate = 0.9; // Slightly slower for children
      if (voiceRef.current) {
        utterance.voice = voiceRef.current;
      }
      speechSynthesis.speak(utterance);
    },
    [isMuted],
  );

  const stop = useCallback(() => {
    if (HAS_SPEECH) speechSynthesis.cancel();
  }, []);

  // Stop speech when muted or on unmount
  useEffect(() => {
    if (!HAS_SPEECH) return;
    if (isMuted) speechSynthesis.cancel();
    return () => speechSynthesis.cancel();
  }, [isMuted]);

  return { speak, stop };
}
