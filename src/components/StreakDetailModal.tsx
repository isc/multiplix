import { useEffect } from 'react';
import type { UserProfile } from '../types';
import FlameIcon from './FlameIcon';
import './StreakDetailModal.css';

interface StreakDetailModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function StreakDetailModal({ profile, onClose }: StreakDetailModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const streak = profile.currentStreak;
  const record = profile.longestStreak;
  const active = streak > 0;
  const showRecord = record > 0 && record > streak;

  let title: string;
  let explanation: string;
  if (active) {
    title = `${streak} ${streak === 1 ? 'jour' : 'jours'} d’affilée`;
    explanation =
      'Reviens jouer demain pour faire +1. Si tu sautes un jour, la série repart à zéro — mais tu gardes tous tes progrès sur les multiplications.';
  } else {
    title = 'Lance une nouvelle série !';
    explanation =
      'Ta série de jours d’affilée est à zéro. Tes progrès sur les multiplications sont conservés : joue aujourd’hui pour repartir.';
  }

  return (
    <div className="streak-detail-overlay" onClick={onClose}>
      <div
        className="streak-detail-modal"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="streak-detail-title"
      >
        <div className={`streak-detail-flame ${active ? '' : 'is-muted'}`}>
          <FlameIcon size={64} muted={!active} />
        </div>

        <h2 id="streak-detail-title" className="streak-detail-title">
          {title}
        </h2>

        <p className="streak-detail-explanation">{explanation}</p>

        {showRecord && (
          <div className="streak-detail-record">
            <span className="streak-detail-record-label">Ton record</span>
            <span className="streak-detail-record-value">
              {record} {record === 1 ? 'jour' : 'jours'}
            </span>
          </div>
        )}

        <button type="button" className="streak-detail-close-btn" onClick={onClose}>
          Fermer
        </button>
      </div>
    </div>
  );
}
