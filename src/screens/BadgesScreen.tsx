import type { Badge as BadgeType } from '../types';
import BadgeComponent from '../components/Badge';
import { ALL_BADGE_DEFINITIONS } from '../lib/badges';
import './BadgesScreen.css';

interface BadgesScreenProps {
  earnedBadges: BadgeType[];
  onBack: () => void;
}

export default function BadgesScreen({ earnedBadges, onBack }: BadgesScreenProps) {
  const earnedMap = new Map(earnedBadges.map((b) => [b.id, b]));

  return (
    <div className="badges-screen">
      <div className="badges-header">
        <button className="badges-back-btn" onClick={onBack} aria-label="Retour">
          {'\u2190'}
        </button>
        <div className="badges-title">Mes badges</div>
      </div>

      <div className="badges-count">
        {earnedBadges.length} / {ALL_BADGE_DEFINITIONS.length} badges obtenus
      </div>

      <div className="badges-grid">
        {ALL_BADGE_DEFINITIONS.map((def) => {
          const earned = earnedMap.get(def.id);
          return (
            <BadgeComponent
              key={def.id}
              badge={def}
              earned={!!earned}
              earnedDate={earned?.earnedDate}
            />
          );
        })}
      </div>
    </div>
  );
}
