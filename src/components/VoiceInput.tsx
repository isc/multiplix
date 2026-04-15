import { useCallback, useEffect, useRef, useState } from 'react';
import NumPad from './NumPad';
import { parseFrenchNumber } from '../lib/parseFrenchNumber';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import './VoiceInput.css';

interface VoiceInputProps {
  onSubmit: (value: number) => void;
  disabled?: boolean;
  // If the TTS is speaking the question, pause listening until it's done.
  isSpeaking?: boolean;
  // Token that changes between questions so we can restart listening.
  questionToken?: string | number;
  // Expected answer — if provided, we validate instantly when the transcript
  // matches it (fast path for correct answers, immune to TTS echo since the
  // echo would say the operands, not the product).
  expectedValue?: number;
}

const MAX_PARSE_FAILS_BEFORE_KEYPAD = 3;
// After the TTS ends, Chrome's recognition may still emit a final carrying
// speaker→mic echo. Drop non-matching finals within this window so the echo
// doesn't count as a wrong answer or push the user to the keypad fallback.
const POST_TTS_GRACE_MS = 2000;

// Try whole-string parse, and if that fails, try the trailing 1-3 tokens
// (handles filler words like "euh 30" or mis-heard prefixes like "prendre 30").
function parseWithTrailingFallback(text: string): number | null {
  const direct = parseFrenchNumber(text);
  if (direct !== null && direct >= 0 && direct <= 100) return direct;
  const tokens = text.trim().split(/\s+/).filter(Boolean);
  for (let k = 1; k <= Math.min(3, tokens.length); k++) {
    const tail = tokens.slice(-k).join(' ');
    const n = parseFrenchNumber(tail);
    if (n !== null && n >= 0 && n <= 100) return n;
  }
  return null;
}

function pickBestNumber(primary: string, alternatives: string[]): number | null {
  const candidates = [primary, ...alternatives];
  for (const c of candidates) {
    const n = parseWithTrailingFallback(c);
    if (n !== null) return n;
  }
  return null;
}

function transcriptMatchesExpected(text: string, expected: number): boolean {
  return parseWithTrailingFallback(text) === expected;
}

// Only display something if the transcript parses as a valid number answer.
// Raw text like "6 x 530" is never what the user meant — it's noise or echo.
function displayTranscript(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const n = parseFrenchNumber(trimmed);
  if (n !== null && n >= 0 && n <= 100) return String(n);
  return '';
}

export default function VoiceInput({
  onSubmit,
  disabled = false,
  isSpeaking = false,
  questionToken,
  expectedValue,
}: VoiceInputProps) {
  const [interim, setInterim] = useState('');
  const [lastHeard, setLastHeard] = useState('');
  const [showKeypad, setShowKeypad] = useState(false);
  const [, setParseFails] = useState(0);
  const [prevQuestionToken, setPrevQuestionToken] = useState(questionToken);
  const disabledRef = useRef(disabled);
  const expectedRef = useRef(expectedValue);
  const lastSpeakEndRef = useRef<number>(Date.now());

  useEffect(() => {
    disabledRef.current = disabled;
  }, [disabled]);
  useEffect(() => {
    expectedRef.current = expectedValue;
  }, [expectedValue]);
  useEffect(() => {
    if (!isSpeaking) {
      lastSpeakEndRef.current = Date.now();
    }
  }, [isSpeaking, questionToken]);

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
      const withinGrace = Date.now() - lastSpeakEndRef.current < POST_TTS_GRACE_MS;
      const expected = expectedRef.current;
      if (withinGrace && (best === null || best !== expected)) {
        // Drop echo silently — don't count it as a user parse failure,
        // otherwise 3 consecutive echoes would flip us to the keypad.
        return;
      }
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

  const handleInterim = useCallback(
    (text: string) => {
      setInterim(text);
      const expected = expectedRef.current;
      if (expected === undefined || disabledRef.current) return;
      // Fast path: validate instantly when the transcript matches the
      // expected answer (directly or via trailing-token fallback).
      if (transcriptMatchesExpected(text, expected)) {
        setLastHeard(text.trim());
        setInterim('');
        setParseFails(0);
        onSubmit(expected);
      }
    },
    [onSubmit],
  );

  const { start, abort, isListening, error, isSupported } = useSpeechRecognition({
    onFinal: handleFinal,
    onInterim: handleInterim,
    lang: 'fr-FR',
  });

  useEffect(() => {
    if (!isSupported) return;
    if (disabled || showKeypad || isSpeaking) {
      // Use abort() (not stop()) because Chrome's stop() keeps emitting
      // interims/finals for ~1s afterwards from audio it already buffered.
      abort();
      return;
    }
    start();
    return () => abort();
  }, [questionToken, disabled, isSpeaking, showKeypad, isSupported, start, abort]);

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
          if (isListening) abort();
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
        {displayTranscript(interim) || displayTranscript(lastHeard) || (isListening ? 'Je t\'\u00E9coute\u2026' : 'Appuie pour parler')}
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
