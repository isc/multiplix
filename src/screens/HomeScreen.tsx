import { useRef, useCallback } from 'react';
import type { UserProfile } from '../types';
import Mascot from '../components/Mascot';
import { useSound } from '../hooks/useSound';
import { useInputMode } from '../hooks/useInputMode';
import { isSpeechRecognitionSupported } from '../hooks/useSpeechRecognition';
import './HomeScreen.css';

const STT_SUPPORTED = isSpeechRecognitionSupported();

interface HomeScreenProps {
  profile: UserProfile;
  hasSessionAvailable: boolean;
  onStart: () => void;
  onShowProgress: () => void;
  onShowBadges: () => void;
  onShowRules: () => void;
  onShowParent: () => void;
}

export default function HomeScreen({
  profile,
  hasSessionAvailable,
  onStart,
  onShowProgress,
  onShowBadges,
  onShowRules,
  onShowParent,
}: HomeScreenProps) {
  const { isMuted, toggleMute } = useSound();
  const { inputMode, toggleInputMode } = useInputMode();
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
        {STT_SUPPORTED && (
          <button
            className={`home-mute-btn${inputMode === 'voice' ? ' home-mode-active' : ''}`}
            onClick={toggleInputMode}
            aria-label={
              inputMode === 'voice'
                ? 'Passer en mode clavier'
                : 'Passer en mode vocal'
            }
            aria-pressed={inputMode === 'voice'}
            title={
              inputMode === 'voice'
                ? 'Mode vocal actif \u2014 toucher pour revenir au clavier'
                : 'Mode clavier \u2014 toucher pour r\u00E9pondre \u00E0 la voix'
            }
          >
            {inputMode === 'voice' ? '\uD83C\uDFA4' : '\u2328\uFE0F'}
          </button>
        )}
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

      <Mascot mood="idle" size="large" />

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

      {hasSessionAvailable ? (
        <button className="home-start-btn" onClick={onStart}>
          C'est parti !
        </button>
      ) : (
        <div className="home-done-msg">Bravo, c'est fait pour aujourd'hui !</div>
      )}

      <div className="home-nav">
        <button className="home-nav-btn" onClick={onShowProgress}>
          {'\uD83D\uDDFA\uFE0F'} Mon image
        </button>
        <button className="home-nav-btn" onClick={onShowBadges}>
          {'\uD83C\uDFC5'} Badges
        </button>
        <button className="home-nav-btn" onClick={onShowRules}>
          {'\uD83D\uDCCF'} Règles
        </button>
      </div>
    </div>
  );
}
