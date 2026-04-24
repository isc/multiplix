import { useEffect, useState } from 'react';
import DotGrid from './DotGrid';
import StrategyHint from './StrategyHint';
import { getStrategy } from '../lib/strategies';
import { pickRandom } from '../lib/utils';
import type { BoxLevel } from '../types';
import './FeedbackOverlay.css';

interface FeedbackOverlayProps {
  correct: boolean;
  fast: boolean;
  slow: boolean;
  correctAnswer: number;
  fact: { a: number; b: number };
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
  'Presque ! La bonne réponse est :',
  'Pas tout à fait, regarde :',
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
          <div className="feedback-message correct">{message}</div>
          <div className="feedback-answer">
            {fact.a} {'×'} {fact.b} = <b>{correctAnswer}</b>
          </div>
          {subMessage && <div className="feedback-sub">{subMessage}</div>}
        </div>
      </div>
    );
  }

  const strategy = factBox <= 2 ? getStrategy(fact.a, fact.b) : null;

  return (
    <div className="feedback-overlay incorrect">
      <div className="feedback-card">
        <div className="feedback-message incorrect">{message}</div>
        <div className="feedback-answer">
          {fact.a} {'×'} {fact.b} = <b>{correctAnswer}</b>
        </div>
        {strategy && <StrategyHint strategy={strategy} variant="feedback" />}
        <div className="feedback-dotgrid">
          <DotGrid a={fact.a} b={fact.b} animated={false} size="small" />
        </div>
        <button type="button" className="feedback-ok-btn" onClick={onDismiss}>
          J'ai compris
        </button>
      </div>
    </div>
  );
}
