import type { Badge as BadgeType } from '../types';
import BadgeComponent, { ALL_BADGES } from '../components/Badge';
import './BadgesScreen.css';

interface BadgesScreenProps {
  earnedBadges: BadgeType[];
  onBack: () => void;
}

export default function BadgesScreen({ earnedBadges, onBack }: BadgesScreenProps) {
  const earnedIds = new Set(earnedBadges.map((b) => b.id));

  return (
    <div className="badges-screen">
      <div className="badges-header">
        <button className="badges-back-btn" onClick={onBack} aria-label="Retour">
          {'\u2190'}
        </button>
        <div className="badges-title">Mes badges</div>
      </div>

      <div className="badges-count">
        {earnedBadges.length} / {ALL_BADGES.length} badges obtenus
      </div>

      <div className="badges-grid">
        {ALL_BADGES.map((badgeDef) => {
          const earnedBadge = earnedBadges.find((b) => b.id === badgeDef.id);
          return (
            <BadgeComponent
              key={badgeDef.id}
              badge={badgeDef}
              earned={earnedIds.has(badgeDef.id)}
              earnedDate={earnedBadge?.earnedDate}
            />
          );
        })}
      </div>
    </div>
  );
}
