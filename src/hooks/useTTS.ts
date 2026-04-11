import { useCallback, useRef, useEffect } from 'react';

const HAS_SPEECH = typeof speechSynthesis !== 'undefined';

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
  const mutedRef = useRef(isMuted);
  mutedRef.current = isMuted;

  useEffect(() => {
    if (!HAS_SPEECH) return;
    const update = () => {
      voiceRef.current = pickFrenchVoice();
    };
    update();
    speechSynthesis.addEventListener('voiceschanged', update);
    return () => speechSynthesis.removeEventListener('voiceschanged', update);
  }, []);

  // Stable identity: reads isMuted from ref, not closure
  const speak = useCallback((text: string) => {
    if (mutedRef.current || !HAS_SPEECH) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.9;
    if (voiceRef.current) {
      utterance.voice = voiceRef.current;
    }
    speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    if (HAS_SPEECH) speechSynthesis.cancel();
  }, []);

  // Cancel in-flight speech when muted; clean up on unmount
  useEffect(() => {
    if (!HAS_SPEECH) return;
    if (isMuted) speechSynthesis.cancel();
    return () => speechSynthesis.cancel();
  }, [isMuted]);

  return { speak, stop };
}
