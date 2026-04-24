import { BADGE_IDS } from '../types';
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
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" className="badge-lock" aria-hidden="true">
      <rect x="3" y="6" width="6" height="5" rx="1" fill="currentColor" />
      <path d="M4 6 L 4 4.5 C 4 3, 5 2.5, 6 2.5 C 7 2.5, 8 3, 8 4.5 L 8 6" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

// Couleur propre à chaque badge, cohérente avec la maquette :
// sage pour les jalons « démarrage », honey pour la performance, sky pour
// l'exploration, indigo pour les tables, coral pour tout ce qui touche à
// la régularité / vitesse.
function medallionColorFor(id: string): string {
  if (id === BADGE_IDS.PREMIER_PAS) return 'var(--sage)';
  if (id === BADGE_IDS.REGULIER) return 'var(--coral)';
  if (id === BADGE_IDS.MACHINE) return 'var(--honey)';
  if (id === BADGE_IDS.EXPLORATION) return 'var(--sky)';
  if (id.startsWith(BADGE_IDS.TABLE_PREFIX)) return 'var(--indigo)';
  if (id === BADGE_IDS.GENIE_MATHS) return 'var(--honey)';
  if (id === BADGE_IDS.VELOCE) return 'var(--coral)';
  if (id === BADGE_IDS.PERSEVERANCE) return 'var(--sage)';
  if (id === BADGE_IDS.FLAMME_ETERNELLE) return 'var(--coral)';
  return 'var(--honey)';
}

export default function Badge({ badge, earned, earnedDate }: BadgeProps) {
  const color = earned ? medallionColorFor(badge.id) : 'var(--ink-muted)';
  return (
    <div className={`badge ${earned ? 'earned' : 'locked'}`}>
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
    </div>
  );
}
