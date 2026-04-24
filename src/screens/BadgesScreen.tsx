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
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12 4l-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div className="badges-title">Mes badges</div>
      </div>

      <div className="badges-banner">
        <div className="badges-banner-eyebrow">Collection</div>
        <div className="badges-banner-count">
          {earnedBadges.length}
          <span>/ {ALL_BADGE_DEFINITIONS.length} badges</span>
        </div>
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
