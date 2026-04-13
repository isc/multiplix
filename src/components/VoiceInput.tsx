import { useCallback, useEffect, useRef, useState } from 'react';
import NumPad from './NumPad';
import { parseFrenchNumber } from '../lib/parseFrenchNumber';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './VoiceInput.css';

interface VoiceInputProps {
  onSubmit: (value: number) => void;
  disabled?: boolean;
  // Optional: if the TTS is speaking the question, pause listening until it's done.
  isSpeaking?: boolean;
  // Token that changes between questions so we can restart listening.
  questionToken?: string | number;
}

const MAX_PARSE_FAILS_BEFORE_KEYPAD = 3;

// Tries the primary transcript and each alternative; returns the first
// plausible number (0..100).
function pickBestNumber(primary: string, alternatives: string[]): number | null {
  const candidates = [primary, ...alternatives];
  for (const c of candidates) {
    const n = parseFrenchNumber(c);
    if (n !== null && n >= 0 && n <= 100) return n;
  }
  return null;
}

export default function VoiceInput({
  onSubmit,
  disabled = false,
  isSpeaking = false,
  questionToken,
}: VoiceInputProps) {
  const [interim, setInterim] = useState('');
  const [lastHeard, setLastHeard] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [, setParseFails] = useState(0);
  const [prevQuestionToken, setPrevQuestionToken] = useState(questionToken);
  const disabledRef = useRef(disabled);
  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);

  if (questionToken !== prevQuestionToken) {
    setPrevQuestionToken(questionToken);
    setInterim('');
    setLastHeard('');
    setParseFails(0);
  }

  const handleFinal = useCallback(
    (transcript: string, alternatives: string[]) => {
      if (disabledRef.current) return;
      const best = pickBestNumber(transcript, alternatives);
      setLastHeard(transcript.trim());
      setInterim('');
      if (best !== null) {
        setParseFails(0);
        onSubmit(best);
      } else {
        setParseFails((n) => {
          const next = n + 1;
          if (next >= MAX_PARSE_FAILS_BEFORE_KEYPAD) {
            setShowKeypad(true);
          }
          return next;
        });
      }
    },
    [onSubmit],
  );

  const handleInterim = useCallback((text: string) => {
    setInterim(text);
  }, []);

  const { start, stop, isListening, error, isSupported } = useSpeechRecognition({
    onFinal: handleFinal,
    onInterim: handleInterim,
    lang: 'fr-FR',
  });

  useEffect(() => {
    if (!isSupported) return;
    if (disabled || showKeypad || isSpeaking) {
      stop();
      return;
    }
    start();
    return () => stop();
  }, [questionToken, disabled, isSpeaking, showKeypad, isSupported, start, stop]);

  // If unsupported, fall through to the keypad.
  if (!isSupported) {
    return <NumPad onSubmit={onSubmit} disabled={disabled} />;
  }

  if (showKeypad) {
    return (
      <div className="voice-fallback">
        <div className="voice-fallback-msg">
          Je t'entends mal. Tape ta réponse !
        </div>
        <NumPad onSubmit={onSubmit} disabled={disabled} />
        <button
          className="voice-retry-btn"
          onClick={() => {
            setShowKeypad(false);
            setParseFails(0);
          }}
          disabled={disabled}
          aria-label="Réessayer avec la voix"
        >
          {'\uD83C\uDFA4'} Réessayer avec la voix
        </button>
      </div>
    );
  }

  const permissionBlocked = error === 'not-allowed' || error === 'service-not-allowed';
  const networkError = error === 'network';

  return (
    <div className="voice-input">
      <button
        type="button"
        className={`voice-mic${isListening ? ' listening' : ''}${disabled ? ' disabled' : ''}`}
        onClick={() => {
          if (disabled) return;
          if (isListening) stop();
          else start();
        }}
        aria-label={isListening ? 'Écoute en cours' : 'Parler'}
        aria-pressed={isListening}
        disabled={disabled}
      >
        <span className="voice-mic-icon">{'\uD83C\uDFA4'}</span>
        {isListening && <span className="voice-mic-ring" aria-hidden="true" />}
      </button>

      <div className="voice-transcript" aria-live="polite">
        {interim || lastHeard || (isListening ? 'Je t\'\u00E9coute\u2026' : 'Appuie pour parler')}
      </div>

      {permissionBlocked && (
        <div className="voice-error">
          Le micro est bloqué. Autorise-le dans les paramètres du navigateur.
        </div>
      )}
      {networkError && (
        <div className="voice-error">
          La reconnaissance vocale a besoin d'internet.
        </div>
      )}

      <button
        type="button"
        className="voice-keypad-link"
        onClick={() => setShowKeypad(true)}
        disabled={disabled}
      >
        Utiliser le clavier
      </button>
    </div>
  );
}
