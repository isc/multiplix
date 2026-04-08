import type { UserProfile } from '../types';
import ProgressGrid from '../components/ProgressGrid';
import './ProgressScreen.css';

interface ProgressScreenProps {
  profile: UserProfile;
  onBack: () => void;
}

export default function ProgressScreen({ profile, onBack }: ProgressScreenProps) {
  const introduced = profile.facts.filter((f) => f.introduced).length;
  const mastered = profile.facts.filter((f) => f.box >= 4).length;
  const total = profile.facts.length;

  return (
    <div className="progress-screen">
      <div className="progress-header">
        <button className="progress-back-btn" onClick={onBack} aria-label="Retour">
          {'\u2190'}
        </button>
        <div className="progress-title">Ma carte au trésor</div>
      </div>

      <div className="progress-stats-summary">
        <div className="progress-stat">
          <div className="progress-stat-value">{introduced}</div>
          <div className="progress-stat-label">découverts</div>
        </div>
        <div className="progress-stat">
          <div className="progress-stat-value">{mastered}</div>
          <div className="progress-stat-label">maîtrisés</div>
        </div>
        <div className="progress-stat">
          <div className="progress-stat-value">{total}</div>
          <div className="progress-stat-label">au total</div>
        </div>
      </div>

      <ProgressGrid facts={profile.facts} />

      <div className="progress-legend">
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-gray)' }} />
          Nouveau
        </div>
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-red)' }} />
          Difficile
        </div>
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-orange)' }} />
          En cours
        </div>
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-yellow)' }} />
          Progresse
        </div>
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-lightgreen)' }} />
          Presque
        </div>
        <div className="progress-legend-item">
          <div className="progress-legend-dot" style={{ background: 'var(--box-green)' }} />
          Maîtrisé !
        </div>
      </div>
    </div>
  );
}
