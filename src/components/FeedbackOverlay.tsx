import { useEffect, useState } from 'react';
import DotGrid from './DotGrid';
import StrategyHint from './StrategyHint';
import { getStrategy } from '../lib/strategies';
import { pickRandom } from '../lib/utils';
import type { BoxLevel } from '../types';
import './FeedbackOverlay.css';

interface FeedbackOverlayProps {
  correct: boolean;
  fast: boolean;   // < 3s
  slow: boolean;   // > 5s
  correctAnswer: number;
  fact: { a: number; b: number };
  /** Niveau Leitner actuel du fait (pour ne montrer la stratégie qu'en phase d'apprentissage). */
  factBox: BoxLevel;
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

export default function FeedbackOverlay({
  correct,
  fast,
  slow,
  correctAnswer,
  fact,
  factBox,
  onDismiss,
}: FeedbackOverlayProps) {
  // Pick message once on mount (stable across re-renders)
  const [message] = useState(() =>
    pickRandom(correct ? CORRECT_MESSAGES : INCORRECT_MESSAGES),
  );

  useEffect(() => {
    if (!correct) return;
    const timer = setTimeout(onDismiss, 1800);
    return () => clearTimeout(timer);
  }, [correct, onDismiss]);

  if (correct) {
    const subMessage = slow ? 'Essaie un peu plus vite la prochaine fois !' : '';

    return (
      <div className="feedback-overlay correct" onClick={onDismiss}>
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

  const strategy = factBox <= 2 ? getStrategy(fact.a, fact.b) : null;

  return (
    <div className="feedback-overlay incorrect">
      <div className="feedback-card">
        <div className="feedback-emoji">{'\uD83E\uDD14'}</div>
        <div className="feedback-message incorrect">{message}</div>
        <div className="feedback-answer">
          {fact.a} {'\u00D7'} {fact.b} = {correctAnswer}
        </div>
        {strategy && <StrategyHint strategy={strategy} variant="feedback" />}
        <div className="feedback-dotgrid">
          <DotGrid a={fact.a} b={fact.b} animated={false} size="small" />
        </div>
        <button type="button" className="feedback-ok-btn" onClick={onDismiss}>
          OK
        </button>
      </div>
    </div>
  );
}
