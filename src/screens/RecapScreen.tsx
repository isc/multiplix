import { useEffect, useRef } from 'react';
import type { SessionResult, Badge as BadgeType } from '../types';
import Mascot from '../components/Mascot';
import Badge from '../components/Badge';
import { useSound } from '../hooks/useSound';
import { useConfetti } from '../hooks/useConfetti';
import './RecapScreen.css';

interface RecapScreenProps {
  result: SessionResult;
  newBadges: BadgeType[];
  newlyCompletedTables: number[];
  mascotLevel: number;
  previousMascotLevel: number;
  knownFactsCount: number;
  totalFacts: number;
  onFinish: () => void;
}

export default function RecapScreen({
  result,
  newBadges,
  newlyCompletedTables,
  mascotLevel,
  previousMascotLevel,
  knownFactsCount,
  totalFacts,
  onFinish,
}: RecapScreenProps) {
  const { playBadge, playLevelUp } = useSound();
  const { triggerConfetti } = useConfetti();
  const hasPlayedRef = useRef(false);

  const leveledUp = mascotLevel > previousMascotLevel;

  useEffect(() => {
    if (hasPlayedRef.current) return;
    hasPlayedRef.current = true;

    if (newlyCompletedTables.length > 0) {
      playLevelUp();
      triggerConfetti();
    } else if (leveledUp) {
      playLevelUp();
      triggerConfetti();
    } else if (newBadges.length > 0) {
      playBadge();
      triggerConfetti();
    }
  }, [leveledUp, newBadges.length, newlyCompletedTables.length, playBadge, playLevelUp, triggerConfetti]);

  const mascotMood =
    newlyCompletedTables.length > 0 || leveledUp
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

      <Mascot level={mascotLevel} mood={mascotMood as 'celebrate' | 'happy' | 'idle'} size="normal" />

      <div className="recap-title">Séance terminée !</div>

      <div className="recap-message">Bravo, tu as bien travaillé !</div>

      <div className="recap-stats">
        {result.newFactsIntroduced > 0 && (
          <div className="recap-stat">
            <div className="recap-stat-value">{result.newFactsIntroduced}</div>
            <div>nouveau{result.newFactsIntroduced > 1 ? 'x' : ''}</div>
          </div>
        )}
        {result.factsPromoted > 0 && (
          <div className="recap-stat">
            <div className="recap-stat-value">{result.factsPromoted}</div>
            <div>progrès</div>
          </div>
        )}
      </div>

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
