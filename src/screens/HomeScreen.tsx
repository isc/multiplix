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

function IconSoundOn() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
      <path d="M16 8c1.5 1 2.5 2.5 2.5 4s-1 3-2.5 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconSoundOff() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 10v4h3l5 4V6L7 10H4z" fill="currentColor" />
      <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconKeyboard() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="7" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M7 11h.01M11 11h.01M15 11h.01M7 15h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function IconMic() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5 11a7 7 0 0014 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconGear() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M19.43 12.98c.04-.32.07-.65.07-.98 0-.33-.03-.66-.07-.98l2.11-1.65a.5.5 0 00.12-.64l-2-3.46a.5.5 0 00-.61-.22l-2.49 1a7.03 7.03 0 00-1.69-.98l-.38-2.65A.5.5 0 0014 2h-4a.5.5 0 00-.5.42l-.38 2.65c-.61.25-1.17.58-1.69.98l-2.49-1a.5.5 0 00-.61.22l-2 3.46a.5.5 0 00.12.64l2.11 1.65c-.04.32-.07.65-.07.98 0 .33.03.66.07.98l-2.11 1.65a.5.5 0 00-.12.64l2 3.46c.14.22.39.31.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.05.24.26.42.5.42h4c.24 0 .45-.18.5-.42l.38-2.65c.61-.25 1.17-.58 1.69-.98l2.49 1c.22.09.47 0 .61-.22l2-3.46a.5.5 0 00-.12-.64l-2.11-1.65zM12 15.5A3.5 3.5 0 1115.5 12 3.5 3.5 0 0112 15.5z"
        fill="currentColor"
      />
    </svg>
  );
}

function IconImage() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="5" y="7" width="22" height="18" rx="2.5" stroke="var(--ink)" strokeWidth="1.6" fill="var(--sage-soft)" />
      <circle cx="11" cy="13" r="2" fill="var(--sage)" />
      <path d="M6 23l7-7 5 4 7-6" stroke="var(--sage)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function IconBadge() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <circle cx="16" cy="14" r="9" fill="var(--honey)" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="M9 22 L 6 30 L 11 27 L 13 30 L 16 22" fill="var(--coral)" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M23 22 L 26 30 L 21 27 L 19 30 L 16 22" fill="var(--coral)" stroke="var(--ink)" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M16 10 L 17.2 12.5 L 20 13 L 18 15 L 18.4 17.8 L 16 16.5 L 13.6 17.8 L 14 15 L 12 13 L 14.8 12.5 Z" fill="var(--cream)" />
    </svg>
  );
}

function IconRuler() {
  return (
    <svg width="28" height="28" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="5" y="10" width="22" height="12" rx="2" fill="var(--sage-soft)" stroke="var(--ink)" strokeWidth="1.6" />
      <path d="M10 10 L 10 14 M 14 10 L 14 15 M 18 10 L 18 14 M 22 10 L 22 15" stroke="var(--ink)" strokeWidth="1.4" />
    </svg>
  );
}

function IconFlame() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 1c1 2 3 3 3 6 0 1-.5 2-1.5 2.5C10 8 9.5 7 9 6.5c.5 2-.5 3-1 3.5C7 9 6.5 7.5 6.5 7c-1.5 1-2 2-2 3.5C4.5 13 6 15 8 15s3.5-2 3.5-4.5S10 7 8 1z" fill="var(--coral)" stroke="var(--ink)" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
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
    e.preventDefault();
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

  return (
    <div className="home-screen">
      <div className="home-top-bar">
        <div className="home-top-bar-left">
          {profile.currentStreak > 0 ? (
            <div className="home-streak-pill">
              <span className="home-streak-pill-flame"><IconFlame /></span>
              <span className="home-streak-pill-count">{profile.currentStreak}</span>
              <span className="home-streak-pill-label">
                {profile.currentStreak === 1 ? 'jour' : 'jours'}
              </span>
            </div>
          ) : profile.totalSessions > 0 ? (
            <div className="home-streak-pill">
              <span className="home-streak-pill-flame" style={{ opacity: 0.4 }}><IconFlame /></span>
              <span className="home-streak-pill-prompt">On s'y remet&nbsp;?</span>
            </div>
          ) : null}
        </div>
        <div className="home-top-bar-right">
          <button
            className="home-chrome-btn"
            onClick={toggleMute}
            aria-label={isMuted ? 'Activer le son' : 'Couper le son'}
          >
            {isMuted ? <IconSoundOff /> : <IconSoundOn />}
          </button>
          {STT_SUPPORTED && (
            <button
              className={`home-chrome-btn${inputMode === 'voice' ? ' home-mode-active' : ''}`}
              onClick={toggleInputMode}
              aria-label={inputMode === 'voice' ? 'Passer en mode clavier' : 'Passer en mode vocal'}
              aria-pressed={inputMode === 'voice'}
            >
              {inputMode === 'voice' ? <IconMic /> : <IconKeyboard />}
            </button>
          )}
          <button
            className="home-chrome-btn home-parent-btn"
            onMouseDown={handleParentPressStart}
            onMouseUp={handleParentPressEnd}
            onMouseLeave={handleParentPressEnd}
            onTouchStart={handleParentPressStart}
            onTouchEnd={handleParentPressEnd}
            onTouchCancel={handleParentPressEnd}
            aria-label="Accès parent (appui long)"
          >
            <IconGear />
          </button>
        </div>
      </div>

      <div className="home-body">
        <div className="home-mascot-section">
          <div className="home-mascot-wrap">
            <div className="home-mascot-halo" />
            <div className="home-mascot-inner">
              <Mascot mood="idle" />
            </div>
            <div className="home-greeting">
              Salut <span>{profile.name}</span> !
            </div>
          </div>
        </div>

        <div className="home-cta-wrap">
          {hasSessionAvailable ? (
            <button className="home-start-btn" onClick={onStart}>
              {'▶'} C'est parti !
            </button>
          ) : (
            <div className="home-done-msg">Bravo, c'est fait pour aujourd'hui !</div>
          )}
        </div>

        <div className="home-nav">
          <button className="home-nav-btn" onClick={onShowProgress}>
            <span className="home-nav-btn-icon"><IconImage /></span>
            <span className="home-nav-btn-label">Mon image</span>
          </button>
          <button className="home-nav-btn" onClick={onShowBadges}>
            <span className="home-nav-btn-icon"><IconBadge /></span>
            <span className="home-nav-btn-label">Badges</span>
          </button>
          <button className="home-nav-btn" onClick={onShowRules}>
            <span className="home-nav-btn-icon"><IconRuler /></span>
            <span className="home-nav-btn-label">Règles</span>
          </button>
        </div>
      </div>
    </div>
  );
}
