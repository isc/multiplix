import { medallionColorFor } from '../lib/badges';
import './Badge.css';

interface BadgeProps {
  badge: {
    id: string;
    name: string;
    description: string;
    icon: string;
  };
  earned: boolean;
  earnedDate?: string;
  onClick?: () => void;
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="badge-lock" aria-hidden="true">
      <rect x="3" y="6" width="6" height="5" rx="1" fill="currentColor" />
      <path d="M4 6 L 4 4.5 C 4 3, 5 2.5, 6 2.5 C 7 2.5, 8 3, 8 4.5 L 8 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function Badge({ badge, earned, earnedDate, onClick }: BadgeProps) {
  const color = earned ? medallionColorFor(badge.id) : 'var(--ink-muted)';
  const label = earned
    ? `${badge.name}, débloqué — voir les détails`
    : `${badge.name}, verrouillé — voir comment le débloquer`;
  return (
    <button
      type="button"
      className={`badge ${earned ? 'earned' : 'locked'}`}
      onClick={onClick}
      aria-label={label}
    >
      <div
        className="badge-medallion"
        style={{ '--medallion-color': color } as React.CSSProperties}
      >
        {badge.icon}
      </div>
      <div className="badge-name">{badge.name}</div>
      <div className="badge-date">
        {earned && earnedDate
          ? new Date(earnedDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
            })
          : '—'}
      </div>
      {!earned && <LockIcon />}
    </button>
  );
}
