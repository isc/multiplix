import { useEffect, useRef } from 'react';
import type { SessionResult, Badge as BadgeType } from '../types';
import { BADGE_IDS } from '../types';
import Mascot from '../components/Mascot';
import Badge from '../components/Badge';
import { useSound } from '../hooks/useSound';
import { useTTS } from '../hooks/useTTS';
import { useConfetti } from '../hooks/useConfetti';
import './RecapScreen.css';

interface RecapScreenProps {
  result: SessionResult;
  newBadges: BadgeType[];
  newlyCompletedTables: number[];
  knownFactsCount: number;
  totalFacts: number;
  onFinish: () => void;
  onShowProgress: () => void;
}

export default function RecapScreen({
  result,
  newBadges,
  newlyCompletedTables,
  knownFactsCount,
  totalFacts,
  onFinish,
  onShowProgress,
}: RecapScreenProps) {
  const { isMuted, playBadge, playTableComplete, playImageComplete } = useSound();
  const { speak } = useTTS(isMuted);
  const { triggerConfetti } = useConfetti();
  const hasPlayedRef = useRef(false);

  const imageJustCompleted = newBadges.some((b) => b.id === BADGE_IDS.GENIE_MATHS);

  useEffect(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    if (imageJustCompleted) {
      playImageComplete();
      triggerConfetti();
    } else if (newlyCompletedTables.length > 0) {
      playTableComplete();
      triggerConfetti();
    } else if (newBadges.length > 0) {
      playBadge();
      triggerConfetti();
    }
  }, [imageJustCompleted, newBadges, newlyCompletedTables, playBadge, playImageComplete, playTableComplete, triggerConfetti]);

  // Speak on every mount (including StrictMode's simulated remount in dev).
  // The useTTS cleanup on unmount would otherwise silence the audio if speak
  // were gated behind hasPlayedRef.
  useEffect(() => {
    speak('recap-done');
  }, [speak]);

  const mascotMood =
    imageJustCompleted || newlyCompletedTables.length > 0
      ? 'celebrate'
      : newBadges.length > 0
        ? 'happy'
        : 'idle';

  return (
    <div className="recap-screen">
      {newlyCompletedTables.length > 0 && (
        <div className="recap-table-complete">
          <div className="recap-table-complete-icon">
            {newlyCompletedTables.length === 1 ? '\u2B50' : '\u{1F31F}'}
          </div>
          <div className="recap-table-complete-title">
            {newlyCompletedTables.length === 1
              ? `Tu as maîtrisé la table de ${newlyCompletedTables[0]}\u202F!`
              : `Tu as maîtrisé les tables de ${newlyCompletedTables.join(' et ')}\u202F!`}
          </div>
          <div className="recap-table-complete-subtitle">
            Tous les faits sont en boîte 5 !
          </div>
        </div>
      )}

      <Mascot mood={mascotMood} size="normal" />

      <div className="recap-title">Séance terminée !</div>

      <div className="recap-message">Bravo, tu as bien travaillé !</div>

      {result.newFactsIntroduced > 0 && (
        <div className="recap-stat">
          <div className="recap-stat-value">{result.newFactsIntroduced}</div>
          <div>nouveau{result.newFactsIntroduced > 1 ? 'x' : ''}</div>
        </div>
      )}

      <button
        className={`recap-image-link${result.factsPromoted > 0 ? ' has-changed' : ''}`}
        onClick={onShowProgress}
      >
        {result.factsPromoted > 0 ? (
          <>
            <span className="recap-image-link-teaser">Ton image a changé !</span>
            <span className="recap-image-link-cta">Viens la voir →</span>
          </>
        ) : (
          <span className="recap-image-link-cta">Voir mon image →</span>
        )}
      </button>

      <div className="recap-progress">
        <div className="recap-progress-label">
          Tu connais {knownFactsCount} fait{knownFactsCount > 1 ? 's' : ''} sur {totalFacts}
        </div>
        <div className="recap-progress-bar">
          <div
            className="recap-progress-fill"
            style={{ width: `${(knownFactsCount / totalFacts) * 100}%` }}
          />
        </div>
      </div>

      {newBadges.length > 0 && (
        <div className="recap-badges">
          {newBadges.map((badge, i) => (
            <div
              key={badge.id}
              className="recap-new-badge"
              style={{ animationDelay: `${i * 0.3}s` }}
            >
              <Badge badge={badge} earned earnedDate={badge.earnedDate} />
            </div>
          ))}
        </div>
      )}

      <button className="recap-btn" onClick={onFinish}>
        À demain !
      </button>
    </div>
  );
}
