import type { ReactNode } from 'react';
import { getIOSMajorVersion } from '../lib/install';
import './IOSInstallModal.css';

interface IOSInstallModalProps {
  onClose: () => void;
}

const ShareIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <path
      d="M12 3v12M8 7l4-4 4 4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const PlusSquareIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <rect
      x="3"
      y="3"
      width="18"
      height="18"
      rx="4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    />
    <path
      d="M12 8v8M8 12h8"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
);

const DotsIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22">
    <circle cx="6" cy="12" r="1.6" fill="currentColor" />
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <circle cx="18" cy="12" r="1.6" fill="currentColor" />
  </svg>
);

function classicSteps(): ReactNode[] {
  return [
    <>
      Touche le bouton de partage
      <span className="ios-install-icon" aria-hidden="true">
        <ShareIcon />
      </span>
      en bas de l'écran.
    </>,
    <>
      Choisis « Sur l'écran d'accueil »
      <span className="ios-install-icon" aria-hidden="true">
        <PlusSquareIcon />
      </span>
      dans la liste.
    </>,
    <>
      Touche « Ajouter » en haut à droite. L'icône Multiplix apparaît sur ton
      écran d'accueil.
    </>,
  ];
}

function modernSteps(): ReactNode[] {
  return [
    <>
      Touche le bouton
      <span className="ios-install-icon" aria-hidden="true">
        <DotsIcon />
      </span>
      en bas à droite de Safari.
    </>,
    <>
      Choisis « Partager »
      <span className="ios-install-icon" aria-hidden="true">
        <ShareIcon />
      </span>
      dans le menu qui s'ouvre.
    </>,
    <>
      Touche « Plus » (« More ») en bas à droite du menu de partage pour
      afficher toutes les actions.
    </>,
    <>
      Choisis « Sur l'écran d'accueil »
      <span className="ios-install-icon" aria-hidden="true">
        <PlusSquareIcon />
      </span>
      , puis touche « Ajouter ». L'icône Multiplix apparaît sur ton écran
      d'accueil.
    </>,
  ];
}

export default function IOSInstallModal({ onClose }: IOSInstallModalProps) {
  const version = getIOSMajorVersion();
  const isModern = version !== null && version >= 26;
  const steps = isModern ? modernSteps() : classicSteps();

  return (
    <div className="ios-install-backdrop" onClick={onClose}>
      <div
        className="ios-install-modal"
        role="dialog"
        aria-labelledby="ios-install-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="ios-install-title" className="ios-install-title">
          Installer Multiplix sur iPhone / iPad
        </h2>
        <p className="ios-install-intro">
          Sur Safari, ajoute l'app à ton écran d'accueil pour la lancer comme
          n'importe quelle autre application&nbsp;:
        </p>

        <ol className="ios-install-steps">
          {steps.map((step, i) => (
            <li key={i}>
              <span className="ios-install-step-num">{i + 1}</span>
              <span className="ios-install-step-text">{step}</span>
            </li>
          ))}
        </ol>

        <p className="ios-install-note">
          Astuce&nbsp;: dans Chrome ou Firefox sur iOS, l'ajout à l'écran
          d'accueil n'est pas disponible — ouvre cette page dans Safari.
        </p>

        <button type="button" className="ios-install-close" onClick={onClose}>
          J'ai compris
        </button>
      </div>
    </div>
  );
}
