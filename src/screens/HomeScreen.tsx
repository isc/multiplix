import { useRef, useCallback } from 'react';
import type { UserProfile } from '../types';
import Mascot from '../components/Mascot';
import { useSound } from '../hooks/useSound';
import './HomeScreen.css';

interface HomeScreenProps {
  profile: UserProfile;
  onStart: () => void;
  onShowProgress: () => void;
  onShowBadges: () => void;
  onShowRules: () => void;
  onShowParent: () => void;
}

export default function HomeScreen({
  profile,
  onStart,
  onShowProgress,
  onShowBadges,
  onShowRules,
  onShowParent,
}: HomeScreenProps) {
  const { isMuted, toggleMute } = useSound();
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleParentPressStart = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault(); // Prevent iOS text selection / callout on long press
    longPressTimer.current = setTimeout(() => {
      onShowParent();
    }, 1500);
  }, [onShowParent]);

  const handleParentPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const streakLabel =
    profile.currentStreak === 0
      ? 'Commence ta série !'
      : profile.currentStreak === 1
        ? '1 jour'
        : `${profile.currentStreak} jours`;

  return (
    <div className="home-screen">
      {/* Parent access: hidden gear icon with long press */}
      <div className="home-top-bar">
        <button
          className="home-mute-btn"
          onClick={toggleMute}
          aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
        >
          {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
        </button>
        <button
          className="home-parent-btn"
          onMouseDown={handleParentPressStart}
          onMouseUp={handleParentPressEnd}
          onMouseLeave={handleParentPressEnd}
          onTouchStart={handleParentPressStart}
          onTouchEnd={handleParentPressEnd}
          onTouchCancel={handleParentPressEnd}
          aria-label="Accès parent (appui long)"
        >
          {'\u2699\uFE0F'}
        </button>
      </div>

      <Mascot level={profile.mascotLevel} mood="idle" size="large" showLabel />

      <div className="home-greeting">
        Salut <span>{profile.name}</span> !
      </div>

      {profile.currentStreak > 0 && (
        <div className="home-streak">
          <span className="home-streak-flame">{'\uD83D\uDD25'}</span>
          <span className="home-streak-count">{streakLabel}</span>
          <span className="home-streak-label">de suite</span>
        </div>
      )}

      {profile.currentStreak === 0 && profile.totalSessions > 0 && (
        <div className="home-streak">
          <span className="home-streak-flame" style={{ animation: 'none', opacity: 0.4 }}>{'\uD83D\uDD25'}</span>
          <span className="home-streak-label">Tu m'as manqué ! On s'y remet ?</span>
        </div>
      )}

      <button className="home-start-btn" onClick={onStart}>
        C'est parti !
      </button>

      <div className="home-nav">
        <button className="home-nav-btn" onClick={onShowProgress}>
          {'\uD83D\uDDFA\uFE0F'} Progr\u00E8s
        </button>
        <button className="home-nav-btn" onClick={onShowBadges}>
          {'\uD83C\uDFC5'} Badges
        </button>
        <button className="home-nav-btn" onClick={onShowRules}>
          {'\uD83D\uDCCF'} R\u00E8gles
        </button>
      </div>
    </div>
  );
}
