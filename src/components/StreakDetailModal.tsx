import type { UserProfile } from '../types';
import FlameIcon from './FlameIcon';
import Modal from './Modal';
import './StreakDetailModal.css';

interface StreakDetailModalProps {
  profile: UserProfile;
  onClose: () => void;
}

export default function StreakDetailModal({ profile, onClose }: StreakDetailModalProps) {
  const streak = profile.currentStreak;
  const record = profile.longestStreak;
  const active = streak > 0;
  const showRecord = record > streak;

  const title = active
    ? `${streak} ${streak === 1 ? 'jour' : 'jours'} d’affilée`
    : 'Lance une nouvelle série !';
  const explanation = active
    ? 'Reviens jouer demain pour faire +1. Si tu sautes un jour, la série repart à zéro — mais tu gardes tous tes progrès sur les multiplications.'
    : 'Ta série de jours d’affilée est à zéro. Tes progrès sur les multiplications sont conservés : joue aujourd’hui pour repartir.';

  return (
    <Modal onClose={onClose} labelledBy="streak-detail-title" className="streak-detail-modal">
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

      <button type="button" className="modal-close-btn" onClick={onClose}>
        Fermer
      </button>
    </Modal>
  );
}
