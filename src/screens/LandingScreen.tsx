import { useState } from 'react';
import Mascot from '../components/Mascot';
import IOSInstallModal from '../components/IOSInstallModal';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { isIOS, isIOSSafari, markInstallSkipped } from '../lib/install';
import './LandingScreen.css';

interface LandingScreenProps {
  onSkip: () => void;
}

export default function LandingScreen({ onSkip }: LandingScreenProps) {
  const { canPrompt, promptInstall } = useInstallPrompt();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const ios = isIOS();
  const iosSafari = isIOSSafari();

  const handleInstall = async () => {
    if (canPrompt) {
      await promptInstall();
      return;
    }
    if (ios) {
      setShowIOSModal(true);
      return;
    }
    // Desktop / Chromium qui n'a pas (encore) déclenché beforeinstallprompt :
    // l'utilisateur peut utiliser le menu du navigateur. On lui montre le modal
    // iOS qui contient une note pour les autres plateformes.
    setShowIOSModal(true);
  };

  const handleSkip = () => {
    markInstallSkipped();
    onSkip();
  };

  return (
    <div className="landing">
      <div className="landing-hero">
        <div className="landing-mascot">
          <Mascot mood="happy" />
        </div>
        <h1 className="landing-title">Multiplix</h1>
        <p className="landing-tagline">
          Apprendre les tables de multiplication, en douceur.
        </p>
      </div>

      <ul className="landing-principles">
        <li>
          <span className="landing-principle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M3 12a9 9 0 1 0 3-6.7M3 4v5h5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Méthode Leitner.</strong> Chaque multiplication revient
            juste avant que l'enfant l'oublie — la mémoire s'ancre durablement.
          </span>
        </li>
        <li>
          <span className="landing-principle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <path
                d="M12 21s-7-4.5-7-11a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 6.5-7 11-7 11z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Pas de notes, pas de classement.</strong> On célèbre le
            progrès, pas la performance. Aucun message négatif.
          </span>
        </li>
        <li>
          <span className="landing-principle-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="22" height="22">
              <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path
                d="M8 12l3 3 5-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>Hors-ligne, sans pub, sans compte.</strong> Une fois
            installé, plus besoin de connexion. Les données restent sur
            l'appareil.
          </span>
        </li>
      </ul>

      <div className="landing-cta">
        <button
          type="button"
          className="landing-install-btn"
          onClick={handleInstall}
        >
          Installer Multiplix
        </button>
        <p className="landing-install-hint">
          {iosSafari
            ? "Sur iPhone / iPad, l'ajout se fait via le bouton de partage de Safari."
            : ios
              ? 'Ouvre cette page dans Safari pour pouvoir installer l’app.'
              : "L'app s'installera comme n'importe quelle autre application."}
        </p>

        <button
          type="button"
          className="landing-skip-btn"
          onClick={handleSkip}
        >
          Essayer dans le navigateur
        </button>
        <p className="landing-skip-warning">
          Attention&nbsp;: si tu installes Multiplix plus tard sur iPhone ou
          iPad, la progression du navigateur ne sera pas conservée.
        </p>
      </div>

      {showIOSModal && <IOSInstallModal onClose={() => setShowIOSModal(false)} />}
    </div>
  );
}
