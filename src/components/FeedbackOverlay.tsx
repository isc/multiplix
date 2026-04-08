import { useEffect } from 'react';
import DotGrid from './DotGrid';
import './FeedbackOverlay.css';

interface FeedbackOverlayProps {
  correct: boolean;
  fast: boolean;   // < 3s
  slow: boolean;   // > 5s
  correctAnswer: number;
  fact: { a: number; b: number };
  onDismiss: () => void;
}

const CORRECT_MESSAGES = [
  'Super !',
  'Bravo !',
  'Génial !',
  'Bien joué !',
  'Excellent !',
  'Parfait !',
  'Trop fort !',
];

const INCORRECT_MESSAGES = [
  "C'est pas grave, on réessaie !",
  'Presque ! La bonne réponse est :',
  'Pas tout à fait, regarde :',
  "T'inquiète, on va y arriver !",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function FeedbackOverlay({
  correct,
  fast,
  slow,
  correctAnswer,
  fact,
  onDismiss,
}: FeedbackOverlayProps) {
  // Auto-dismiss
  useEffect(() => {
    const delay = correct ? 1800 : 3000;
    const timer = setTimeout(onDismiss, delay);
    return () => clearTimeout(timer);
  }, [correct, onDismiss]);

  // Tap to dismiss
  const handleTap = () => {
    onDismiss();
  };

  if (correct) {
    const message = pickRandom(CORRECT_MESSAGES);
    const subMessage = slow
      ? 'Essaie un peu plus vite la prochaine fois !'
      : fast
        ? ''
        : '';

    return (
      <div className="feedback-overlay correct" onClick={handleTap}>
        <div className="feedback-card">
          {fast && (
            <div className="feedback-star" aria-label="Étoile dorée">
              &#11088;
            </div>
          )}
          <div className={`feedback-emoji ${fast ? 'celebrate' : ''}`}>
            {fast ? '\uD83C\uDF89' : '\uD83D\uDE0A'}
          </div>
          <div className="feedback-message correct">{message}</div>
          {subMessage && <div className="feedback-sub">{subMessage}</div>}
        </div>
      </div>
    );
  }

  // Incorrect
  const message = pickRandom(INCORRECT_MESSAGES);

  return (
    <div className="feedback-overlay incorrect" onClick={handleTap}>
      <div className="feedback-card">
        <div className="feedback-emoji">{'\uD83E\uDD14'}</div>
        <div className="feedback-message incorrect">{message}</div>
        <div className="feedback-answer">
          {fact.a} {'\u00D7'} {fact.b} = {correctAnswer}
        </div>
        <div className="feedback-dotgrid">
          <DotGrid a={fact.a} b={fact.b} animated={false} size="small" />
        </div>
      </div>
    </div>
  );
}
