import { useEffect } from 'react';
import type { BadgeDefinition } from '../lib/badges';
import { getBadgeDetail, medallionColorFor } from '../lib/badges';
import type { UserProfile } from '../types';
import './BadgeDetailModal.css';

interface BadgeDetailModalProps {
  badge: BadgeDefinition;
  earned: boolean;
  earnedDate?: string;
  profile: UserProfile;
  onClose: () => void;
}

export default function BadgeDetailModal({
  badge,
  earned,
  earnedDate,
  profile,
  onClose,
}: BadgeDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const detail = getBadgeDetail(badge.id, profile);
  const color = earned ? medallionColorFor(badge.id) : 'var(--ink-muted)';
  const progress = detail.progress;
  const showProgress = !earned && progress && progress.target > 0;
  const percent = progress && progress.target > 0
    ? Math.min(100, Math.round((progress.current / progress.target) * 100))
    : 0;
  const remaining = progress ? Math.max(0, progress.target - progress.current) : 0;

  let hint: string | null = null;
  if (showProgress && progress) {
    if (progress.current === 0) {
      hint = 'Tu n’as pas encore commencé celui-ci. À toi de jouer !';
    } else if (remaining === 1) {
      hint = 'Plus qu’un seul ! Tu y es presque.';
    } else if (remaining <= 3) {
      hint = `Plus que ${remaining} ! Tu y es presque.`;
    } else {
      hint = `Encore ${remaining} pour le débloquer.`;
    }
  }

  return (
    <div className="badge-detail-overlay" onClick={onClose}>
      <div
        className="badge-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="badge-detail-title"
      >
        <div
          className={`badge-detail-medallion ${earned ? 'earned' : 'locked'}`}
          style={{ '--medallion-color': color } as React.CSSProperties}
        >
          {badge.icon}
        </div>

        <h2 id="badge-detail-title" className="badge-detail-title">
          {badge.name}
        </h2>

        <p className="badge-detail-condition">{detail.conditionText}</p>

        {showProgress && progress && (
          <div className="badge-detail-progress">
            <div className="badge-detail-progress-bar">
              <div
                className="badge-detail-progress-fill"
                style={{ width: `${percent}%` }}
              />
            </div>
            <div className="badge-detail-progress-label">
              {progress.current} / {progress.target} {progress.unitLabel}
            </div>
            {hint && <div className="badge-detail-hint">{hint}</div>}
          </div>
        )}

        {earned && earnedDate && (
          <div className="badge-detail-earned">
            <span className="badge-detail-earned-check" aria-hidden="true">✓</span>
            Débloqué le{' '}
            {new Date(earnedDate).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}

        <button type="button" className="badge-detail-close-btn" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
