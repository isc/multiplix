import { useState } from 'react';
import Mascot from '../components/Mascot';
import './WelcomeScreen.css';

interface WelcomeScreenProps {
  onComplete: (name: string) => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      if (name.trim()) {
        onComplete(name.trim());
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && name.trim()) {
      handleNext();
    }
  };

  return (
    <div className="welcome-screen">
      {step === 0 && (
        <div className="welcome-step" key="step0">
          <Mascot level={1} mood="idle" size="large" />
          <div className="welcome-title">Bonjour !</div>
          <div className="welcome-subtitle">
            Je suis un petit œuf magique.
            <br />
            Aide-moi à grandir en apprenant les tables de multiplication !
          </div>
          <button className="welcome-btn welcome-btn-primary" onClick={handleNext}>
            Suivant
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="welcome-step" key="step1">
          <Mascot level={1} mood="happy" size="normal" />
          <div className="welcome-title">Comment tu t'appelles ?</div>
          <input
            className="welcome-input"
            type="text"
            placeholder="Ton prénom"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            maxLength={20}
          />
          <button
            className="welcome-btn welcome-btn-primary"
            onClick={handleNext}
            disabled={!name.trim()}
          >
            C'est moi !
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="welcome-step" key="step2">
          <Mascot level={1} mood="celebrate" size="large" />
          <div className="welcome-title">
            Salut {name} !
          </div>
          <div className="welcome-subtitle">
            On va apprendre les multiplications ensemble, 5 minutes par jour.
            <br />
            <br />
            Plus tu progresses, plus je grandis !
          </div>
          <button className="welcome-btn welcome-btn-primary" onClick={handleNext}>
            C'est parti !
          </button>
        </div>
      )}

      {/* Step indicator dots */}
      <div className="welcome-dots">
        {[0, 1, 2].map((s) => (
          <div key={s} className={`welcome-dot ${s === step ? 'active' : ''}`} />
        ))}
      </div>
    </div>
  );
}
